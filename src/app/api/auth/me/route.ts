import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

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
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: '用户不存在' },
                { status: 401 }
            );
        }

        return NextResponse.json({ user });
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
        const { name, email, currentPassword, newPassword } = body;

        // Verify user exists and get current password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
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
            if (!user.password) {
                if (currentPassword) {
                    return NextResponse.json(
                        { error: 'OAuth 用户請直接设置密码' },
                        { status: 400 }
                    );
                }
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
