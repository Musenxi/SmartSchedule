import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: {
                    in: ['turnstile_enabled', 'turnstile_site_key']
                }
            }
        });

        const config: Record<string, string> = {};
        settings.forEach(s => config[s.key] = s.value);

        return NextResponse.json({
            enabled: config['turnstile_enabled'] === 'true',
            siteKey: config['turnstile_site_key'] || ''
        });
    } catch (error) {
        console.error('Failed to fetch turnstile config:', error);
        return NextResponse.json({ enabled: false, siteKey: '' });
    }
}
