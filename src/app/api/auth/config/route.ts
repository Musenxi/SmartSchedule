import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSMTPConfigured } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const turnstileSettings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['turnstile_enabled', 'turnstile_site_key']
                }
            }
        });

        const config: Record<string, string> = {};
        turnstileSettings.forEach(s => config[s.key] = s.value);

        const emailEnabled = await isSMTPConfigured();

        return NextResponse.json({
            turnstile: {
                enabled: config['turnstile_enabled'] === 'true',
                siteKey: config['turnstile_site_key'] || ''
            },
            emailVerification: emailEnabled
        });
    } catch (error) {
        console.error('Failed to fetch auth config:', error);
        return NextResponse.json({
            turnstile: { enabled: false, siteKey: '' },
            emailVerification: false
        });
    }
}
