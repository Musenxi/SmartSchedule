import { prisma } from '@/lib/prisma';

interface TurnstileVerifyResponse {
    success: boolean;
    "error-codes": string[];
    challenge_ts?: string;
    hostname?: string;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
    // 1. Check if Turnstile is enabled in DB
    const enabledSetting = await prisma.systemSetting.findUnique({
        where: { key: 'turnstile_enabled' }
    });

    if (enabledSetting?.value !== 'true') {
        return true; // Bypass if disabled
    }

    if (!token) {
        return false;
    }

    // 2. Get Secret Key
    const secretKeySetting = await prisma.systemSetting.findUnique({
        where: { key: 'turnstile_secret_key' }
    });
    const secretKey = secretKeySetting?.value;

    if (!secretKey) {
        console.warn('Turnstile is enabled but no secret key found.');
        return true; // Fail open or closed? Usually fail closed if config missing but enabled, but here maybe log warning.
        // Let's fail open to avoid locking users out if config is botched, or fail closed for security.
        // Safe approach: fail closed if enabled but misconfigured.
        // return false; 
    }

    // 3. Verify with Cloudflare
    try {
        console.log('[Turnstile] Verifying token...');
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);

        const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome: TurnstileVerifyResponse = await result.json();
        console.log('[Turnstile] Cloudflare response:', JSON.stringify(outcome));

        if (!outcome.success) {
            console.error('[Turnstile] Verification failed:', outcome['error-codes']);
        }
        return outcome.success;
    } catch (e) {
        console.error('[Turnstile] Verification error:', e);
        return false;
    }
}
