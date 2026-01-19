import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WIDGET_SCRIPT_TEMPLATE } from '@/lib/widget-script';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
        return new NextResponse('Missing token', { status: 400 });
    }

    // Verify token
    const user = await prisma.user.findFirst({
        where: { widgetToken: token }
    });

    if (!user) {
        return new NextResponse('Invalid token', { status: 401 });
    }

    // Generate API URL
    // Prefer NEXTAUTH_URL from env if available (handles proxy/docker correct public URL)
    let origin = process.env.NEXTAUTH_URL;
    if (!origin) {
        origin = request.nextUrl.origin;
    }
    const apiUrl = `${origin}/api/widget/schedule?token=${token}`;

    // Inject API URL into script
    const script = WIDGET_SCRIPT_TEMPLATE.replace('__API_URL__', apiUrl);

    return new NextResponse(script, {
        headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
        },
    });
}
