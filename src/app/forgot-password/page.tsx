'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TurnstileWidget from '@/components/auth/turnstile-widget';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [smtpEnabled, setSmtpEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if SMTP is enabled
        fetch('/api/auth/config')
            .then(res => res.json())
            .then(data => {
                setSmtpEnabled(data.emailEnabled);
                if (!data.emailEnabled) {
                    router.replace('/login');
                }
            })
            .catch(() => {
                router.replace('/login');
            });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'reset' }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '发送失败');
                setLoading(false);
                return;
            }

            // Navigate to reset password page with email
            router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch {
            setError('网络错误，请重试');
            setLoading(false);
        }
    };

    if (smtpEnabled === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md p-8 bg-card rounded-2xl shadow-xl border border-border">
                    <div className="flex justify-center p-10">
                        <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-xl border border-border">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">忘记密码</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        输入您的邮箱，我们将发送验证码
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-lg border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            邮箱
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <TurnstileWidget onVerify={() => { }} />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 focus:ring-4 focus:ring-ring/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                发送中...
                            </span>
                        ) : '发送验证码'}
                    </button>

                    <div className="text-center text-sm text-muted-foreground">
                        <a href="/login" className="text-primary hover:underline">
                            返回登录
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
