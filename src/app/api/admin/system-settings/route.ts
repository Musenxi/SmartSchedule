
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to verify admin
async function verifyAdmin() {
    const session = await auth();
    if (session?.user?.role === 'ADMIN') return true;
    return false;
}

export async function GET(request: NextRequest) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // Inject Env Var Status (read-only)
        settingsMap['_github_env_configured'] = (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) ? 'true' : 'false';

        return NextResponse.json({ settings: settingsMap });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!await verifyAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        return NextResponse.json({ setting });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
