import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const taskTypeEnum = z.enum(['HOMEWORK', 'EXAM', 'EVENT', 'CUSTOM']);

const createTaskSchema = z.object({
    courseId: z.string().optional(),
    type: taskTypeEnum,
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    location: z.string().optional(),
    priority: z.number().min(0).max(10).default(0),
});

// GET /api/tasks - 获取任务列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const completed = searchParams.get('completed');
        const courseId = searchParams.get('courseId');

        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        const where: Record<string, unknown> = { userId };

        if (type) {
            where.type = type;
        }
        if (completed !== null) {
            where.completed = completed === 'true';
        }
        if (courseId) {
            where.courseId = courseId;
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            },
            orderBy: [
                { dueDate: 'asc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('获取任务失败:', error);
        return NextResponse.json(
            { error: '获取任务失败' },
            { status: 500 }
        );
    }
}

// POST /api/tasks - 创建任务
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        const body = await request.json();
        const validated = createTaskSchema.parse(body);

        const task = await prisma.task.create({
            data: {
                userId,
                courseId: validated.courseId,
                type: validated.type,
                title: validated.title,
                description: validated.description,
                dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
                location: validated.location,
                priority: validated.priority,
            },
            include: {
                course: {
                    select: { id: true, name: true, color: true }
                }
            }
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('创建任务失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '创建任务失败' },
            { status: 500 }
        );
    }
}
