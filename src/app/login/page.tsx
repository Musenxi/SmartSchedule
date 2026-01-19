'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from "next-auth/react"
import TurnstileWidget from '@/components/auth/turnstile-widget';
import { PasswordInput } from '@/components/ui/PasswordInput';

import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    // Check system initialization status
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.initialized) {
          router.replace('/setup');
        }
      })
      .catch(console.error);

    // Check auth config (for forgot password link)
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => {
        setEmailEnabled(data.emailEnabled === true);
      })
      .catch(() => { });

    // Check for auth errors
    const errorParam = searchParams.get('error');
    if (errorParam === 'CredentialsSignin') {
      setError('邮箱或密码错误');
    }
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        turnstileToken,
        redirect: false,
      })

      if (result?.error) {
        setError('邮箱或密码错误');
        setLoading(false);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
          <p className="text-sm text-muted-foreground mt-2">
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGitHubLogin}
            type="button"
            className="flex items-center justify-center gap-3 w-full py-3 bg-[#24292e] hover:bg-[#24292e]/90 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            使用 GitHub 登录
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                密码
              </label>
              {emailEnabled && (
                <a href="/forgot-password" className="text-sm text-primary hover:underline">
                  忘记密码?
                </a>
              )}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
                登录中...
              </span>
            ) : '登录'}
          </button>



          <div className="text-center text-sm text-muted-foreground">
            还没有账号？
            <a href="/register" className="text-primary hover:underline ml-1">
              立即注册
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl shadow-xl border border-border">
          <div className="flex justify-center p-10">
            <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}