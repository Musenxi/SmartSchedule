import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';
import { defaultSettings } from '@/types/settings';

const settingsSchema = z.object({
    useSolidBackground: z.boolean().optional(),
    backgroundImage: z.string().nullable().optional(),
    headerColor: z.string().optional(),
    showGridLines: z.boolean().optional(),
    showPeriodTime: z.boolean().optional(),
    showSaturday: z.boolean().optional(),
    showSunday: z.boolean().optional(),
    showNonCurrentWeek: z.boolean().optional(),
    courseCornerRadius: z.number().min(0).max(20).optional(),
    courseTextColor: z.string().optional(),
    periodHeight: z.number().min(30).max(100).optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.string().optional(),
});

// GET /api/settings - 获取用户设置
export async function GET(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        let settings = await prisma.settings.findUnique({
            where: { userId },
        });

        if (!settings) {
            // 如果没有设置，创建默认设置
            settings = await prisma.settings.create({
                data: {
                    ...defaultSettings,
                    userId,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('获取设置失败:', error);
        return NextResponse.json(
            { error: '获取设置失败' },
            { status: 500 }
        );
    }
}

// PUT /api/settings - 更新用户设置
export async function PUT(request: NextRequest) {
    try {
        const auth = getAuthUser(request);
        if (!auth) {
            return NextResponse.json({ error: '未登录' }, { status: 401 });
        }
        const userId = auth.userId;

        const body = await request.json();
        const validated = settingsSchema.parse(body);

        const settings = await prisma.settings.upsert({
            where: { userId },
            update: validated,
            create: {
                ...defaultSettings,
                ...validated,
                userId,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('更新设置失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: '参数验证失败', details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '更新设置失败' },
            { status: 500 }
        );
    }
}
