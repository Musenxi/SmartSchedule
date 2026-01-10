'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import crypto from 'crypto';

// Encryption helpers (simple AES-256-GCM)
const ALGORITHM = 'aes-256-gcm';

// Get or create a 32-byte encryption key
function getEncryptionKey(): Buffer {
    const secret = process.env.API_KEY_ENCRYPTION_SECRET || 'smartschedule-ai-api-key-enc';
    // Use SHA-256 to always get exactly 32 bytes
    return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
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

function maskApiKey(key: string, provider?: string | null): string {
    if (!key || key.length < 8) return '***';
    const prefix = key.slice(0, 3);
    const suffix = key.slice(-3);
    return `${prefix}...${suffix}`;
}

// GET: 获取 AI 配置
export async function GET(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                aiProvider: true,
                aiApiKey: true,
                aiEnabled: true,
                aiModel: true,
            },
        });

        if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Return masked API key for display
        return NextResponse.json({
            provider: userData.aiProvider,
            enabled: userData.aiEnabled,
            apiKey: userData.aiApiKey ? maskApiKey(decrypt(userData.aiApiKey), userData.aiProvider) : null,
            hasApiKey: !!userData.aiApiKey,
            model: userData.aiModel,
        });
    } catch (error) {
        console.error('Failed to get AI config:', error);
        return NextResponse.json({ error: 'Failed to get AI config' }, { status: 500 });
    }
}

// PUT: 更新 AI 配置
export async function PUT(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { provider, apiKey, enabled, model } = body;

        // Validate provider
        if (provider && !['gemini', 'openai'].includes(provider)) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        // Prepare update data
        const updateData: any = {};

        if (provider !== undefined) {
            updateData.aiProvider = provider;
        }

        if (apiKey !== undefined) {
            // Encrypt API key before storing
            updateData.aiApiKey = apiKey ? encrypt(apiKey) : null;
        }

        if (enabled !== undefined) {
            updateData.aiEnabled = enabled;
        }

        if (model !== undefined) {
            updateData.aiModel = model;
        }

        await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
        });

        // Fetch updated config
        const updated = await prisma.user.findUnique({
            where: { id: user.userId },
            select: {
                aiProvider: true,
                aiApiKey: true,
                aiEnabled: true,
            },
        });

        return NextResponse.json({
            provider: updated?.aiProvider,
            enabled: updated?.aiEnabled,
            apiKey: updated?.aiApiKey ? maskApiKey(decrypt(updated.aiApiKey), updated.aiProvider) : null,
            hasApiKey: !!updated?.aiApiKey,
        });
    } catch (error) {
        console.error('Failed to update AI config:', error);
        return NextResponse.json({ error: 'Failed to update AI config' }, { status: 500 });
    }
}

// DELETE: 删除 AI 配置
export async function DELETE(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: user.userId },
            data: {
                aiProvider: null,
                aiApiKey: null,
                aiEnabled: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete AI config:', error);
        return NextResponse.json({ error: 'Failed to delete AI config' }, { status: 500 });
    }
}
