
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Lock, Loader2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'delete'>('general');

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI States
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Confirm Dialog State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        // ... (fetch user logic same as before)
        fetch('/api/auth/me')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    setName(data.user.name || '');
                    setEmail(data.user.email || '');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [router]);

    const handleDeleteAccount = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/auth/me', { method: 'DELETE' });
            if (res.ok) {
                setUser(null);
                window.location.href = '/login';
            } else {
                throw new Error('注销失败');
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || '操作失败' });
            setSaving(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        // ... (update logic same as before)
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            const body: any = {};

            if (activeTab === 'general') {
                body.name = name;
                body.email = email;
            } else if (activeTab === 'security') {
                if (newPassword !== confirmPassword) {
                    throw new Error('两次输入的新密码不一致');
                }
                if (newPassword.length < 6) {
                    throw new Error('新密码长度不能少于6位');
                }
                if (!currentPassword) {
                    throw new Error('请输入当前密码以确认修改');
                }
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            const res = await fetch('/api/auth/me', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '更新失败');
            }

            setMessage({ type: 'success', text: activeTab === 'general' ? '个人信息已更新' : '密码已修改，下次登录请使用新密码' });

            if (activeTab === 'security') {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }

            if (data.user) {
                setUser(data.user);
            }

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <h1 className="text-lg font-semibold">个人资料</h1>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Sidebar / Tabs */}
                    <div className="md:col-span-4 space-y-2">
                        <button
                            onClick={() => { setActiveTab('general'); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'general'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            基本信息
                        </button>
                        <button
                            onClick={() => { setActiveTab('security'); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'security'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <Lock className="w-4 h-4" />
                            安全设置
                        </button>
                        <button
                            onClick={() => { setActiveTab('delete'); setMessage(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'delete'
                                ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                : 'text-red-600/80 hover:bg-red-50 hover:text-red-600 dark:text-red-400/80 dark:hover:bg-red-900/10'
                                }`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            注销账户
                        </button>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-8">
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                {activeTab === 'general' && (
                                    <>
                                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                                        基本信息
                                    </>
                                )}
                                {activeTab === 'security' && (
                                    <>
                                        <div className="w-1 h-6 bg-primary rounded-full"></div>
                                        安全设置
                                    </>
                                )}
                                {activeTab === 'delete' && (
                                    <>
                                        <div className="w-1 h-6 bg-red-600 rounded-full"></div>
                                        注销账户
                                    </>
                                )}
                            </h2>

                            {message && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-destructive/10 text-destructive'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 flex items-center justify-center font-bold text-xs ring-2 ring-current rounded-full">!</div>}
                                    {message.text}
                                </div>
                            )}

                            {activeTab === 'delete' ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl space-y-4">
                                        <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                                            <AlertTriangle className="w-6 h-6" />
                                            <h3 className="text-lg font-semibold">危险操作警告</h3>
                                        </div>
                                        <div className="space-y-2 text-sm text-red-600/90 dark:text-red-400/90 leading-relaxed">
                                            <p>您正在尝试注销您的账户。此操作将产生以下后果：</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>永久删除您的个人资料和登录信息</li>
                                                <li>永久删除所有您创建的课程表、任务和设置</li>
                                                <li>有效期内的课程表分享链接将会失效</li>
                                            </ul>
                                            <p className="font-semibold pt-2">确认注销后，所有数据将无法恢复！</p>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm hover:shadow-md active:scale-95"
                                            >
                                                永久删除账户
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    {activeTab === 'general' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">用户名</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={e => setName(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        placeholder="用户名"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">邮箱地址</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={e => setEmail(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        placeholder="your@email.com"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground pl-1">
                                                    更改邮箱后，下次登录请使用新邮箱
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'security' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">当前密码</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="password"
                                                        value={currentPassword}
                                                        onChange={e => setCurrentPassword(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        placeholder="请输入当前密码以验证身份"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <hr className="border-border/50 border-dashed" />

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">新密码</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        placeholder="至少 6 位字符"
                                                        minLength={6}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">确认新密码</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={e => setConfirmPassword(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        placeholder="再次输入新密码"
                                                        minLength={6}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    正在保存...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    保存更改
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="确认注销账户？"
                description={`此操作将永久删除您的账户及所有关联数据（包括课程表、任务等）且无法恢复。\n\n您确定要继续吗？`}
                confirmText="确认注销"
                cancelText="取消"
                variant="destructive"
                onConfirm={handleDeleteAccount}
            />
        </div>
    );
}
