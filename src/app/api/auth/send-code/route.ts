import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationCode, sendPasswordResetCode, isSMTPConfigured } from '@/lib/mail';
import { z } from 'zod';
import { auth } from '@/auth';

const sendCodeSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    type: z.enum(['register', 'reset', 'update-email']),
});

export async function POST(request: NextRequest) {
    try {
        const emailEnabled = await isSMTPConfigured();
        if (!emailEnabled) {
            return NextResponse.json(
                { error: '邮件服务未启用' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { email, type } = sendCodeSchema.parse(body);

        // 1. Check user existence based on type
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (type === 'register' && existingUser) {
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            );
        }

        if (type === 'reset' && !existingUser) {
            return NextResponse.json(
                { error: '该邮箱未注册' },
                { status: 404 }
            );
        }

        if (type === 'update-email') {
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: '请先登录' }, { status: 401 });
            }
            if (existingUser && existingUser.id !== session.user.id) {
                return NextResponse.json({ error: '该邮箱已被占用' }, { status: 400 });
            }
        }

        // 2. Generate Code (6 digits)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 3. Store or Update Token in DB
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token: code,
                expires
            }
        });

        // 4. Send Email based on type
        if (type === 'reset') {
            await sendPasswordResetCode(email, code);
        } else {
            await sendVerificationCode(email, code);
        }

        return NextResponse.json({ success: true, message: '验证码已发送' });

    } catch (error) {
        console.error('Send code error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || '参数错误' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '发送失败，请稍后重试' },
            { status: 500 }
        );
    }
}
