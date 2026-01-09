'use client';

import { useState } from 'react';
import { PDFUploader } from '@/components/upload/PDFUploader';
import { CSVUploader } from '@/components/upload/CSVUploader';
import { BrowserGrabber } from '@/components/upload/BrowserGrabber';
import { CourseVerifier } from '@/components/upload/CourseVerifier';
import { ArrowLeft, CheckCircle2, FileText, FileSpreadsheet, Globe, PencilLine, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
}

type Step = 'select' | 'upload' | 'verify' | 'success';
type ImportMethod = 'pdf' | 'csv' | 'browser' | 'manual';

export default function ImportPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('select');
    const [method, setMethod] = useState<ImportMethod | null>(null);
    const [result, setResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const handleUploadComplete = (data: any) => {
        setResult(data);
        if (data.courses && data.courses.length > 0) {
            setStep('verify');
        }
    };

    const handleConfirmCourses = async (courses: RecognizedCourse[]) => {
        setSaving(true);
        try {
            const res = await fetch('/api/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courses }),
            });

            if (!res.ok) throw new Error('Save failed');

            setStep('success');
        } catch (error) {
            console.error('Save error:', error);
            alert('保存失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectMethod = (m: ImportMethod) => {
        setMethod(m);
        if (m === 'manual') {
            setResult({ courses: [] });
            setStep('verify');
        } else {
            setStep('upload');
        }
    };

    const handleReset = () => {
        setStep('select');
        setMethod(null);
        setResult(null);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        导入课程表
                    </h1>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className={step === 'select' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        1. 选择方式
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={step === 'upload' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        2. 导入数据
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={step === 'verify' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        3. 确认课程
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={step === 'success' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        4. 完成
                    </span>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    {step === 'select' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectMethod('pdf')}
                                className="group p-6 text-left bg-background border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300 h-full flex flex-col gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">PDF 课表导入</h3>
                                    <p className="text-muted-foreground text-sm">支持教务系统导出的 PDF 文件，自动识别课程地点、节次。</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectMethod('csv')}
                                className="group p-6 text-left bg-background border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300 h-full flex flex-col gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">CSV/Excel 导入</h3>
                                    <p className="text-muted-foreground text-sm">下载标准模版，填写后批量导入。适合手动整理大量课程。</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectMethod('browser')}
                                className="group p-6 text-left bg-background border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300 h-full flex flex-col gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">教务系统抓取</h3>
                                    <p className="text-muted-foreground text-sm">在线登录教务系统，通过浏览器直接抓取当前屏幕课表（开发中）。</p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleSelectMethod('manual')}
                                className="group p-6 text-left bg-background border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300 h-full flex flex-col gap-4"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <PencilLine className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">手动录入</h3>
                                    <p className="text-muted-foreground text-sm">直接进入编辑器，逐条添加课程。最灵活但也最耗时。</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'upload' && (
                        <>
                            <div className="mb-8 flex items-center gap-3">
                                <button onClick={handleReset} className="p-2 hover:bg-muted rounded-full transition-colors">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {method === 'pdf' && '上传 PDF 课表'}
                                        {method === 'csv' && '上传 CSV/Excel 文件'}
                                        {method === 'browser' && '从教务系统导入'}
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        {method === 'pdf' && '系统将尝试自动识别课程信息。识别后您可以手动调整。'}
                                        {method === 'csv' && '请确保您的文件符合标准模版格式。'}
                                        {method === 'browser' && '模拟登录或粘贴教务系统页面源码进行解析。'}
                                    </p>
                                </div>
                            </div>

                            {method === 'pdf' && <PDFUploader onUploadComplete={handleUploadComplete} />}
                            {method === 'csv' && <CSVUploader onUploadComplete={handleUploadComplete} />}
                            {method === 'browser' && <BrowserGrabber onUploadComplete={handleUploadComplete} />}

                            {result && result.courses?.length === 0 && method === 'pdf' && (
                                <div className="mt-6 space-y-4">
                                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                                            未能自动识别课程。以下是提取的文本，您可以参考后手动添加：
                                        </p>
                                    </div>
                                    <pre className="text-xs font-mono bg-muted p-4 rounded-lg border border-border overflow-auto max-h-[300px] whitespace-pre-wrap">
                                        {result.rawText}
                                    </pre>
                                    <button
                                        onClick={() => setStep('verify')}
                                        className="w-full py-2.5 border border-primary text-primary font-medium rounded-xl hover:bg-primary/10 transition-colors"
                                    >
                                        手动添加课程
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'verify' && result && (
                        <CourseVerifier
                            courses={result.courses || []}
                            onConfirm={handleConfirmCourses}
                            onCancel={handleReset}
                        />
                    )}

                    {step === 'success' && (
                        <div className="text-center py-12 space-y-4">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">导入成功!</h2>
                            <p className="text-muted-foreground">课程已添加到您的课表中</p>
                            <button
                                onClick={() => router.push('/schedule')}
                                className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity"
                            >
                                查看课表
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
