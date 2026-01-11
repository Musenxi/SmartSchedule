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

export async function PUT(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const body = await request.json();
        const { name, email, currentPassword, newPassword } = body;

        // Verify user exists and get current password
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            );
        }

        const updateData: any = {};

        // Update basic info
        if (name) updateData.name = name;
        if (email) {
            // Check if email is already taken by another user
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });
            if (existingUser && existingUser.id !== user.id) {
                return NextResponse.json(
                    { error: '该邮箱已被使用' },
                    { status: 400 }
                );
            }
            updateData.email = email;
        }

        // Update password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json(
                    { error: '修改密码需要提供当前密码' },
                    { status: 400 }
                );
            }

            // Verify current password
            const isValid = await import('bcryptjs').then(m => m.compare(currentPassword, user.password));
            if (!isValid) {
                return NextResponse.json(
                    { error: '当前密码错误' },
                    { status: 400 }
                );
            }

            const hashedPassword = await import('bcryptjs').then(m => m.hash(newPassword, 12));
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
            }
        });

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Update profile failed:', error);
        return NextResponse.json(
            { error: '更新失败' },
            { status: 500 }
        );
    }
}
