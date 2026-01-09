import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

// 禁用 Next.js 路由缓存
export const dynamic = 'force-dynamic';

const createTimeTableSchema = z.object({
    name: z.string().min(1).max(50),
    sameDuration: z.boolean().optional(),
    duration: z.number().optional(),
    periods: z.array(z.object({
        number: z.number(),
        startTime: z.string(),
        endTime: z.string()
    })).optional()
});

// GET /api/timetables - 获取用户所有时间表
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const timeTables = await prisma.timeTable.findMany({
            where: { userId: auth.userId },
            include: { periods: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(timeTables);
    } catch (error) {
        console.error('获取时间表失败:', error);
        return NextResponse.json({ error: '获取时间表失败' }, { status: 500 });
    }
}

// POST /api/timetables - 创建新时间表
export async function POST(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }

        const body = await request.json();
        const { name, sameDuration, duration, periods } = createTimeTableSchema.parse(body);

        // 检查是否是第一个时间表
        const existingCount = await prisma.timeTable.count({
            where: { userId: auth.userId }
        });
        const isFirst = existingCount === 0;

        // 创建时间表并带默认节次
        const timeTable = await prisma.timeTable.create({
            data: {
                userId: auth.userId,
                name: name || '新时间表',
                sameDuration: sameDuration ?? true,
                duration: duration,
                isDefault: isFirst,
                periods: {
                    create: periods ? periods.map(p => ({
                        number: p.number,
                        startTime: p.startTime,
                        endTime: p.endTime
                    })) : getDefaultPeriods()
                }
            },
            include: { periods: true }
        });

        // 如果是第一个，设为用户默认
        if (isFirst) {
            await prisma.user.update({
                where: { id: auth.userId },
                data: { defaultTimeTableId: timeTable.id }
            });
        }

        return NextResponse.json(timeTable, { status: 201 });
    } catch (error) {
        console.error('创建时间表失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: '参数验证失败', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: '创建时间表失败' }, { status: 500 });
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
