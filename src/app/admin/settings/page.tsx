'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Globe, ShieldCheck, Mail } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [testing, setTesting] = useState(false);

    const handleTestEmail = async (to: string) => {
        if (!to) {
            import('sonner').then(({ toast }) => toast.error('请输入收件人地址'));
            return;
        }

        setTesting(true);
        try {
            const res = await fetch('/api/admin/settings/test-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to }),
            });
            const data = await res.json();

            if (res.ok) {
                import('sonner').then(({ toast }) => toast.success('测试邮件已发送，请查收'));
            } else {
                import('sonner').then(({ toast }) => toast.error(data.error || '发送失败'));
            }
        } catch (e) {
            import('sonner').then(({ toast }) => toast.error('网络错误'));
        } finally {
            setTesting(false);
        }
    };


    useEffect(() => {
        fetch('/api/admin/system-settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setSettings(data.settings);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (key: string, value: string) => {
        if (value === '********') return;
        setSavingKey(key);
        try {
            const res = await fetch('/api/admin/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
            if (res.ok) {
                setSettings(prev => ({ ...prev, [key]: value }));
                import('sonner').then(({ toast }) => toast.success('保存成功'));
            } else {
                import('sonner').then(({ toast }) => toast.error('保存失败'));
            }
        } catch (e) {
            console.error(e);
            import('sonner').then(({ toast }) => toast.error('保存出错'));
        } finally {
            setSavingKey(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold">全局设置</h1>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 max-w-2xl">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            基本配置
                        </h3>

                        <div className="space-y-4 pt-2">
                            {/* Admin Domain Setting */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    管理员访问域名限制
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="例如：admin.example.com (留空则不限制)"
                                        value={settings['admin_domain'] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'admin_domain': e.target.value }))}
                                    />
                                    <button
                                        onClick={() => handleSave('admin_domain', settings['admin_domain'] || '')}
                                        disabled={savingKey === 'admin_domain'}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {savingKey === 'admin_domain' ? '...' : '保存'}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    设置后，管理员后台仅能通过该域名访问。请确保您已正确配置 DNS 解析。
                                </p>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                                <div>
                                    <div className="font-medium">开放注册</div>
                                    <div className="text-xs text-muted-foreground">是否允许新用户注册</div>
                                </div>
                                <div
                                    className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${settings['allow_register'] === 'false' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary'}`}
                                    onClick={() => handleSave('allow_register', settings['allow_register'] === 'false' ? 'true' : 'false')}
                                >
                                    <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${settings['allow_register'] === 'false' ? 'left-1' : 'right-1'}`} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">网站标题</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings['site_title'] || 'SmartSchedule'}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'site_title': e.target.value }))}
                                    />
                                    <button
                                        onClick={() => handleSave('site_title', settings['site_title'] || '')}
                                        disabled={savingKey === 'site_title'}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {savingKey === 'site_title' ? '...' : '保存'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

                        {/* GitHub OAuth Settings */}
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub 登录配置
                            </h4>

                            <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">启用 GitHub 登录</div>
                                        <div className="text-xs text-muted-foreground">允许用户使用 GitHub 账号登录</div>
                                    </div>
                                    <div
                                        className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${settings['github_oauth_enabled'] === 'true' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        onClick={() => handleSave('github_oauth_enabled', settings['github_oauth_enabled'] === 'true' ? 'false' : 'true')}
                                    >
                                        <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${settings['github_oauth_enabled'] === 'true' ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>

                                <div className="border-t border-border/50" />

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium text-sm">环境变量状态</div>
                                        {settings['_github_env_configured'] === 'true' ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                已配置
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                未配置
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        请在项目根目录的 <code className="bg-muted px-1 py-0.5 rounded text-foreground">.env</code> 或 <code className="bg-muted px-1 py-0.5 rounded text-foreground">.env.local</code> 文件中配置以下变量：
                                    </p>
                                    <div className="mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-lg font-mono text-xs text-muted-foreground break-all">
                                        GITHUB_CLIENT_ID=your_client_id<br />
                                        GITHUB_CLIENT_SECRET=your_client_secret
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

                        {/* AI Settings */}
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                AI 服务配置 (Gemini)
                            </h4>

                            <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">全局 Gemini API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={settings['gemini_api_key'] || ''}
                                            onChange={(e) => setSettings(prev => ({ ...prev, 'gemini_api_key': e.target.value }))}
                                            placeholder="AIzaSy..."
                                        />
                                        <button
                                            onClick={() => handleSave('gemini_api_key', settings['gemini_api_key'] || '')}
                                            disabled={savingKey === 'gemini_api_key'}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {savingKey === 'gemini_api_key' ? '...' : '保存'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        为未配置个人 Key 的用户提供默认服务。
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-border/50">
                                    <label className="text-sm font-medium">每日免费额度限制</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={settings['gemini_api_limit'] || '5'}
                                            onChange={(e) => setSettings(prev => ({ ...prev, 'gemini_api_limit': e.target.value }))}
                                            placeholder="5"
                                            min="1"
                                        />
                                        <button
                                            onClick={() => handleSave('gemini_api_limit', settings['gemini_api_limit'] || '5')}
                                            disabled={savingKey === 'gemini_api_limit'}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {savingKey === 'gemini_api_limit' ? '...' : '保存'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        每个用户每 24 小时可使用全局 Key 的最大次数（默认 5 次）。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

                        {/* Turnstile Settings */}
                        <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                安全配置 (Turnstile)
                            </h4>

                            <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">启用 Cloudflare Turnstile</div>
                                        <div className="text-xs text-muted-foreground">在注册和登录页面启用人机验证</div>
                                    </div>
                                    <div
                                        className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${settings['turnstile_enabled'] === 'true' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                                        onClick={() => handleSave('turnstile_enabled', settings['turnstile_enabled'] === 'true' ? 'false' : 'true')}
                                    >
                                        <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${settings['turnstile_enabled'] === 'true' ? 'right-1' : 'left-1'}`} />
                                    </div>
                                </div>

                                {settings['turnstile_enabled'] === 'true' && (
                                    <div className="grid gap-4 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Site Key</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={settings['turnstile_site_key'] || ''}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, 'turnstile_site_key': e.target.value }))}
                                                    placeholder="0x4AAAAAA..."
                                                />
                                                <button
                                                    onClick={() => handleSave('turnstile_site_key', settings['turnstile_site_key'] || '')}
                                                    disabled={savingKey === 'turnstile_site_key'}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {savingKey === 'turnstile_site_key' ? '...' : '保存'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Secret Key</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={settings['turnstile_secret_key'] || ''}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, 'turnstile_secret_key': e.target.value }))}
                                                    placeholder="0x4AAAAAA..."
                                                />
                                                <button
                                                    onClick={() => handleSave('turnstile_secret_key', settings['turnstile_secret_key'] || '')}
                                                    disabled={savingKey === 'turnstile_secret_key'}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {savingKey === 'turnstile_secret_key' ? '...' : '保存'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

                    {/* SMTP Settings */}
                    <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            邮件服务配置 (SMTP)
                        </h4>

                        <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-sm">启用邮件验证服务</div>
                                    <div className="text-xs text-muted-foreground">在注册和修改邮箱时发送 6 位验证码</div>
                                </div>
                                <div
                                    className={`h-6 w-11 rounded-full relative cursor-pointer transition-colors ${settings['smtp_enabled'] === 'true' ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    onClick={() => handleSave('smtp_enabled', settings['smtp_enabled'] === 'true' ? 'false' : 'true')}
                                >
                                    <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-all ${settings['smtp_enabled'] === 'true' ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SMTP 服务器</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings['smtp_host'] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'smtp_host': e.target.value }))}
                                        onBlur={(e) => handleSave('smtp_host', e.target.value)}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">端口</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={settings['smtp_port'] || '465'}
                                            onChange={(e) => setSettings(prev => ({ ...prev, 'smtp_port': e.target.value }))}
                                            onBlur={(e) => handleSave('smtp_port', e.target.value)}
                                            placeholder="465"
                                        />
                                        <div className="flex items-center gap-2 bg-background border border-input px-3 rounded-xl">
                                            <input
                                                type="checkbox"
                                                id="smtp_secure"
                                                checked={settings['smtp_secure'] === 'true'}
                                                onChange={(e) => {
                                                    const val = e.target.checked ? 'true' : 'false';
                                                    setSettings(prev => ({ ...prev, 'smtp_secure': val }));
                                                    handleSave('smtp_secure', val);
                                                }}
                                                className="w-4 h-4 text-primary rounded focus:ring-primary/20"
                                            />
                                            <label htmlFor="smtp_secure" className="text-sm cursor-pointer whitespace-nowrap">SSL</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">账号</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings['smtp_user'] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'smtp_user': e.target.value }))}
                                        onBlur={(e) => handleSave('smtp_user', e.target.value)}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">密码 / 授权码</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={settings['smtp_password'] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'smtp_password': e.target.value }))}
                                        onBlur={(e) => handleSave('smtp_password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">发件人地址</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none mb-2"
                                    value={settings['smtp_from'] || ''}
                                    onChange={(e) => setSettings(prev => ({ ...prev, 'smtp_from': e.target.value }))}
                                    onBlur={(e) => handleSave('smtp_from', e.target.value)}
                                    placeholder="noreply@example.com"
                                />
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border/50">
                                <label className="text-sm font-medium">SMTP 测试</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="收件人邮箱"
                                        value={settings['test_recipient'] || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, 'test_recipient': e.target.value }))}
                                    />
                                    <button
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 min-w-[100px]"
                                        onClick={() => handleTestEmail(settings['test_recipient'] || '')}
                                        disabled={testing}
                                    >
                                        {testing ? '发送中...' : '发送测试'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
