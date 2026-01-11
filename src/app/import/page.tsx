'use client';

import { useState, useEffect, Suspense } from 'react';
import { AISmartUploader } from '@/components/upload/AISmartUploader';
import { CSVUploader } from '@/components/upload/CSVUploader';
import { BrowserGrabber } from '@/components/upload/BrowserGrabber';
import { CourseVerifier, RecognizedCourse } from '@/components/upload/CourseVerifier';
import { AISettingsModal } from '@/components/settings/AISettingsModal';
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Globe, PencilLine, Sparkles, Plus, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CustomCalendar } from '@/components/ui/CustomCalendar';

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
                credits: c.credits, // Pass credits from first occurrence
                times: []
            });
        }

        const course = groupedMap.get(name)!;
        // If this occurrence has credits and the grouped course doesn't, use it
        if (c.credits !== undefined && course.credits === undefined) {
            course.credits = c.credits;
        }
        course.times.push({
            dayOfWeek: c.dayOfWeek,
            startPeriod: c.startPeriod,
            endPeriod: c.endPeriod,
            weekRange: c.weekRange,
            teacher: c.teacher,
            location: c.location,
            specificDate: c.specificDate
        });
    });

    return Array.from(groupedMap.values());
}

type Step = 'target' | 'config' | 'select' | 'upload' | 'verify' | 'success';
type ImportMethod = 'pdf' | 'csv' | 'browser' | 'manual';
type ImportTarget = 'create' | 'add' | 'overwrite';

function ImportPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState<Step>('target');
    const [method, setMethod] = useState<ImportMethod | null>(null);
    const [result, setResult] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [showAISettings, setShowAISettings] = useState(false);

    // Schedule Config State
    const [importTarget, setImportTarget] = useState<ImportTarget>(() => {
        const target = searchParams.get('target');
        return (target === 'add' || target === 'overwrite') ? target : 'create';
    });
    const [newScheduleName, setNewScheduleName] = useState('');
    const [periodsPerDay, setPeriodsPerDay] = useState(12);
    const [totalWeeks, setTotalWeeks] = useState(20);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        // Default to this week's Monday
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Active schedule data (for add/overwrite modes)
    const [activeScheduleData, setActiveScheduleData] = useState<{
        firstWeekStart: string;
        totalWeeks: number;
    } | null>(null);

    // Fetch AI config on mount
    useEffect(() => {
        fetch('/api/ai/config')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.enabled && data.hasApiKey) {
                    setAiEnabled(true);
                }
            })
            .catch(() => setAiEnabled(false));
    }, []);

    // Fetch active schedule for add/overwrite modes
    useEffect(() => {
        if (importTarget !== 'create') {
            fetch('/api/schedules')
                .then(res => res.ok ? res.json() : null)
                .then((schedules: any[]) => {
                    if (schedules && schedules.length > 0) {
                        // Find target schedule: active one, or specific one if passed in params
                        const scheduleId = searchParams.get('scheduleId');
                        let targetSchedule = schedules.find(s => s.isActive) || schedules[0];

                        // If specific schedule ID is passed, try to find it
                        if (scheduleId) {
                            const specific = schedules.find(s => s.id === scheduleId);
                            if (specific) targetSchedule = specific;
                        }

                        if (targetSchedule) {
                            setActiveScheduleData({
                                firstWeekStart: targetSchedule.firstWeekStart,
                                totalWeeks: targetSchedule.totalWeeks || 20
                            });
                        }
                    }
                })
                .catch(() => setActiveScheduleData(null));
        }
    }, [importTarget, searchParams]);

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

    const handleConfirmCourses = async (courses: RecognizedCourse[]) => {
        setSaving(true);
        try {
            const res = await fetch('/api/upload/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courses,
                    newScheduleName: importTarget === 'create' ? newScheduleName : undefined,
                    mode: importTarget,
                    periodsPerDay: importTarget === 'create' ? periodsPerDay : undefined,
                    totalWeeks: importTarget === 'create' ? totalWeeks : undefined,
                    startDate: importTarget === 'create' ? startDate : undefined
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
        // For AI/PDF method, check if AI is enabled first
        if (m === 'pdf' && !aiEnabled) {
            setShowAISettings(true);
            return;
        }
        setMethod(m);
        if (m === 'manual') {
            setResult({ courses: [] });
            setStep('verify');
        } else {
            setStep('upload');
        }
    };

    const handleReset = () => {
        setStep('target'); // Reset to beginning
        setMethod(null);
        setResult(null);
        // Retain config for convenience? Or reset? Let's retain config but reset target if needed.
        // Actually full reset is safer.
        // setImportTarget('create');
    };

    const handleTargetNext = () => {
        if (importTarget === 'create') {
            setStep('config');
        } else {
            setStep('select');
        }
    };

    const handleConfigNext = () => {
        if (!newScheduleName.trim()) {
            alert('请输入课表名称');
            return;
        }
        setStep('select');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation Bar */}
            <div className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (step === 'target') router.back();
                            else if (step === 'config') setStep('target');
                            else if (step === 'select') {
                                if (importTarget === 'create') setStep('config');
                                else setStep('target');
                            }
                            else if (step === 'upload') setStep('select');
                            else if (step === 'verify') {
                                if (method === 'manual') setStep('select');
                                else setStep('upload'); // Or select? Upload makes sense to retry upload.
                            }
                            else handleReset();
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {step === 'target' ? '返回' : '上一步'}
                    </button>
                    <div className="text-sm font-medium text-muted-foreground">
                        {step === 'target' && '第一步：选择目标'}
                        {step === 'config' && '第二步：课表设置'}
                        {step === 'select' && '第三步：导入方式'}
                        {(step === 'upload' || step === 'verify') && '第四步：识别与确认'}
                        {step === 'success' && '完成'}
                    </div>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="w-full max-w-4xl space-y-12">

                    {/* Header Text */}
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            {step === 'target' && '您想如何导入课表？'}
                            {step === 'config' && '新建课表设置'}
                            {step === 'select' && '选择数据来源'}
                            {step === 'upload' && (method === 'pdf' ? '上传 PDF 文件' : method === 'csv' ? '上传 CSV 文件' : '教务系统抓取')}
                            {step === 'verify' && '确认课程详情'}
                            {step === 'success' && '导入成功'}
                        </h1>
                        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                            {step === 'target' && '您可以创建一张全新的课表，或者将课程添加到现有的课表中。'}
                            {step === 'config' && '请设置新课表的基本信息，以便正确计算周次和节次。'}
                            {step === 'select' && '我们支持多种导入方式，智能识别能帮您节省大量时间。'}
                            {step === 'upload' && '请按照指引完成操作，系统将自动处理数据。'}
                            {step === 'verify' && '请仔细核对识别出的课程信息，确保准确无误。'}
                        </p>
                    </div>

                    {/* Main Content Area */}
                    <div>
                        {step === 'target' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                                <button
                                    onClick={() => setImportTarget('create')}
                                    className={cn(
                                        "flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-4 hover:scale-[1.02]",
                                        importTarget === 'create'
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full",
                                        importTarget === 'create' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">创建新课表</h3>
                                        <p className="text-sm text-muted-foreground">新建一张空白课表并导入课程</p>
                                    </div>
                                    {importTarget === 'create' && <CheckCircle2 className="w-6 h-6 text-primary mt-2" />}
                                </button>

                                <button
                                    onClick={() => setImportTarget('add')}
                                    className={cn(
                                        "flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-4 hover:scale-[1.02]",
                                        importTarget === 'add'
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full",
                                        importTarget === 'add' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">添加到现有</h3>
                                        <p className="text-sm text-muted-foreground">将课程追加到当前活动课表</p>
                                    </div>
                                    {importTarget === 'add' && <CheckCircle2 className="w-6 h-6 text-primary mt-2" />}
                                </button>

                                <button
                                    onClick={() => setImportTarget('overwrite')}
                                    className={cn(
                                        "flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 text-center gap-4 hover:scale-[1.02]",
                                        importTarget === 'overwrite'
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "border-border bg-card hover:border-primary/50"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full",
                                        importTarget === 'overwrite' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">覆盖当前</h3>
                                        <p className="text-sm text-muted-foreground">清空当前课表并导入新课程</p>
                                    </div>
                                    {importTarget === 'overwrite' && <CheckCircle2 className="w-6 h-6 text-primary mt-2" />}
                                </button>

                                <div className="col-span-1 md:col-span-3 flex justify-center pt-6">
                                    <button
                                        onClick={handleTargetNext}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all hover:scale-105"
                                    >
                                        下一步
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'config' && (
                            <div className="max-w-xl mx-auto bg-card rounded-2xl border border-border p-8 shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-200">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">课表名称</label>
                                        <input
                                            type="text"
                                            value={newScheduleName}
                                            onChange={(e) => setNewScheduleName(e.target.value)}
                                            placeholder="例如：2025春季学期"
                                            className="w-full px-4 py-3 text-base border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">开学日期</label>
                                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "w-full px-4 py-3 text-base border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-left flex items-center justify-between transition-all",
                                                        !startDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                                        {startDate ? format(new Date(startDate), 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">第1周</span>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent z-[100]" align="start" side="bottom" sideOffset={8}>
                                                <CustomCalendar
                                                    selectedDate={startDate ? new Date(startDate) : undefined}
                                                    onSelect={(d) => {
                                                        setStartDate(format(d, 'yyyy-MM-dd'));
                                                        setIsPopoverOpen(false);
                                                    }}
                                                    className="bg-card border border-border shadow-xl rounded-xl"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <p className="text-xs text-muted-foreground px-1">设置为第一周的周一出现的日期</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">每天节数</label>
                                            <input
                                                type="number"
                                                min={4}
                                                max={20}
                                                value={periodsPerDay || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    setPeriodsPerDay(val);
                                                }}
                                                onBlur={() => setPeriodsPerDay(Math.min(20, Math.max(4, periodsPerDay || 12)))}
                                                className="w-full px-4 py-3 text-base border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">学期周数</label>
                                            <input
                                                type="number"
                                                min={10}
                                                max={30}
                                                value={totalWeeks || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    setTotalWeeks(val);
                                                }}
                                                onBlur={() => setTotalWeeks(Math.min(30, Math.max(10, totalWeeks || 20)))}
                                                className="w-full px-4 py-3 text-base border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfigNext}
                                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    下一步：选择导入方式
                                </button>
                            </div>
                        )}

                        {step === 'select' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* AI Smart Import */}
                                <button
                                    onClick={() => handleSelectMethod('pdf')}
                                    className="group relative flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 text-left"
                                >
                                    <div className="mt-1 p-2.5 rounded-lg border transition-colors bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-500/20">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                            AI 智能识别
                                            {!aiEnabled && <span className="ml-2 text-xs text-muted-foreground">(需配置)</span>}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-normal">
                                            上传 PDF 或图片文件。<br />AI 智能提取课程时间与地点。
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
                                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">表格导入</h3>
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
                                            粘贴教务系统网页源代码（正方系统）。<br />直接解析网页结构提取课表。
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
                                {method === 'pdf' && <AISmartUploader onUploadComplete={handleUploadComplete} />}
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
                                    onCancel={() => setStep('select')} // Or back to upload? Select seems safer.
                                    scheduleConfig={{
                                        totalWeeks: importTarget === 'create' ? totalWeeks : (activeScheduleData?.totalWeeks || 20),
                                        startDate: importTarget === 'create' ? startDate : activeScheduleData?.firstWeekStart
                                    }}
                                />
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center py-16 space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 mx-auto dark:bg-green-900/30 rounded-full flex items-center justify-center">
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
            {/* AI Settings Modal */}
            <AISettingsModal
                isOpen={showAISettings}
                onClose={() => setShowAISettings(false)}
                onSaved={() => {
                    setShowAISettings(false);
                    // Re-check AI status
                    fetch('/api/ai/config')
                        .then(res => res.ok ? res.json() : null)
                        .then(data => {
                            if (data?.enabled && data?.hasApiKey) {
                                setAiEnabled(true);
                            }
                        });
                }}
            />
        </div>
    );
}

export default function ImportPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ImportPageContent />
        </Suspense>
    );
}
