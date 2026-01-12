import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { isSMTPConfigured } from '@/lib/mail';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;

const registerSchema = z.object({
    email: z.string().email('请输入有效的邮箱地址'),
    password: z.string().min(6, '密码至少6个字符'),
    name: z.string().min(1, '请输入用户名').optional(),
    turnstileToken: z.string().optional(),
    code: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, turnstileToken, code } = registerSchema.parse(body);

        // Verify Turnstile
        const isHuman = await verifyTurnstileToken(turnstileToken || '');
        if (!isHuman) {
            return NextResponse.json(
                { error: '人机验证失败，请刷新页面重试' },
                { status: 400 }
            );
        }

        // Verify Email Code if SMTP is configured
        const emailEnabled = await isSMTPConfigured();
        if (emailEnabled) {
            if (!code || code.length !== 6) {
                return NextResponse.json(
                    { error: '请输入6位验证码' },
                    { status: 400 }
                );
            }

            const tokenRecord = await prisma.verificationToken.findFirst({
                where: {
                    identifier: email,
                    token: code,
                    expires: { gt: new Date() }
                }
            });

            if (!tokenRecord) {
                return NextResponse.json(
                    { error: '验证码无效或已过期' },
                    { status: 400 }
                );
            }

            // Delete used token
            await prisma.verificationToken.deleteMany({
                where: { identifier: email }
            });
        }

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            );
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                emailVerified: emailEnabled ? new Date() : null,
            }
        });

        // 创建默认时间表
        await prisma.timeTable.create({
            data: {
                userId: user.id,
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

        // 生成JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 设置cookie并返回
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('注册失败:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || '参数验证失败' },
                { status: 400 }
            );
        }
        const errorMessage = error instanceof Error ? error.message : '注册失败';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
