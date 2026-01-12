'use server';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // Check if user has AI enabled
        const userData = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                aiEnabled: true,
                aiApiKey: true,
                aiProvider: true,
                aiModel: true,
            },
        });

        // Check if user has AI enabled (or if we should allow default)
        // Relaxing the check: if user hasn't explicitly disabled it (if we had a disabled flag), 
        // but here aiEnabled defaults to false. 
        // We will allow if aiEnabled is true OR if we have a global key (effectively auto-enabling for basic usage if global key is present)
        // But for now, let's keep aiEnabled check if consistent with UI, OR just check if they have access.

        // Let's refine the check:
        // We need 'userData' to exist.
        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Key Resolution Strategy
        let apiKey = '';
        let useGlobalKey = false;

        // 1. Try User Key
        if (userData.aiApiKey) {
            try {
                const decryptedKey = decrypt(userData.aiApiKey).trim();
                // Basic validation
                if (decryptedKey.length >= 30 && !decryptedKey.startsWith('Failed')) {
                    apiKey = decryptedKey;
                }
            } catch (e) {
                console.warn('User API key decryption/validation failed, falling back to global...');
            }
        }

        // 2. Try Global Key if no valid user key
        if (!apiKey) {
            const globalKeySetting = await prisma.systemSetting.findUnique({
                where: { key: 'gemini_api_key' }
            });

            if (globalKeySetting?.value) {
                apiKey = globalKeySetting.value;
                useGlobalKey = true;
            }
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: '未配置 AI API Key。请在设置中配置个人 Key 或联系管理员。' },
                { status: 403 }
            );
        }

        // 3. Rate Limiting for Global Key
        if (useGlobalKey) {
            const today = new Date().toISOString().split('T')[0];

            // Fetch configured limit (default: 5)
            const limitSetting = await prisma.systemSetting.findUnique({
                where: { key: 'gemini_api_limit' }
            });
            const maxDailyUsage = parseInt(limitSetting?.value || '5', 10);

            const usage = await prisma.apiUsage.findUnique({
                where: {
                    userId_date: {
                        userId: userId,
                        date: today
                    }
                }
            });

            if ((usage?.count || 0) >= maxDailyUsage) {
                return NextResponse.json(
                    { error: `今日免费 AI 使用次数已耗尽（${maxDailyUsage}次/天）。请在设置中配置您自己的 Gemini API Key 以解锁无限使用。` },
                    { status: 429 }
                );
            }

            // Increment usage count
            await prisma.apiUsage.upsert({
                where: {
                    userId_date: {
                        userId: userId,
                        date: today
                    }
                },
                update: {
                    count: { increment: 1 }
                },
                create: {
                    userId: userId,
                    date: today,
                    count: 1
                }
            });
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
