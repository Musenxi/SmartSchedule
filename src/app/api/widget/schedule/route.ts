
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { widgetToken: token } as any,
            include: {
                schedules: {
                    where: { isActive: true },
                    include: {
                        courses: {
                            include: { times: true }
                        }
                    }
                },
                timeTables: {
                    where: { isDefault: true },
                    include: { periods: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userAny = user as any;
        const schedule = userAny.schedules[0];
        if (!schedule) {
            return NextResponse.json({ error: 'No active schedule' }, { status: 404 });
        }

        // Calculate Current Week
        const now = new Date();
        const firstWeekStart = new Date(schedule.firstWeekStart);
        // Reset time to midnight for calculation
        const start = new Date(firstWeekStart);
        start.setHours(0, 0, 0, 0);
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(diffDays / 7) + 1;
        const currentDay = (today.getDay() === 0 ? 7 : today.getDay()); // 1-7 (Mon-Sun)

        // Get Time Periods
        let periods: any[] = userAny.timeTables[0]?.periods || [];

        if (schedule.activeTimeTableId) {
            const activeTT = await prisma.timeTable.findUnique({
                where: { id: schedule.activeTimeTableId },
                include: { periods: true }
            });
            if (activeTT) {
                periods = activeTT.periods;
            }
        }

        // Sort periods
        periods.sort((a: any, b: any) => a.number - b.number);


        // Helper to get day courses
        const getDayCourses = async (targetDate: Date, targetWeek: number, targetDay: number) => {
            const dayCourses = [];

            // 1. Regular Courses
            for (const course of schedule.courses) {
                for (const time of course.times) {
                    if (time.dayOfWeek !== targetDay) continue;

                    const ranges = time.weekRange.split(',');
                    let isActive = false;
                    for (const range of ranges) {
                        if (range.includes('-')) {
                            const [s, e] = range.split('-').map(Number);
                            if (targetWeek >= s && targetWeek <= e) isActive = true;
                        } else {
                            if (targetWeek === Number(range)) isActive = true;
                        }
                    }

                    if (isActive) {
                        let startTime = "00:00";
                        let endTime = "00:00";

                        if (time.startTime && time.endTime) {
                            startTime = time.startTime;
                            endTime = time.endTime;
                        } else {
                            const startPeriod = periods.find((p: any) => p.number === time.startPeriod);
                            const endPeriod = periods.find((p: any) => p.number === time.endPeriod);
                            if (startPeriod && endPeriod) {
                                startTime = startPeriod.startTime;
                                endTime = endPeriod.endTime;
                            }
                        }

                        dayCourses.push({
                            name: course.name,
                            location: time.location || course.note || '',
                            teacher: time.teacher || '',
                            day: time.dayOfWeek,
                            startTime,
                            endTime,
                            color: course.color,
                            startPeriod: time.startPeriod,
                            type: 'course'
                        });
                    }
                }
            }

            // 2. Exams
            const nextDay = new Date(targetDate);
            nextDay.setDate(targetDate.getDate() + 1);
            // Ensure we check the specific date range [00:00, 24:00)
            const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate); dayEnd.setHours(24, 0, 0, 0);

            const exams = await prisma.task.findMany({
                where: {
                    userId: user.id,
                    type: 'EXAM',
                    startTime: { gte: dayStart, lt: dayEnd }
                }
            });

            for (const exam of exams) {
                if (!exam.startTime) continue;
                const dt = new Date(exam.startTime);
                const timeStr = dt.toTimeString().slice(0, 5);
                let endTimeStr = "00:00";
                if (exam.dueDate) {
                    endTimeStr = new Date(exam.dueDate).toTimeString().slice(0, 5);
                } else {
                    const endDt = new Date(dt.getTime() + 2 * 60 * 60 * 1000); // Default 2h
                    endTimeStr = endDt.toTimeString().slice(0, 5);
                }

                dayCourses.push({
                    name: exam.title,
                    location: exam.location || '',
                    teacher: '',
                    day: targetDay,
                    startTime: timeStr,
                    endTime: endTimeStr,
                    color: '#ef4444',
                    type: 'exam'
                });
            }

            // Sort by start time
            dayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
            return dayCourses;
        };

        const todayCourses = await getDayCourses(today, currentWeek, currentDay);

        // Calculate Tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        let tomorrowWeek = currentWeek;
        // If today is Sunday (7), tomorrow is Monday (1) of next week
        if (currentDay === 7) {
            tomorrowWeek = currentWeek + 1;
        }
        const tomorrowDay = (tomorrow.getDay() === 0 ? 7 : tomorrow.getDay());

        const tomorrowCourses = await getDayCourses(tomorrow, tomorrowWeek, tomorrowDay);

        return NextResponse.json({
            scheduleName: schedule.name,
            week: currentWeek,
            day: currentDay,
            date: now.toISOString().split('T')[0], // YYYY-MM-DD
            todayCourses,
            tomorrowCourses
        });
    } catch (error) {
        console.error("Widget API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
