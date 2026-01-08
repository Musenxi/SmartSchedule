import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { TaskInput } from '@/types/task';

// PUT: 更新任务
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json(); // Partial update

        // Check if task exists and belongs to user
        const existingTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!existingTask || existingTask.userId !== user.userId) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        const task = await prisma.task.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                startTime: body.startTime ? new Date(body.startTime) : (body.startTime === null ? null : undefined),
                dueDate: body.dueDate ? new Date(body.dueDate) : (body.dueDate === null ? null : undefined),
                courseId: body.courseId,
                location: body.location,
                completed: body.completed,
                priority: body.priority,
                type: body.type,
            },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: 删除任务
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const existingTask = await prisma.task.findUnique({
            where: { id },
        });

        if (!existingTask || existingTask.userId !== user.userId) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete task error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
