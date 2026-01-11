import { useState } from 'react';
import { Clipboard, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharePasteUploaderProps {
    onUploadComplete: (data: any) => void;
}

export function SharePasteUploader({ onUploadComplete }: SharePasteUploaderProps) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePaste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
            setError(null);
        } catch (e) {
            console.error('Failed to read clipboard', e);
            setError('无法读取剪贴板，请手动粘贴');
        }
    };

    const handleSubmit = async () => {
        if (!text.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Extract code
            // Look for "---CODE---" block first
            let code = '';
            const codeBlockMatch = text.match(/---CODE---\s*([A-Za-z0-9]{10})\s*/);

            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            } else {
                // Try to find a standalone 10-char alphanumeric string if the text is short
                const cleanText = text.trim();
                if (cleanText.length === 10 && /^[A-Za-z0-9]{10}$/.test(cleanText)) {
                    code = cleanText;
                } else {
                    // Fallback: search for pattern "分享码: CODE"
                    const shareCodeMatch = text.match(/分享码:\s*([A-Za-z0-9]{10})/);
                    if (shareCodeMatch) {
                        code = shareCodeMatch[1];
                    }
                }
            }

            if (!code) {
                throw new Error('未找到有效的10位分享码');
            }

            // Fetch schedule
            const res = await fetch(`/api/schedules/share/${code}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '获取课表失败');
            }

            const scheduleData = await res.json();
            onUploadComplete(scheduleData);

        } catch (e: any) {
            console.error(e);
            setError(e.message || '解析失败，请检查分享码是否正确');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Clipboard className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium">粘贴分享码</h3>
                <p className="text-sm text-muted-foreground">
                    请粘贴您收到的完整分享文本或 10 位分享码
                </p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className={cn(
                            "w-full h-32 p-4 text-sm bg-muted/50 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                            error ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"
                        )}
                        placeholder="在此粘贴..."
                    />
                    {!text && (
                        <button
                            onClick={handlePaste}
                            className="absolute inset-0 flex items-center justify-center bg-transparent text-primary font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl"
                        >
                            <span className="bg-background/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border flex items-center gap-2">
                                <Clipboard className="w-4 h-4" />
                                点击粘贴剪贴板内容
                            </span>
                        </button>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg flex items-center gap-2">
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || loading}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            正在获取...
                        </>
                    ) : (
                        <>
                            开始识别
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
