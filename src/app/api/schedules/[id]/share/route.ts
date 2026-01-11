import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const scheduleId = params.id;
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const schedule = await prisma.schedule.findUnique({
            where: { id: scheduleId, userId: user.userId },
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Generate 10-char alphanumeric code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Set expiry (30 mins from now)
        const expiresAt = addMinutes(new Date(), 30);

        // Update schedule
        await prisma.schedule.update({
            where: { id: scheduleId },
            data: {
                shareCode: code,
                shareCodeExpiresAt: expiresAt,
            },
        });

        return NextResponse.json({
            code,
            expiresAt: expiresAt.toISOString()
        });

    } catch (error) {
        console.error('Generate share code error:', error);
        return NextResponse.json(
            { error: 'Failed to generate share code' },
            { status: 500 }
        );
    }
}
