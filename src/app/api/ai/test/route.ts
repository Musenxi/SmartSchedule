'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Decryption helper (must match config/route.ts)
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
    if (!process.env.API_KEY_ENCRYPTION_SECRET) {
        throw new Error('API_KEY_ENCRYPTION_SECRET must be defined');
    }
    const secret = process.env.API_KEY_ENCRYPTION_SECRET;
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
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { apiKey: providedKey, useSavedKey, provider, model } = body;

        let apiKey = providedKey;

        // If useSavedKey flag is set, fetch and decrypt from database
        if (useSavedKey && !providedKey) {
            const userData = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { aiApiKey: true },
            });

            if (!userData?.aiApiKey) {
                return NextResponse.json({ success: false, error: '未找到已保存的 API Key' }, { status: 400 });
            }

            apiKey = decrypt(userData.aiApiKey);
        }

        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 });
        }

        // Default to gemini if not specified
        const providerName = (provider || 'gemini').toLowerCase();

        if (providerName !== 'gemini') {
            return NextResponse.json({ success: false, error: `Only Gemini is supported (received: ${provider})` }, { status: 400 });
        }

        // Test the API key with a simple request
        try {
            console.log('[AI Test] Testing API key, length:', apiKey.length, 'model:', model);

            // First validate key by listing models (quota-free)
            const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
            const listRes = await fetch(listModelsUrl);

            if (!listRes.ok) {
                const errorData = await listRes.json();
                throw new Error(errorData.error?.message || `Validation failed: ${listRes.status}`);
            }

            const listData = await listRes.json();

            // If a specific model is provided, verify it exists (quota-free)
            if (model) {
                console.log('[AI Test] Verifying model exists:', model);
                const getModelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey.trim()}`;
                const modelRes = await fetch(getModelUrl);

                if (!modelRes.ok) {
                    const errorData = await modelRes.json();
                    throw new Error(errorData.error?.message || `模型 ${model} 不可用`);
                }

                const modelInfo = await modelRes.json();
                console.log('[AI Test] Model verified:', modelInfo.displayName);
            }

            return NextResponse.json({
                success: true,
                message: model ? `模型 ${model} 验证成功` : 'API key is valid',
                modelCount: listData.models?.length || 0
            });
        } catch (error: any) {
            console.error('[AI Test] Failed:');
            console.error('[AI Test] Error type:', error.constructor?.name);
            console.error('[AI Test] Error message:', error.message);

            const errorMsg = error.message || '';

            if (errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID')) {
                return NextResponse.json({
                    success: false,
                    error: 'API Key 无效'
                }, { status: 400 });
            }

            if (errorMsg.includes('PERMISSION_DENIED')) {
                return NextResponse.json({
                    success: false,
                    error: 'API Key 权限不足，请确保已启用 Generative Language API'
                }, { status: 403 });
            }

            return NextResponse.json({
                success: false,
                error: '连接失败：' + (errorMsg.substring(0, 150))
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[AI Test] Endpoint error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
