import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    try {
        const params = await context.params;
        const { code } = params;

        if (!code || code.length !== 10) {
            return NextResponse.json({ error: 'Invalid share code' }, { status: 400 });
        }

        // Find schedule with this code
        const schedule = await prisma.schedule.findUnique({
            where: { shareCode: code },
            include: {
                courses: {
                    include: {
                        times: true,
                    },
                },
            },
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Share code not found' }, { status: 404 });
        }

        // Check expiration
        if (schedule.shareCodeExpiresAt && new Date() > schedule.shareCodeExpiresAt) {
            return NextResponse.json({ error: 'Share code has expired' }, { status: 410 });
        }

        // Transform to export format
        const exportData = {
            version: 1,
            type: 'schedule',
            data: {
                name: schedule.name,
                totalWeeks: schedule.totalWeeks,
                periodsPerDay: schedule.periodsPerDay,
                firstWeekStart: schedule.firstWeekStart ? schedule.firstWeekStart.toISOString() : undefined,
                courses: schedule.courses.map(c => ({
                    name: c.name,
                    teacher: c.times[0]?.teacher || undefined, // Simple fallback
                    location: c.times[0]?.location || undefined, // Simple fallback
                    credits: c.credits,
                    color: c.color,
                    note: c.note,
                    times: c.times.map(t => ({
                        dayOfWeek: t.dayOfWeek,
                        startPeriod: t.startPeriod,
                        endPeriod: t.endPeriod,
                        weekRange: t.weekRange,
                        location: t.location,
                        teacher: t.teacher,
                        startTime: t.startTime,
                        endTime: t.endTime,
                        specificDate: t.specificDate ? t.specificDate.toISOString() : undefined
                    }))
                }))
            }
        };

        return NextResponse.json(exportData);

    } catch (error) {
        console.error('Get shared schedule error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieving schedule' },
            { status: 500 }
        );
    }
}
