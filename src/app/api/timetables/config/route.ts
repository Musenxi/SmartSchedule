import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateConfigSchema = z.object({
    winterStartDate: z.string().regex(/^\d{2}-\d{2}$/, "Invalid date format (MM-DD)").optional().nullable(),
    winterEndDate: z.string().regex(/^\d{2}-\d{2}$/, "Invalid date format (MM-DD)").optional().nullable(),
    winterTimeTableId: z.string().optional().nullable(),
    summerTimeTableId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: {
                winterStartDate: true,
                winterEndDate: true,
                winterTimeTableId: true,
                summerTimeTableId: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Failed to get timetable config', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const data = updateConfigSchema.parse(body);

        // Verify IDs if provided
        if (data.winterTimeTableId) {
            const exists = await prisma.timeTable.count({ where: { id: data.winterTimeTableId, userId: auth.userId } });
            if (!exists) return NextResponse.json({ error: 'Invalid Winter TimeTable ID' }, { status: 400 });
        }
        if (data.summerTimeTableId) {
            const exists = await prisma.timeTable.count({ where: { id: data.summerTimeTableId, userId: auth.userId } });
            if (!exists) return NextResponse.json({ error: 'Invalid Summer TimeTable ID' }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: auth.userId },
            data: {
                winterStartDate: data.winterStartDate,
                winterEndDate: data.winterEndDate,
                winterTimeTableId: data.winterTimeTableId,
                summerTimeTableId: data.summerTimeTableId,
            },
            select: {
                winterStartDate: true,
                winterEndDate: true,
                winterTimeTableId: true,
                summerTimeTableId: true,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
        }
        console.error('Failed to update timetable config', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
