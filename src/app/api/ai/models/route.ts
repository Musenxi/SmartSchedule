import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Decryption helper (must match config/route.ts)
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
        const body = await request.json();
        const { apiKey: providedKey, useSavedKey } = body;

        let apiKey = providedKey;

        // If useSavedKey flag is set, fetch and decrypt from database
        if (useSavedKey && !providedKey && session?.user?.id) {
            const userData = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { aiApiKey: true },
            });

            if (userData?.aiApiKey) {
                try {
                    const decrypted = decrypt(userData.aiApiKey);
                    if (!decrypted.startsWith('Failed')) {
                        apiKey = decrypted;
                    }
                } catch (e) { }
            }
        }

        // Fallback to Global Key
        if (!apiKey) {
            const globalKeySetting = await prisma.systemSetting.findUnique({
                where: { key: 'gemini_api_key' }
            });
            if (globalKeySetting?.value) {
                apiKey = globalKeySetting.value;
            }
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: "API key required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            return NextResponse.json(
                { error: data.error.message || "Failed to fetch models" },
                { status: 400 }
            );
        }

        const models = data.models
            ? data.models
                .filter((m: any) => m.name.includes("gemini"))
                .map((m: any) => ({
                    id: m.name.replace("models/", ""),
                    name: m.displayName,
                    description: m.description,
                }))
            : [];

        return NextResponse.json({ models });
    } catch (error: any) {
        console.error("Error fetching models:", error);
        return NextResponse.json(
            { error: "Failed to fetch models" },
            { status: 500 }
        );
    }
}
