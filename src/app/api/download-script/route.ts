import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WIDGET_SCRIPT_TEMPLATE } from '@/lib/widget-script';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return new NextResponse('Missing token', { status: 400 });
    }

    // Verify token exists (optional security check)
    const user = await prisma.user.findUnique({
        where: { widgetToken: token }
    });

    if (!user) {
        return new NextResponse('Invalid token', { status: 401 });
    }

    // Construct API URL
    const origin = request.nextUrl.origin;
    const fullApiUrl = `${origin}/api/widget/schedule?token=${token}`;

    // Replace placeholder
    const scriptContent = WIDGET_SCRIPT_TEMPLATE.replace('__API_URL__', fullApiUrl);

    return new NextResponse(scriptContent, {
        headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            'Content-Disposition': 'attachment; filename="SmartSchedule.js"'
        }
    });
}
