import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendEmail } from '@/lib/mail';
import { z } from 'zod';

const testEmailSchema = z.object({
    to: z.string().email('请输入有效的收件人邮箱'),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        // 1. Verify admin session
        if (!session?.user?.id || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json(
                { error: '权限不足' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { to } = testEmailSchema.parse(body);

        console.log(`[SMTP Test] Sending test email to: ${to}`);

        // 2. Send Test Email
        await sendEmail({
            to,
            subject: 'SmartSchedule SMTP 测试邮件',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
                    <h2 style="color: #3b82f6;">SMTP 配置测试成功</h2>
                    <p>这是一封来自 <strong>SmartSchedule</strong> 的测试邮件。</p>
                    <p>如果您收到了这封邮件，说明您的 SMTP 服务已正确配置并能够正常发送邮件。</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #6b7280;">发送时间: ${new Date().toLocaleString()}</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true, message: '测试邮件已发送' });

    } catch (error) {
        console.error('Test email error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || '参数错误' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: '发送失败，请检查 SMTP 配置' },
            { status: 500 }
        );
    }
}
