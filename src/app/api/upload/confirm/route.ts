import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getRandomColor } from '@/lib/color-utils';

interface CourseInput {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
}

export async function POST(req: NextRequest) {
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { courses }: { courses: CourseInput[] } = await req.json();

        if (!courses || courses.length === 0) {
            return NextResponse.json({ error: 'No courses to import' }, { status: 400 });
        }

        // 获取用户的活跃课表
        const activeSchedule = await prisma.schedule.findFirst({
            where: {
                userId: user.userId,
                isActive: true,
            },
        });

        if (!activeSchedule) {
            return NextResponse.json({ error: 'No active schedule found' }, { status: 400 });
        }

        // 批量创建课程
        const createdCourses = await prisma.$transaction(
            courses.map((course) =>
                prisma.course.create({
                    data: {
                        scheduleId: activeSchedule.id,
                        name: course.name,
                        color: getRandomColor(),
                        times: {
                            create: {
                                dayOfWeek: course.dayOfWeek,
                                startPeriod: course.startPeriod,
                                endPeriod: course.endPeriod,
                                weekRange: course.weekRange,
                                teacher: course.teacher,
                                location: course.location,
                            },
                        },
                    },
                    include: { times: true },
                })
            )
        );

        return NextResponse.json({
            success: true,
            count: createdCourses.length,
            courses: createdCourses,
        });
    } catch (error) {
        console.error('Import courses error:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
