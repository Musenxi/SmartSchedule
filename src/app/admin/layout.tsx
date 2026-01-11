'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, notFound } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from 'sonner';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isNotFound, setIsNotFound] = useState(false);

    useEffect(() => {
        // Authenticate and check role
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(async (data) => {
                if (!data.user || data.user.role !== 'ADMIN') {
                    router.replace('/login');
                    return;
                }

                // Check Admin Domain Restriction
                try {
                    const settingsRes = await fetch('/api/admin/system-settings');
                    const settingsData = await settingsRes.json();
                    const adminDomain = settingsData.settings?.['admin_domain'];

                    if (adminDomain) {
                        const targetDomain = adminDomain.trim();
                        const currentHost = window.location.host;
                        const currentHostname = window.location.hostname;

                        // Debugging logs
                        console.log('Admin Domain Check:', {
                            target: targetDomain,
                            currentHost,
                            currentHostname
                        });

                        // Check if either host (with port) or hostname (without port) matches
                        if (currentHost !== targetDomain && currentHostname !== targetDomain) {
                            console.warn('Admin domain mismatch, showing 404...');
                            setIsNotFound(true);
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Failed to check admin domain', e);
                }

                setUser(data.user);
                setLoading(false);
            })
            .catch(() => {
                router.replace('/login');
            });
    }, [router]);

    if (isNotFound) {
        notFound();
    }

    const navItems = [
        { name: '仪表盘', href: '/admin', icon: LayoutDashboard },
        { name: '用户管理', href: '/admin/users', icon: Users },
        { name: '全局设置', href: '/admin/settings', icon: Settings },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            <Toaster richColors position="top-right" />

            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full inset-y-0 z-50">
                <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
                    <ShieldCheck className="w-8 h-8 text-primary mr-3" />
                    <span className="font-bold text-xl">管理后台</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">{user?.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                                window.location.href = '/login';
                            });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        退出登录
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
