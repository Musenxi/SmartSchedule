'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Copy, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WidgetSetupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [installUrl, setInstallUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [scriptContent, setScriptContent] = useState('');

    useEffect(() => {
        // Fetch Token
        fetch('/api/user/widget-token')
            .then(res => res.json())
            .then(data => {
                if (data.token) {
                    const origin = window.location.origin;
                    // Construct the URL that Scriptable will download
                    const scriptUrl = `${origin}/api/download-script?token=${data.token}`;

                    // Scriptable URL Scheme
                    // scriptable:///import?url=[URL]&name=[NAME]
                    const scheme = `scriptable:///import?url=${encodeURIComponent(scriptUrl)}&name=SmartSchedule`;
                    setInstallUrl(scheme);

                    // Also fetch script content for manual copy
                    fetch(`${origin}/api/download-script?token=${data.token}`)
                        .then(r => r.text())
                        .then(text => setScriptContent(text));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(scriptContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        import('sonner').then(({ toast }) => toast.success('代码已复制'));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
                    <h1 className="text-lg font-semibold">添加 iOS 桌面小组件</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Step 1: Install App */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                            1
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">准备工作</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                请确保您的 iPhone/iPad 上已安装 <strong>Scriptable</strong> 应用。
                            </p>
                            <a
                                href="https://apps.apple.com/us/app/scriptable/id1405459188"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                            >
                                前往 App Store 下载 <ArrowLeft className="w-4 h-4 rotate-180" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Step 2: One-Click Install */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                            2
                        </div>
                        <div className="w-full space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-primary">一键安装脚本</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    点击下方按钮，将自动唤起 Scriptable 并添加 "SmartSchedule" 脚本。
                                </p>
                            </div>

                            <a
                                href={installUrl}
                                className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all active:scale-95"
                            >
                                <Download className="w-5 h-5" />
                                添加到 Scriptable
                            </a>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center bg-background/50 py-2 rounded-lg">
                                <AlertCircle className="w-4 h-4" />
                                <span>如果无法自动添加，请使用下方的"手动复制代码"</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3: Add Widget */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm shrink-0">
                            3
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">添加到桌面</h3>
                            <ul className="space-y-3 text-sm text-muted-foreground list-decimal pl-4">
                                <li>回到主屏幕，长按空白处进入编辑模式</li>
                                <li>点击左上角 <strong>+</strong> 号，搜索并添加 <strong>Scriptable</strong> 小组件 (推荐中号/小号)</li>
                                <li>点击小组件进入设置，<strong>Script</strong> 选择 <strong>SmartSchedule</strong></li>
                                <li><strong>Parameter</strong> 留空即可 (API 地址已内置)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Manual Method */}
                <div className="pt-8 border-t border-border">
                    <details className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors selection:bg-transparent">
                            <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                            备用方案：手动复制代码
                        </summary>
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                            <div className="relative group/code">
                                <pre className="bg-muted/50 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-border max-h-[300px] custom-scrollbar">
                                    {scriptContent}
                                </pre>
                                <button
                                    onClick={handleCopy}
                                    className="absolute top-2 right-2 p-2 bg-background border border-border rounded-lg shadow-sm hover:bg-muted transition-all"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>
                    </details>
                </div>

            </div>
        </div>
    );
}
