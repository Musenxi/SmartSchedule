import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const taskTypeEnum = z.enum(['HOMEWORK', 'EXAM', 'EVENT', 'CUSTOM']);

const updateTaskSchema = z.object({
    courseId: z.string().optional().nullable(),
    type: taskTypeEnum.optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    location: z.string().optional().nullable(),
    priority: z.number().min(0).max(10).optional(),
    completed: z.boolean().optional(),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/tasks/[id] - 获取单个任务
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            }
        });

        if (!task) {
            return NextResponse.json(
                { error: '任务不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json(task);
    } catch (error) {
        console.error('获取任务失败:', error);
        return NextResponse.json(
            { error: '获取任务失败' },
            { status: 500 }
        );
    }
}

// PUT /api/tasks/[id] - 更新任务
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateTaskSchema.parse(body);

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...validated,
                dueDate: validated.dueDate
                    ? new Date(validated.dueDate)
                    : validated.dueDate === null
                        ? null
                        : undefined,
            },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('更新任务失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '更新任务失败' },
            { status: 500 }
        );
    }
}

// DELETE /api/tasks/[id] - 删除任务
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除任务失败:', error);
        return NextResponse.json(
            { error: '删除任务失败' },
            { status: 500 }
        );
    }
}
