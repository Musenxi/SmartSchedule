import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';

const updateTimeTableSchema = z.object({
    name: z.string().min(1).optional(),
    sameDuration: z.boolean().optional(),
    duration: z.number().optional().nullable(),
    periods: z.array(z.object({
        number: z.number(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
    })),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// PUT /api/timetables/[id] - 更新时间表
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = await params;

        // 验证用户所有权
        const existing = await prisma.timeTable.findUnique({
            where: { id }
        });

        if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: 'TimeTable not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name, sameDuration, duration, periods } = updateTimeTableSchema.parse(body);

        // 事务更新
        const result = await prisma.$transaction(async (tx) => {
            const timeTable = await tx.timeTable.update({
                where: { id },
                data: {
                    name: name,
                    sameDuration: sameDuration,
                    duration: duration,
                }
            });

            await tx.period.deleteMany({
                where: { timeTableId: id }
            });

            await tx.period.createMany({
                data: periods.map(p => ({
                    timeTableId: id,
                    number: p.number,
                    startTime: p.startTime,
                    endTime: p.endTime
                }))
            });

            return timeTable;
        });

        // 返回完整数据
        const updated = await prisma.timeTable.findUnique({
            where: { id },
            include: { periods: true }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Update TimeTable failed:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/timetables/[id] - 删除时间表
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = session.user.id;

        const { id } = await params;

        const timeTable = await prisma.timeTable.findUnique({
            where: { id }
        });

        if (!timeTable || timeTable.userId !== userId) {
            return NextResponse.json({ error: 'TimeTable not found' }, { status: 404 });
        }

        if (timeTable.isDefault) {
            return NextResponse.json({ error: '无法删除默认时间表' }, { status: 403 });
        }

        // 检查是否有课表正在使用此时间表
        const schedulesUsingIt = await prisma.schedule.count({
            where: {
                userId: userId,
                activeTimeTableId: id
            }
        });

        if (schedulesUsingIt > 0) {
            return NextResponse.json({
                error: '此时间表正在被使用中，请先切换到其他时间表'
            }, { status: 403 });
        }

        await prisma.timeTable.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete TimeTable failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
