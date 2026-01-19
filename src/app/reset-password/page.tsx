'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PasswordInput } from '@/components/ui/PasswordInput';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else {
            router.replace('/forgot-password');
        }
    }, [searchParams, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            setError('密码至少6位');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '重置失败');
                setLoading(false);
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch {
            setError('网络错误，请重试');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-xl border border-border text-center">
                    <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">密码重置成功</h2>
                    <p className="text-muted-foreground">正在跳转到登录页...</p>
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
                    <h2 className="text-2xl font-bold text-foreground">重置密码</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        验证码已发送至 {email}
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-lg border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1">
                            验证码
                        </label>
                        <input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground text-center text-2xl tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1">
                            新密码
                        </label>
                        <PasswordInput
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="至少6位"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                            确认密码
                        </label>
                        <PasswordInput
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="再次输入密码"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 focus:ring-4 focus:ring-ring/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                重置中...
                            </span>
                        ) : '重置密码'}
                    </button>

                    <div className="text-center text-sm text-muted-foreground">
                        <a href="/forgot-password" className="text-primary hover:underline">
                            重新发送验证码
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
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
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
