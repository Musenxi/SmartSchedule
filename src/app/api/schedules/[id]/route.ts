import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getAuthUser } from '@/lib/auth';

const updateScheduleSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    firstWeekStart: z.string().datetime().optional(),
    weekStartDay: z.number().min(1).max(7).optional(),
    totalWeeks: z.number().min(1).max(52).optional(),
    periodsPerDay: z.number().min(1).max(20).optional(),
    isActive: z.boolean().optional(),
    enableAutoTimeTableSwitch: z.boolean().optional(),
    activeTimeTableId: z.string().optional().nullable(),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/schedules/[id] - 获取单个课表
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                courses: {
                    include: { times: true }
                }
            }
        });

        if (!schedule) {
            return NextResponse.json(
                { error: '课表不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json(schedule);
    } catch (error) {
        console.error('获取课表失败:', error);
        return NextResponse.json(
            { error: '获取课表失败' },
            { status: 500 }
        );
    }
}

// PUT /api/schedules/[id] - 更新课表
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = updateScheduleSchema.parse(body);

        // Verify ownership and existence
        const existingSchedule = await prisma.schedule.findUnique({
            where: { id },
        });

        if (!existingSchedule || existingSchedule.userId !== user.userId) {
            return NextResponse.json({ error: 'Schedule not found or unauthorized' }, { status: 404 });
        }

        // If setting to active, deactivate others first
        if (validated.isActive) {
            await prisma.schedule.updateMany({
                where: {
                    userId: user.userId,
                    id: { not: id }
                },
                data: { isActive: false }
            });
        }

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                ...validated,
                firstWeekStart: validated.firstWeekStart
                    ? new Date(validated.firstWeekStart)
                    : undefined,
            }
        });

        return NextResponse.json(schedule);
    } catch (error) {
        console.error('更新课表失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '更新课表失败' },
            { status: 500 }
        );
    }
}

// DELETE /api/schedules/[id] - 删除课表
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        await prisma.schedule.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除课表失败:', error);
        return NextResponse.json(
            { error: '删除课表失败' },
            { status: 500 }
        );
    }
}
