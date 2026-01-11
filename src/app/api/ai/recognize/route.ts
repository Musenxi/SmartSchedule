'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';
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

        // Create the prompt based on request type
        const type = formData.get('type') as string;
        let prompt = '';

        if (type === 'exam') {
            console.log('Using EXAM recognition prompt');
            prompt = `Extract all exam information from this image/PDF as a JSON array.

RULES:
1. Return ONLY a JSON array.
2. Date format: "YYYY-MM-DD"
3. Time format: "HH:mm" (24-hour)

JSON fields:
- title: string (Course name)
- date: string (YYYY-MM-DD)
- startTime: string (HH:mm)
- endTime: string (HH:mm)
- location: string (Exam location)
- seatNumber: string (Optional, seat number)
- description: string (Optional, exam name or type)

Example Output:
[{"title":"Advanced Math","date":"2026-01-15","startTime":"09:00","endTime":"11:00","location":"Online","seatNumber":"12","description":"Final Exam"}]`;
        } else {
            // Default to course schedule prompt
            console.log('Using COURSE SCHEDULE recognition prompt');
            prompt = `Extract all course information from this schedule (image/PDF) as JSON array. Supports both Chinese and English schedules.

RULES:
1. One time slot = one JSON entry (same course at different times = separate entries)
2. Period parsing:
   - "1-4节" or "Period 1-4" → startPeriod: 1, endPeriod: 4
   - "Section 1-3" → startPeriod: 1, endPeriod: 3
3. Week parsing:
   - "11周" or "Week 11" → "11"
   - "1-16周" or "Weeks 1-16" → "1-16"
   - "1-6周，8-10周（双）" or "Weeks 1-6, 8-10 (Even)" → "1-6,8-10(Even)"
   - （单）/（ODD）or （双）/（EVEN）marks the preceding range
4. Day of Week:
   - Mon/Monday/周一 → 1
   - ...
   - Sun/Sunday/周日 → 7

JSON fields (return English keys):
- name: string (Course Name / Title)
- teacher: string (Optional, Instructor / Lecturer)
- location: string (Optional, Room / Classroom / Venue)
- credits: number (Optional, Credits / Units)
- dayOfWeek: number (1-7)
- startPeriod: number (Integer)
- endPeriod: number (Integer)
- weekRange: string (Raw string found, e.g., "1-16")

Return ONLY JSON array:
[{"name":"Calculus I","teacher":"John Doe","location":"Building A 101","credits":4.0,"dayOfWeek":1,"startPeriod":1,"endPeriod":2,"weekRange":"1-16"}]`;
        }

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
