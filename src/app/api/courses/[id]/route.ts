import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const courseTimeSchema = z.object({
    id: z.string().optional(),
    dayOfWeek: z.number().min(1).max(7),
    startPeriod: z.number().min(1),
    endPeriod: z.number().min(1),
    weekRange: z.string(),
    teacher: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
});

const updateCourseSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    color: z.string().optional(),
    credits: z.number().optional().nullable(),
    note: z.string().optional().nullable(),
    times: z.array(courseTimeSchema).optional(),
});

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/courses/[id] - 获取单个课程
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: { times: true }
        });

        if (!course) {
            return NextResponse.json(
                { error: '课程不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error('获取课程失败:', error);
        return NextResponse.json(
            { error: '获取课程失败' },
            { status: 500 }
        );
    }
}

// PUT /api/courses/[id] - 更新课程
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateCourseSchema.parse(body);

        // 如果有times，先删除旧的再创建新的
        if (validated.times) {
            await prisma.courseTime.deleteMany({
                where: { courseId: id }
            });
        }

        const course = await prisma.course.update({
            where: { id },
            data: {
                name: validated.name,
                color: validated.color,
                credits: validated.credits,
                note: validated.note,
                times: validated.times ? {
                    create: validated.times.map(t => ({
                        dayOfWeek: t.dayOfWeek,
                        startPeriod: t.startPeriod,
                        endPeriod: t.endPeriod,
                        weekRange: t.weekRange,
                        teacher: t.teacher,
                        location: t.location,
                    }))
                } : undefined,
            },
            include: { times: true }
        });

        return NextResponse.json(course);
    } catch (error) {
        console.error('更新课程失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '更新课程失败' },
            { status: 500 }
        );
    }
}

// DELETE /api/courses/[id] - 删除课程
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params;

        await prisma.course.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除课程失败:', error);
        return NextResponse.json(
            { error: '删除课程失败' },
            { status: 500 }
        );
    }
}
