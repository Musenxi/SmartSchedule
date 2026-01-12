import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { TaskInput } from '@/types/task';

// GET: 获取任务列表
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const tasks = await prisma.task.findMany({
            where: { userId: session.user.id },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            },
            orderBy: [
                { completed: 'asc' },
                { dueDate: 'asc' }
            ]
        });
        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: 创建任务
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: TaskInput = await req.json();

        // 基本验证
        if (!body.title || !body.type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                userId: session.user.id,
                title: body.title,
                type: body.type,
                description: body.description,
                startTime: body.startTime ? new Date(body.startTime) : null,
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                courseId: body.courseId,
                location: body.location,
                priority: body.priority || 0,
                showInSchedule: body.showInSchedule ?? true, // Default true
            },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
