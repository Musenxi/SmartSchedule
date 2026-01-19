import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getRandomCourseColor } from '@/lib/utils';

const courseTimeSchema = z.object({
    dayOfWeek: z.number().min(1).max(7),
    startPeriod: z.number().min(1),
    endPeriod: z.number().min(1),
    weekRange: z.string(),
    teacher: z.string().optional(),
    location: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    specificDate: z.string().optional(),
});

const createCourseSchema = z.object({
    scheduleId: z.string(),
    name: z.string().min(1).max(100),
    color: z.string().optional(),
    credits: z.number().optional(),
    note: z.string().optional(),
    times: z.array(courseTimeSchema).min(1),
});

// GET /api/courses - 获取课程列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const scheduleId = searchParams.get('scheduleId');

        if (!scheduleId) {
            return NextResponse.json(
                { error: '缺少scheduleId参数' },
                { status: 400 }
            );
        }

        const courses = await prisma.course.findMany({
            where: { scheduleId },
            include: { times: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(courses);
    } catch (error) {
        console.error('获取课程失败:', error);
        return NextResponse.json(
            { error: '获取课程失败' },
            { status: 500 }
        );
    }
}

// POST /api/courses - 创建课程
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validated = createCourseSchema.parse(body);

        const course = await prisma.course.create({
            data: {
                scheduleId: validated.scheduleId,
                name: validated.name,
                color: validated.color || getRandomCourseColor(),
                credits: validated.credits,
                note: validated.note,
                times: {
                    create: validated.times.map((t) => {
                        // Only create valid Date for specificDate if it's a valid date string
                        let specificDateValue = null;
                        if (t.specificDate && typeof t.specificDate === 'string' && t.specificDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            const d = new Date(t.specificDate + 'T00:00:00');
                            if (!isNaN(d.getTime())) {
                                specificDateValue = d;
                            }
                        }
                        return {
                            dayOfWeek: t.dayOfWeek,
                            startPeriod: t.startPeriod,
                            endPeriod: t.endPeriod,
                            weekRange: t.weekRange,
                            teacher: t.teacher,
                            location: t.location,
                            startTime: t.startTime,
                            endTime: t.endTime,
                            specificDate: specificDateValue,
                        };
                    })
                }
            },
            include: { times: true }
        });

        return NextResponse.json(course, { status: 201 });
    } catch (error) {
        console.error('创建课程失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '创建课程失败' },
            { status: 500 }
        );
    }
}
