import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        // Authorization check
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check for ADMIN role
        // @ts-ignore
        if (session.user.role !== 'ADMIN') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Fetch Stats in parallel
        const [userCount, totalScheduleCount, todaysTaskCount] = await Promise.all([
            prisma.user.count(),
            prisma.schedule.count(),
            prisma.task.count({
                where: {
                    completed: false,
                    // Tasks due today or starting today
                    OR: [
                        {
                            dueDate: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                lt: new Date(new Date().setHours(24, 0, 0, 0))
                            }
                        }
                    ]
                }
            })
        ]);

        return NextResponse.json({
            users: userCount,
            activeSchedules: totalScheduleCount,
            todayTasks: todaysTaskCount,
            systemStatus: 'Normal' // Placeholder for now, could check DB connection latency
        });

    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
