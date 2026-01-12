import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { isSMTPConfigured } from '@/lib/mail';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        // 获取用户信息
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                password: true,
                accounts: {
                    select: {
                        provider: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 401 }
            );
        }

        const isGitHub = user.accounts.some(acc => acc.provider === 'github');

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role
            },
            isGitHub,
            hasPassword: !!user.password
        });
    } catch (e) {
        return NextResponse.json(
            { error: '未登录' },
            { status: 401 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, email, currentPassword, newPassword, code } = body;

        // Verify user exists and get current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                accounts: {
                    select: { provider: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 404 }
            );
        }

        const isGitHub = user.accounts.some(acc => acc.provider === 'github');

        const updateData: any = {};

        // Update basic info
        if (name) updateData.name = name;
        if (email && email !== user.email) {
            if (isGitHub) {
                return NextResponse.json(
                    { error: 'GitHub 注册用户不可修改邮箱' },
                    { status: 400 }
                );
            }
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

            // Verify Email Code if SMTP is configured
            const emailEnabled = await isSMTPConfigured();
            if (emailEnabled) {
                if (!code || code.length !== 6) {
                    return NextResponse.json(
                        { error: '请输入6位验证码以确认更改邮箱' },
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

                updateData.emailVerified = new Date();
            } else {
                updateData.emailVerified = null;
            }

            updateData.email = email;
        }

        // Update password
        if (newPassword) {
            if (!user.password) {
                // If user has no password (e.g. OAuth user setting password for first time),
                // allow setting it without currentPassword
            } else {
                if (!currentPassword) {
                    return NextResponse.json(
                        { error: '修改密码需要提供当前密码' },
                        { status: 400 }
                    );
                }
                // Verify current password
                const isValid = await import('bcryptjs').then(m => m.compare(currentPassword, user.password!));
                if (!isValid) {
                    return NextResponse.json(
                        { error: '当前密码错误' },
                        { status: 400 }
                    );
                }
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
                role: true,
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

// Delete account handler
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: '未登录' },
                { status: 401 }
            );
        }

        // Check for GitHub account and revoke grant
        const accounts = await prisma.account.findMany({
            where: { userId: session.user.id }
        });

        const githubAccount = accounts.find(acc => acc.provider === 'github');

        if (githubAccount && githubAccount.access_token) {
            try {
                const clientId = process.env.GITHUB_CLIENT_ID;
                const clientSecret = process.env.GITHUB_CLIENT_SECRET;

                if (clientId && clientSecret) {
                    const authHeader = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');

                    const revokeRes = await fetch(`https://api.github.com/applications/${clientId}/grant`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json',
                            'User-Agent': 'SmartSchedule-App'
                        },
                        body: JSON.stringify({ access_token: githubAccount.access_token })
                    });

                    if (!revokeRes.ok) {
                        console.warn('Failed to revoke GitHub grant:', await revokeRes.text());
                    } else {
                        console.log('Successfully revoked GitHub grant');
                    }
                }
            } catch (revokeError) {
                console.error('Error revoking GitHub grant:', revokeError);
            }
        }

        await prisma.user.delete({
            where: { id: session.user.id }
        });

        const cookieName = process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token';

        const response = NextResponse.json({ success: true });
        response.cookies.set(cookieName, '', { maxAge: 0 });

        return response;

    } catch (error) {
        console.error('Delete account failed:', error);
        return NextResponse.json(
            { error: '注销失败' },
            { status: 500 }
        );
    }
}
