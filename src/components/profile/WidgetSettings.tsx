
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

import { WIDGET_SCRIPT_TEMPLATE } from '@/lib/widget-script';

export function WidgetSettings() {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        fetch('/api/user/widget-token')
            .then(res => res.json())
            .then(data => {
                setToken(data.token);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleRegenerate = async () => {
        if (!confirm('重新生成 Token 将导致即刻失效旧的 Token，之前的组件将无法获取数据。确定要继续吗？')) return;

        setRegenerating(true);
        try {
            const res = await fetch('/api/user/widget-token', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
                toast.success('Token 已更新');
            } else {
                toast.error('Token 更新失败');
            }
        } catch (e) {
            toast.error('请求失败');
        } finally {
            setRegenerating(false);
        }
    };

    const apiUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/widget/schedule?token=${token || 'YOUR_TOKEN'}`
        : '';

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            toast.success('已复制到剪贴板');
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Widget Token (密钥)</label>
                        <button
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="text-xs flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                            {token ? '重置密钥' : '生成密钥'}
                        </button>
                    </div>

                    {token ? (
                        <div className="relative font-mono text-sm bg-background border p-3 rounded-lg break-all">
                            {token}
                            <button
                                onClick={() => copyToClipboard(token)}
                                className="absolute right-2 top-2 p-1.5 hover:bg-muted rounded-md transition-colors"
                            >
                                <Copy className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">
                            尚未生成密钥，请点击上方生成。
                        </div>
                    )}
                </div>

                {token && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">脚本代码 (点击复制)</label>
                        <div className="relative font-mono text-xs bg-muted/50 border p-3 rounded-lg overflow-hidden">
                            <div className="max-h-[150px] overflow-y-auto break-all whitespace-pre-wrap text-muted-foreground">
                                {WIDGET_SCRIPT_TEMPLATE.replace('__API_URL__', apiUrl)}
                            </div>
                            <button
                                onClick={() => copyToClipboard(WIDGET_SCRIPT_TEMPLATE.replace('__API_URL__', apiUrl))}
                                className="absolute right-2 top-2 p-1.5 bg-background shadow-sm hover:bg-muted rounded-md transition-colors border"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            复制上方所有代码，在 Scriptable 中新建脚本并粘贴。
                        </p>
                    </div>
                )}

                <div className="pt-2">
                    <button
                        onClick={() => window.location.href = 'scriptable:///'}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                    >
                        打开 Scriptable
                    </button>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <h3 className="text-sm font-medium mb-2">使用教程</h3>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                        <li>下载 <a href="https://apps.apple.com/app/scriptable/id1405459188" target="_blank" className="text-primary hover:underline">Scriptable App</a></li>
                        <li>复制上方的脚本代码</li>
                        <li>在 Scriptable 中新建脚本，粘贴并保存</li>
                        <li>在桌面添加 iOS 小组件并选择该脚本</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
