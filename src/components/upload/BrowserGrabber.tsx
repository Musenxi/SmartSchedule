'use client';

import { useState } from 'react';
import { Globe, Code2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { parseAcademicHTML } from '@/lib/import/html-parser';

interface BrowserGrabberProps {
    onUploadComplete: (data: any) => void;
}

export function BrowserGrabber({ onUploadComplete }: BrowserGrabberProps) {
    const [html, setHtml] = useState('');
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleParse = async () => {
        if (!html.trim()) {
            setError('请先粘贴教务系统页面的 HTML 源码');
            return;
        }

        setParsing(true);
        setError(null);

        try {
            // Give UI a chance to show loader
            await new Promise(resolve => setTimeout(resolve, 800));

            const courses = parseAcademicHTML(html);

            if (courses.length === 0) {
                throw new Error('未能从 HTML 中识别出课程。请确保您粘贴的是包含课程表的完整页面源码。');
            }

            onUploadComplete({ courses, rawText: 'From HTML Source' });
        } catch (err) {
            setError(err instanceof Error ? err.message : '解析失败，请检查输入内容');
        } finally {
            setParsing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-900 dark:text-blue-400 text-sm">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <div className="space-y-1">
                    <p className="font-medium">教务系统自动抓取技巧</p>
                    <p className="opacity-80">
                        目前支持“源码抓取”：在教务系统课表页面<kbd className="px-1 bg-blue-500/20 rounded">点击右键-检查</kbd>
                        ，移动到最上方<kbd className="px-1 bg-blue-500/20 rounded">&lt;body&gt;</kbd>标签，右键<kbd className="px-1 bg-blue-500/20 rounded">Copy - Copy outerHTML</kbd>并粘贴到下方框内，系统将自动提取课程信息。
                    </p>
                </div>
            </div>

            <div className="relative group">
                <div className="absolute top-4 left-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Code2 className="w-5 h-5" />
                </div>
                <textarea
                    value={html}
                    onChange={(e) => {
                        setHtml(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder="在此处粘贴教务系统课表页面的 HTML 源代码..."
                    className="w-full h-64 pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <button
                disabled={!html.trim() || parsing}
                onClick={handleParse}
                className="w-full py-3.5 bg-primary text-primary-foreground font-medium rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
                {parsing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        智能解析中...
                    </>
                ) : (
                    <>
                        <Globe className="w-5 h-5" />
                        开始智能解析
                    </>
                )}
            </button>
        </div>
    );
}
