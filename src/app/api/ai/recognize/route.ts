'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';
import { PDFDocument } from 'pdf-lib';
import crypto from 'crypto';

// Encryption helpers
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET || 'smartschedule-ai-api-key-enc';
    return crypto.createHash('sha256').update(secret).digest();
}

function decrypt(encrypted: string): string {
    const [ivHex, authTagHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export async function POST(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has AI enabled
        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                aiEnabled: true,
                aiApiKey: true,
                aiProvider: true,
                aiModel: true,
            },
        });

        if (!userData || !userData.aiEnabled || !userData.aiApiKey) {
            return NextResponse.json(
                { error: '请先在设置中启用并配置 AI 助手' },
                { status: 403 }
            );
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const requestModel = formData.get('model') as string | null;

        if (!file) {
            return NextResponse.json({ error: '未找到上传文件' }, { status: 400 });
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileType = file.type;
        let imageBase64: string;

        // Handle PDF or image
        if (fileType === 'application/pdf' || fileType.startsWith('image/')) {
            imageBase64 = fileBuffer.toString('base64');
        } else {
            return NextResponse.json(
                { error: '不支持的文件格式，请上传 PDF 或图片' },
                { status: 400 }
            );
        }

        // Decrypt and validate API key
        let apiKey: string;
        try {
            const decryptedKey = decrypt(userData.aiApiKey).trim();
            console.log('Decrypted API key length:', decryptedKey.length);

            if (decryptedKey.length < 30 || decryptedKey.length > 50) {
                throw new Error('API key length invalid');
            }

            if (decryptedKey.startsWith('Failed') || decryptedKey.startsWith('Error')) {
                throw new Error('API key appears to be an error message');
            }

            apiKey = decryptedKey;
        } catch (error: any) {
            console.error('API key validation failed:', error.message);
            return NextResponse.json(
                { error: 'API 密钥无效或已损坏。请在设置中重新配置 Gemini API Key' },
                { status: 400 }
            );
        }

        // Initialize Gemini with new SDK
        const ai = new GoogleGenAI({ apiKey });

        // Priority: request model > user config model > default
        const modelName = requestModel || userData.aiModel || 'gemini-2.0-flash';
        console.log(`Using model: ${modelName}`);

        // Create the prompt for schedule extraction with emphasis on odd/even weeks
        const prompt = `Carefully analyze this course schedule document (image or PDF) and extract ALL course information with precise details.

CRITICAL PARSING RULES:

1. EACH COURSE TIME SLOT = ONE JSON ENTRY
   - If a course appears multiple times (different days/times), create SEPARATE entries
   - Example: "甘薯食品加工与创新实践" appears 3 times → create 3 separate JSON objects

2. PERIOD NUMBERS (节次):
   - Format: "(开始节-结束节)" like "(1-4节)" 
   - "(1-4节)" means periods 1 through 4 → startPeriod: 1, endPeriod: 4
   - "(3-5节)" means periods 3 through 5 → startPeriod: 3, endPeriod: 5
   - "(8-9节)" means periods 8 through 9 → startPeriod: 8, endPeriod: 9
   - NEVER split them! "(1-4节)" is ONE time slot, not multiple

3. WEEK NUMBERS (周次):
   - Format after period: "11周" or "1-16周" or complex patterns
   - "11周" → "11" (single week)
   - "6周,10周" → "6,10" (specific weeks)
   - "1-16周" → "1-16" (range)
   - "(1-4节)11周" means → startPeriod: 1, endPeriod: 4, weekRange: "11"

3. WEEK PATTERNS:
When you see something like "1-6周，8-10周（双），11-13周，15-16周":
- "1-6周" means weeks 1-6 (every week) → "1-6"
- "8-10周（双）" means weeks 8-10 (even weeks only) → "8-10双" 
- "11-13周" means weeks 11-13 (every week) → "11-13"
- "15-16周" means weeks 15-16 (every week) → "15-16"
- Combine them with commas: "1-6,8-10双,11-13,15-16"

The （单）or（双）marking ONLY applies to the range immediately before it, NOT the entire string!

Return a JSON array with these fields for EACH course:
- name: course name (string)
- teacher: teacher name (string, optional)
- location: classroom location (string, optional) - CRITICAL FORMAT:
  * If campus is mentioned: "校区名 教室" (space separated)
    Examples: "东湖校区 学4楼503", "仙林校区 教A101", "鼓楼校区 逸夫楼201"
  * If no campus: just "教室"
    Examples: "教三-201", "学4楼503"
  * NEVER use "/" or "场地:" or other separators
  * IGNORE "教学班组成" - only extract actual teaching location
- credits: course credits (number, optional) - 学分，如 2.0, 3.0, 4.5
- dayOfWeek: day of week (number, 1=Monday, 7=Sunday)
- startPeriod: start period number (number, starting from 1)
- endPeriod: end period number (number)
- weekRange: week range (string) - IMPORTANT FORMAT RULES:
  * Regular consecutive weeks: "1-16"
  * Multiple ranges: "1-6,8-10,11-13,15-16"
  * Odd weeks for entire range: "1-16单"
  * Even weeks for entire range: "1-16双"
  * MIXED (some ranges odd/even): "1-6,8-10双,11-13" (only mark the specific range)
  * Examples:
    - "1-6周，8-10周（双），11-13周" → "1-6,8-10双,11-13"
    - "1-8周（单），9-16周" → "1-8单,9-16"
    - "全周" or "1-16周" → "1-16"

Return ONLY the JSON array. Example (same course name, different times = separate entries):
[
  {
    "name": "甘薯食品加工与创新实践",
    "teacher": "成纪予",
    "location": "东湖校区 食品加工中试基地(小西门)",
    "credits": 1.0,
    "dayOfWeek": 6,
    "startPeriod": 1,
    "endPeriod": 4,
    "weekRange": "11"
  },
  {
    "name": "甘薯食品加工与创新实践",
    "teacher": "成纪予",
    "location": "东湖校区 食品加工中试基地(小西门)",
    "credits": 1.0,
    "dayOfWeek": 6,
    "startPeriod": 1,
    "endPeriod": 2,
    "weekRange": "6,10"
  }
]`;

        // Call Gemini Vision API with new SDK
        console.log('Calling Gemini with new SDK...');

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: fileType,
                    },
                },
                prompt
            ],
            config: {
                thinkingConfig: {
                    includeThoughts: false,
                    thinkingLevel: 'MINIMAL' as any // Cast to any to avoid TS error with preview option
                }
            }
        });

        const text = response.text;
        console.log('Gemini response (first 500 chars):', text?.substring(0, 500));

        // Parse JSON from response
        let courses;
        try {
            // Try to extract JSON array directly
            const jsonArrayMatch = text?.match(/\[[\s\S]*\]/);

            if (!jsonArrayMatch) {
                console.error('No JSON array found in Gemini response');
                throw new Error('No valid JSON array in response');
            }

            const jsonText = jsonArrayMatch[0];
            courses = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response.');
            console.error('Parse error:', parseError);
            return NextResponse.json(
                { error: 'AI 识别结果解析失败。响应格式不正确，请重试' },
                { status: 500 }
            );
        }

        // Validate and return
        if (!Array.isArray(courses)) {
            return NextResponse.json(
                { error: 'AI 识别结果格式错误' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            courses,
            method: 'ai',
        });
    } catch (error: any) {
        console.error('AI recognition failed:', error);
        return NextResponse.json(
            { error: error.message || 'AI 识别失败' },
            { status: 500 }
        );
    }
}
