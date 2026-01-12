'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from "next-auth/react"
import TurnstileWidget from '@/components/auth/turnstile-widget';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);

    useEffect(() => {
        // Fetch Auth Config
        fetch('/api/auth/config')
            .then(res => res.json())
            .then(data => {
                if (data.emailVerification) {
                    setEmailVerificationEnabled(true);
                }
            })
            .catch(console.error);

        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendCode = async () => {
        if (!email) {
            setError('请先填写邮箱地址');
            return;
        }
        setError('');
        setSendingCode(true);

        try {
            const res = await fetch('/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type: 'register' }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '发送失败');
            } else {
                setCountdown(60);
                import('sonner').then(({ toast }) => toast.success('验证码已发送，请查收邮件'));
            }
        } catch (e) {
            setError('发送失败，请稍后重试');
        } finally {
            setSendingCode(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (password.length < 6) {
            setError('密码至少需要6个字符');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    name: name || undefined,
                    turnstileToken,
                    code: emailVerificationEnabled ? code : undefined
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '注册失败');
                setLoading(false);
                return;
            }

            // 注册成功，自动登录
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                // Should not happen if registration was success
                setError('注册成功但自动登录失败，请手动登录');
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            // 登录成功，跳转到课表页
            router.push('/schedule');
            router.refresh();
        } catch {
            setError('网络错误，请重试');
            setLoading(false);
        }
    };

    const handleGitHubLogin = () => {
        signIn("github", { callbackUrl: "/schedule" });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-xl border border-border">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">创建账户</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        注册智能课程表
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={handleGitHubLogin}
                        className="flex items-center justify-center gap-3 w-full py-3 bg-[#24292e] hover:bg-[#24292e]/90 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                        使用 GitHub 注册
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">或者使用邮箱</span>
                        </div>
                    </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-lg border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                            用户名 <span className="text-muted-foreground">(可选)</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground"
                            placeholder="用户名"
                        />
                    </div>

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

                    {emailVerificationEnabled && (
                        <div className="space-y-1">
                            <label htmlFor="code" className="block text-sm font-medium text-foreground">
                                验证码
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                    placeholder="6位验证码"
                                    maxLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleSendCode}
                                    disabled={countdown > 0 || sendingCode || !email}
                                    className="px-4 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                                >
                                    {sendingCode ? (
                                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                                    ) : countdown > 0 ? (
                                        `${countdown}s`
                                    ) : (
                                        '获取验证码'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                            密码
                        </label>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="至少6个字符"
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

                    <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

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
                                注册中...
                            </span>
                        ) : '注册'}
                    </button>

                    <div className="text-center text-sm text-muted-foreground">
                        已有账号？
                        <Link href="/login" className="text-primary hover:underline ml-1">
                            立即登录
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
