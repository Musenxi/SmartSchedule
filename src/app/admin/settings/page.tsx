'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        setSaving(true);
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
            setSaving(false);
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
                                        disabled={saving}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        保存
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
                                        disabled={saving}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-500 p-4 rounded-xl text-sm">
                            更多全局设置（SMTP、AI配置等）正在开发中...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
