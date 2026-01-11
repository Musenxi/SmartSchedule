import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

async function createTransporter() {
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: {
                in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from', 'smtp_secure']
            }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach(s => config[s.key] = s.value);

    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
        throw new Error('SMTP configuration is incomplete');
    }

    return nodemailer.createTransport({
        host: config.smtp_host,
        port: parseInt(config.smtp_port || '465'),
        secure: config.smtp_secure === 'true' || config.smtp_port === '465', // true for 465, false for other ports
        auth: {
            user: config.smtp_user,
            pass: config.smtp_password,
        },
    });
}

export async function sendEmail({ to, subject, html }: SendMailOptions) {
    const transporter = await createTransporter();

    // Get "from" address
    const fromSetting = await prisma.systemSetting.findUnique({
        where: { key: 'smtp_from' }
    });
    const from = fromSetting?.value || process.env.SMTP_FROM || 'noreply@smartschedule.com';

    await transporter.sendMail({
        from,
        to,
        subject,
        html,
    });
}

export async function sendVerificationCode(email: string, code: string) {
    const subject = '【SmartSchedule】您的注册验证码';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">验证您的邮箱</h2>
            <p>您好，</p>
            <p>感谢您注册。您的验证码是：</p>
            <p style="font-size: 24px; font-weight: bold; color: #3B82F6; letter-spacing: 2px;">${code}</p>
            <p>该验证码将在 10 分钟后失效。如果您没有请求此验证码，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
        </div>
    `;

    await sendEmail({ to: email, subject, html });
}

export async function isSMTPConfigured(): Promise<boolean> {
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: {
                in: ['smtp_host', 'smtp_user', 'smtp_password']
            }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach(s => config[s.key] = s.value);

    return !!(config.smtp_host && config.smtp_user && config.smtp_password);
}
