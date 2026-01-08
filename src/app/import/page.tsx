'use client';

import { useState } from 'react';
import { PDFUploader } from '@/components/upload/PDFUploader';
import { CourseVerifier } from '@/components/upload/CourseVerifier';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
}

type Step = 'upload' | 'verify' | 'success';

export default function ImportPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('upload');
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

    const handleReset = () => {
        setStep('upload');
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
                    <span className={step === 'upload' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        1. 上传文件
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className={step === 'verify' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        2. 确认课程
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className={step === 'success' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        3. 完成
                    </span>
                </div>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                    {step === 'upload' && (
                        <>
                            <div className="mb-8 text-center max-w-lg mx-auto">
                                <h2 className="text-lg font-semibold mb-2">上传 PDF 文件</h2>
                                <p className="text-muted-foreground text-sm">
                                    系统将尝试自动识别课程信息。识别后您可以手动调整。
                                </p>
                            </div>
                            <PDFUploader onUploadComplete={handleUploadComplete} />

                            {result && result.courses?.length === 0 && (
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
