'use client';

import { useState } from 'react';
import { PDFUploader } from '@/components/upload/PDFUploader';
import { CSVUploader } from '@/components/upload/CSVUploader';
import { BrowserGrabber } from '@/components/upload/BrowserGrabber';
import { CourseVerifier } from '@/components/upload/CourseVerifier';
import { ArrowLeft, CheckCircle2, FileText, FileSpreadsheet, Globe, PencilLine, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CourseTimeSlot {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    teacher?: string;
    location?: string;
}

interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    times: CourseTimeSlot[];
}

// Helper to group flat courses by name
function groupCourses(flatCourses: any[]): RecognizedCourse[] {
    const groupedMap = new Map<string, RecognizedCourse>();

    flatCourses.forEach(c => {
        const name = c.name;
        if (!groupedMap.has(name)) {
            groupedMap.set(name, {
                name: name,
                teacher: c.teacher, // Use first occurrence's teacher as default
                location: c.location,
                times: []
            });
        }

        const course = groupedMap.get(name)!;
        course.times.push({
            dayOfWeek: c.dayOfWeek,
            startPeriod: c.startPeriod,
            endPeriod: c.endPeriod,
            weekRange: c.weekRange,
            teacher: c.teacher,
            location: c.location
        });
    });

    return Array.from(groupedMap.values());
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
        if (data.courses && data.courses.length > 0) {
            // Group flat courses into structured courses
            const grouped = groupCourses(data.courses);
            setResult({ ...data, courses: grouped });
            setStep('verify');
        } else {
            setResult(data);
        }
    };

    const handleConfirmCourses = async (courses: RecognizedCourse[], options?: {
        newScheduleName?: string;
        mode?: 'create' | 'add' | 'overwrite';
        periodsPerDay?: number;
        totalWeeks?: number;
        startDate?: string;
    }) => {
        setSaving(true);
        try {
            const res = await fetch('/api/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courses,
                    newScheduleName: options?.newScheduleName,
                    mode: options?.mode,
                    periodsPerDay: options?.periodsPerDay,
                    totalWeeks: options?.totalWeeks,
                    startDate: options?.startDate
                }),
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
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation Bar */}
            <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'select') router.back();
                            else handleReset();
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {step === 'select' ? '返回' : '取消'}
                    </button>
                    <div className="text-sm font-medium text-muted-foreground">
                        {step === 'select' && '选择导入方式'}
                        {step === 'upload' && '上传数据'}
                        {step === 'verify' && '确认信息'}
                        {step === 'success' && '完成'}
                    </div>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="w-full max-w-4xl space-y-12">

                    {/* Header Text - Clean and Direct */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            {step === 'select' && '如何导入您的课程表？'}
                            {step === 'upload' && (method === 'pdf' ? '上传 PDF 文件' : method === 'csv' ? '上传 CSV 文件' : '教务系统抓取')}
                            {step === 'verify' && '确认课程详情'}
                            {step === 'success' && '导入成功'}
                        </h1>
                        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                            {step === 'select' && '支持多种导入方式，请选择最适合您的一种。'}
                            {step === 'upload' && '请按照指引完成操作，系统将自动处理数据。'}
                            {step === 'verify' && '请仔细核对识别出的课程信息，确保准确无误。'}
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div>
                        {step === 'select' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* PDF Import */}
                                <button
                                    onClick={() => handleSelectMethod('pdf')}
                                    className="group relative flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 text-left"
                                >
                                    <div className="mt-1 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">PDF 自动识别</h3>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            上传教务系统导出的 PDF 文件。<br />系统会自动提取课程时间与地点。
                                        </p>
                                    </div>
                                </button>

                                {/* CSV Import */}
                                <button
                                    onClick={() => handleSelectMethod('csv')}
                                    className="group relative flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 text-left"
                                >
                                    <div className="mt-1 p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">CSV 表格导入</h3>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            使用 Excel 或 CSV 模版整理数据。<br />适合批量处理结构化课程信息。
                                        </p>
                                    </div>
                                </button>

                                {/* Browser Import */}
                                <button
                                    onClick={() => handleSelectMethod('browser')}
                                    className="group relative flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 text-left"
                                >
                                    <div className="mt-1 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">HTML 源码抓取</h3>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            粘贴教务系统网页源代码。<br />直接解析网页结构提取课表。
                                        </p>
                                    </div>
                                </button>

                                {/* Manual Import */}
                                <button
                                    onClick={() => handleSelectMethod('manual')}
                                    className="group relative flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 text-left"
                                >
                                    <div className="mt-1 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                                        <PencilLine className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">手动录入</h3>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            进入高级编辑器逐一添加。<br />完全掌控每一个课程细节。
                                        </p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {step === 'upload' && (
                            <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
                                {method === 'pdf' && <PDFUploader onUploadComplete={handleUploadComplete} />}
                                {method === 'csv' && <CSVUploader onUploadComplete={handleUploadComplete} />}
                                {method === 'browser' && <BrowserGrabber onUploadComplete={handleUploadComplete} />}

                                {result && result.courses?.length === 0 && method === 'pdf' && (
                                    <div className="mt-8 pt-6 border-t border-border space-y-4">
                                        <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-xs font-bold">!</div>
                                            <span className="text-sm font-medium">未能识别到有效课程</span>
                                        </div>
                                        <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-auto max-h-[150px] text-muted-foreground">
                                            {result.rawText}
                                        </div>
                                        <button
                                            onClick={() => setStep('verify')}
                                            className="text-sm text-primary hover:underline font-medium"
                                        >
                                            跳过识别，直接手动添加 &rarr;
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'verify' && result && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-300">
                                <CourseVerifier
                                    courses={result.courses || []}
                                    onConfirm={handleConfirmCourses}
                                    onCancel={handleReset}
                                />
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center py-16 space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold text-foreground">全部就绪</h2>
                                    <p className="text-muted-foreground">新课程已成功同步至您的课表。</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        onClick={() => router.push('/schedule')}
                                        className="inline-flex items-center justify-center px-8 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        返回课表
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
