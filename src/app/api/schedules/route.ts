import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

// Disable Next.js route caching
export const dynamic = 'force-dynamic';

const createScheduleSchema = z.object({
    name: z.string().min(1).max(50),
    firstWeekStart: z.string().datetime(),
    weekStartDay: z.number().min(1).max(7).default(1),
    totalWeeks: z.number().min(1).max(52).default(20),
    periodsPerDay: z.number().min(1).max(20).default(12),
    enableAutoTimeTableSwitch: z.boolean().default(false),
});

// GET /api/schedules - 获取所有课表
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        const schedules = await prisma.schedule.findMany({
            where: { userId },
            include: {
                courses: {
                    include: { times: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(schedules);
    } catch (error) {
        console.error('获取课表失败:', error);
        return NextResponse.json(
            { error: '获取课表失败' },
            { status: 500 }
        );
    }
}

// POST /api/schedules - 创建新课表
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        const body = await request.json();
        const validated = createScheduleSchema.parse(body);

        // 如果这是用户第一个课表，设为激活状态
        const existingCount = await prisma.schedule.count({ where: { userId } });

        const schedule = await prisma.schedule.create({
            data: {
                ...validated,
                userId,
                firstWeekStart: new Date(validated.firstWeekStart),
                isActive: existingCount === 0,
            }
        });

        // 创建默认时间表（属于用户而非课表）
        await prisma.timeTable.create({
            data: {
                userId: userId,
                name: '默认时间表',
                sameDuration: true,
                isDefault: true,
                periods: {
                    create: getDefaultPeriods(),
                }
            }
        });

        return NextResponse.json(schedule, { status: 201 });
    } catch (error) {
        console.error('创建课表失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '创建课表失败' },
            { status: 500 }
        );
    }
}

// 默认节次时间
function getDefaultPeriods() {
    return [
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
    ];
}
