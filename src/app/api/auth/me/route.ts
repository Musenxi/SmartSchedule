import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartschedule-secret-key-2026';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        // 验证token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

        // 获取用户信息
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 401 }
            );
        }

        return NextResponse.json({ user });
    } catch {
        return NextResponse.json(
            { error: '未登录' },
            { status: 401 }
        );
    }
}
