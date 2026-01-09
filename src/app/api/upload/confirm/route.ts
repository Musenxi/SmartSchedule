import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getRandomColor } from '@/lib/color-utils';

interface CourseTimeSlot {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    teacher?: string;
    location?: string;
}

interface CourseInput {
    name: string;
    teacher?: string;
    location?: string;
    times: CourseTimeSlot[];
}

export async function POST(req: NextRequest) {
    const user = getAuthUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { courses, scheduleId, newScheduleName, mode, periodsPerDay, totalWeeks, startDate }: {
            courses: CourseInput[];
            scheduleId?: string;
            newScheduleName?: string;
            mode?: 'create' | 'add' | 'overwrite';
            periodsPerDay?: number;
            totalWeeks?: number;
            startDate?: string;
        } = await req.json();

        if (!courses || courses.length === 0) {
            return NextResponse.json({ error: 'No courses to import' }, { status: 400 });
        }

        let targetScheduleId = scheduleId;

        // 如果 mode 是 create 或者只有 newScheduleName (兼容旧逻辑)，说明要创建新课表
        if (mode === 'create' || (!mode && newScheduleName)) {
            // 1. 如果新课表需要设为 active，则需将用户的其他课表设为 inactive
            await prisma.schedule.updateMany({
                where: { userId: user.userId, isActive: true },
                data: { isActive: false },
            });

            // 2. 创建新课表
            const today = new Date();
            let firstWeekStart: Date;

            if (startDate) {
                // If user provided startDate, use it directly (assuming it's formatted YYYY-MM-DD or similar)
                firstWeekStart = new Date(startDate);
                // Ensure it's treated as start of day local time or simply store as date
                firstWeekStart.setHours(0, 0, 0, 0);
            } else {
                // Fallback: This week's Monday
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                firstWeekStart = new Date(today.setDate(diff));
                firstWeekStart.setHours(0, 0, 0, 0);
            }

            const newSchedule = await prisma.schedule.create({
                data: {
                    userId: user.userId,
                    name: newScheduleName || '新课表',
                    firstWeekStart: firstWeekStart,
                    isActive: true,
                    periodsPerDay: periodsPerDay || 12,
                    totalWeeks: totalWeeks || 20,
                },
            });
            targetScheduleId = newSchedule.id;

            // 3. 检查用户是否有时间表，如果没有则创建默认时间表
            const existingTimeTable = await prisma.timeTable.findFirst({
                where: { userId: user.userId }
            });
            if (!existingTimeTable) {
                await prisma.timeTable.create({
                    data: {
                        userId: user.userId,
                        name: '默认时间表',
                        sameDuration: true,
                        isDefault: true,
                        periods: {
                            create: [
                                { number: 1, startTime: '08:00', endTime: '08:45' },
                                { number: 2, startTime: '08:50', endTime: '09:35' },
                                { number: 3, startTime: '09:50', endTime: '10:35' },
                                { number: 4, startTime: '10:40', endTime: '11:25' },
                                { number: 5, startTime: '11:30', endTime: '12:15' },
                                { number: 6, startTime: '13:30', endTime: '14:15' },
                                { number: 7, startTime: '14:20', endTime: '15:05' },
                                { number: 8, startTime: '15:20', endTime: '16:05' },
                                { number: 9, startTime: '16:10', endTime: '16:55' },
                                { number: 10, startTime: '18:30', endTime: '19:15' },
                                { number: 11, startTime: '19:20', endTime: '20:05' },
                                { number: 12, startTime: '20:10', endTime: '20:55' },
                            ],
                        }
                    }
                });
            }
        }
        else if (!targetScheduleId) {
            // 如果没有指定，则查找当前活跃课表
            const activeSchedule = await prisma.schedule.findFirst({
                where: {
                    userId: user.userId,
                    isActive: true,
                },
            });

            if (!activeSchedule) {
                // 如果真没有活跃课表，强制创建一个默认的
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diff));
                monday.setHours(0, 0, 0, 0);

                const newDefaultSchedule = await prisma.schedule.create({
                    data: {
                        userId: user.userId,
                        name: "默认课表",
                        firstWeekStart: monday,
                        isActive: true,
                    },
                });
                targetScheduleId = newDefaultSchedule.id;

                // 检查用户是否有时间表，如果没有则创建默认时间表
                const existingTimeTable = await prisma.timeTable.findFirst({
                    where: { userId: user.userId }
                });
                if (!existingTimeTable) {
                    await prisma.timeTable.create({
                        data: {
                            userId: user.userId,
                            name: '默认时间表',
                            sameDuration: true,
                            isDefault: true,
                            periods: {
                                create: [
                                    { number: 1, startTime: '08:00', endTime: '08:45' },
                                    { number: 2, startTime: '08:50', endTime: '09:35' },
                                    { number: 3, startTime: '09:50', endTime: '10:35' },
                                    { number: 4, startTime: '10:40', endTime: '11:25' },
                                    { number: 5, startTime: '11:30', endTime: '12:15' },
                                    { number: 6, startTime: '13:30', endTime: '14:15' },
                                    { number: 7, startTime: '14:20', endTime: '15:05' },
                                    { number: 8, startTime: '15:20', endTime: '16:05' },
                                    { number: 9, startTime: '16:10', endTime: '16:55' },
                                    { number: 10, startTime: '18:30', endTime: '19:15' },
                                    { number: 11, startTime: '19:20', endTime: '20:05' },
                                    { number: 12, startTime: '20:10', endTime: '20:55' },
                                ],
                            }
                        }
                    });
                }
            } else {
                targetScheduleId = activeSchedule.id;
            }
        }

        if (!targetScheduleId) {
            return NextResponse.json({ error: 'Target schedule not determined' }, { status: 500 });
        }

        // 如果是覆盖模式，删除该课表下的所有课程
        if (mode === 'overwrite') {
            await prisma.course.deleteMany({
                where: { scheduleId: targetScheduleId }
            });
        }

        // 批量创建课程
        // 批量创建课程
        const createdCourses = await prisma.$transaction(
            courses.map((course) =>
                prisma.course.create({
                    data: {
                        scheduleId: targetScheduleId!,
                        name: course.name,
                        color: getRandomColor(),
                        // teacher/location are stored in CourseTime
                        times: {
                            create: course.times.map(time => ({
                                dayOfWeek: time.dayOfWeek,
                                startPeriod: time.startPeriod,
                                endPeriod: time.endPeriod,
                                weekRange: time.weekRange,
                                teacher: time.teacher,
                                location: time.location,
                            })),
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
            scheduleId: targetScheduleId,
        });
    } catch (error) {
        console.error('Import courses error:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
