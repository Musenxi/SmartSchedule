import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSMTPConfigured } from '@/lib/mail';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const resetPasswordSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    code: z.string().length(6, '验证码必须是6位数字'),
    newPassword: z.string().min(6, '密码至少6位'),
});

export async function POST(request: NextRequest) {
    try {
        // Check SMTP is configured
        const emailEnabled = await isSMTPConfigured();
        if (!emailEnabled) {
            return NextResponse.json(
                { error: '邮件服务未启用' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { email, code, newPassword } = resetPasswordSchema.parse(body);

        // 1. Find and validate the verification token
        const token = await prisma.verificationToken.findFirst({
            where: {
                identifier: email,
                token: code,
            }
        });

        if (!token) {
            return NextResponse.json(
                { error: '验证码错误' },
                { status: 400 }
            );
        }

        if (token.expires < new Date()) {
            // Delete expired token
            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: email,
                        token: code,
                    }
                }
            });
            return NextResponse.json(
                { error: '验证码已过期，请重新获取' },
                { status: 400 }
            );
        }

        // 2. Find the user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            );
        }

        // 3. Hash new password and update user
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        // 4. Delete the used verification token
        await prisma.verificationToken.delete({
            where: {
                identifier_token: {
                    identifier: email,
                    token: code,
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: '密码重置成功'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || '参数错误' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '重置失败，请稍后重试' },
            { status: 500 }
        );
    }
}
