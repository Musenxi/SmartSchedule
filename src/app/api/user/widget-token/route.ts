import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = crypto.randomBytes(32).toString('hex');

        await prisma.user.update({
            where: { id: session.user.id },
            data: { widgetToken: token }
        });

        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { widgetToken: true }
        });

        const token = user?.widgetToken;

        return NextResponse.json({ token });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
    }
}
