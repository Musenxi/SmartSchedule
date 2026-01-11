'use client';

import { useEffect, useState } from 'react';

import { TaskType, TaskInput, Task } from '@/types/task';
import { X, Calendar as CalendarIcon, Download } from 'lucide-react';
import { parseISO, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CustomCalendar } from '@/components/ui/CustomCalendar';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: TaskInput) => Promise<void>;
    courseId?: string; // 可选的预设课程ID
    initialData?: Task; // 编辑模式下的初始数据
    onImport?: () => void;
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, courseId, initialData, onImport }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<TaskType>('HOMEWORK');
    const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth] = useState(new Date()); // Keep for compatibility if needed or removed
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [showInSchedule, setShowInSchedule] = useState(true);
    const [location, setLocation] = useState('');

    // Range Mode State (Controls whether to show start time + location)
    const [isTimeRangeMode, setIsTimeRangeMode] = useState(false);

    // 不同类型的时间字段不同
    // 作业: 只需截止时间
    // 考试/活动: 需要开始时间和结束时间
    const [startTime, setStartTimeRaw] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00'); // 用于考试结束时间 或者 作业截止时间 (复用)

    const [showValidationDialog, setShowValidationDialog] = useState(false);

    // 自动设置结束时间为开始时间后1小时
    const setStartTime = (time: string) => {
        setStartTimeRaw(time);
        // 计算1小时后的时间
        const [h, m] = time.split(':').map(Number);
        const newHour = h + 1;
        if (newHour >= 24) {
            setEndTime('23:59'); // 如果超过24点，设为23:59
        } else {
            setEndTime(`${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    };

    const [loading, setLoading] = useState(false);

    // 初始化/重置表单
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // 编辑模式：填充数据
                setTitle(initialData.title);
                setDescription(initialData.description || '');
                setType(initialData.type);

                // 处理时间
                if (initialData.startTime) {
                    // 如果有开始时间，启用时间段模式
                    setIsTimeRangeMode(true);
                    const start = typeof initialData.startTime === 'string'
                        ? parseISO(initialData.startTime)
                        : initialData.startTime;
                    setDate(format(start, 'yyyy-MM-dd'));
                    setStartTime(format(start, 'HH:mm'));
                } else if (initialData.dueDate) {
                    // 只有截止时间
                    setIsTimeRangeMode(false);
                    const due = typeof initialData.dueDate === 'string'
                        ? parseISO(initialData.dueDate)
                        : initialData.dueDate;
                    setDate(format(due, 'yyyy-MM-dd'));
                }

                if (initialData.dueDate) {
                    const due = typeof initialData.dueDate === 'string'
                        ? parseISO(initialData.dueDate)
                        : initialData.dueDate;
                    setEndTime(format(due, 'HH:mm'));
                }

                setLocation(initialData.location || '');
                setShowInSchedule(initialData.showInSchedule ?? true);
            } else {
                // 新建模式：重置为默认
                setTitle('');
                setDescription('');
                setType('HOMEWORK');
                setDate(format(new Date(), 'yyyy-MM-dd'));
                setStartTime('08:00');
                setEndTime('10:00');
                setLocation('');
                // Homework default
                setShowInSchedule(false);
                setIsTimeRangeMode(false);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            // Use isTimeRangeMode to decide submission logic
            const hasRange = isTimeRangeMode;

            let start: Date | undefined;
            let due: Date;

            if (hasRange) {
                // 验证结束时间必须晚于开始时间
                if (endTime <= startTime) {
                    setShowValidationDialog(true);
                    setLoading(false);
                    return;
                }
                // 有开始和结束时间
                start = new Date(`${date}T${startTime}`);
                due = new Date(`${date}T${endTime}`);
            } else {
                // 只有截止时间 (使用 endTime 作为时间)
                due = new Date(`${date}T${endTime}`);
            }

            await onSubmit({
                title,
                description,
                type,
                startTime: start?.toISOString(), // 仅开启时间段模式才有 startTime
                dueDate: due.toISOString(),
                courseId: initialData ? (initialData.courseId || undefined) : courseId, // 保持原有的 courseId 或使用传入的
                location: hasRange ? location : undefined,
                showInSchedule: showInSchedule, // Always submit showInSchedule
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isRangeType = type === 'EXAM' || type === 'EVENT';
    const isEdit = !!initialData;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={onClose}
            >
                <div
                    className="bg-card w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">{isEdit ? '编辑' : '新建'}{isRangeType ? (type === 'EXAM' ? '考试' : '活动') : '任务'}</h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">类型</label>
                            <div className="flex gap-2">
                                {(['HOMEWORK', 'EXAM', 'EVENT', 'CUSTOM'] as TaskType[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => {
                                            setType(t);
                                            // Auto-set default mode and showInSchedule based on type
                                            if (t === 'EXAM' || t === 'EVENT') {
                                                setIsTimeRangeMode(true);
                                                setShowInSchedule(true);
                                            } else {
                                                setIsTimeRangeMode(false);
                                                setShowInSchedule(false);
                                            }
                                        }}
                                        className={`flex-1 py-2 text-sm rounded-lg border transition-all ${type === t
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-foreground border-input hover:border-primary/50'
                                            }`}
                                    >
                                        {t === 'HOMEWORK' ? '作业' : t === 'EXAM' ? '考试' : t === 'EVENT' ? '活动' : '其他'}
                                    </button>
                                ))}
                            </div>
                            {type === 'EXAM' && onImport && (
                                <div className="mt-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onImport();
                                        }}
                                        className="text-xs text-primary hover:underline flex items-center justify-end gap-1 w-full"
                                    >
                                        <Download className="w-3 h-3" />
                                        想要批量导入？
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">标题</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground"
                                placeholder={type === 'EXAM' ? "输入考试科目..." : "输入任务标题..."}
                                autoFocus
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className={isTimeRangeMode ? "col-span-1 sm:col-span-2" : "col-span-1"}>
                                <label className="block text-sm font-medium text-foreground mb-1">日期</label>
                                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className={cn(
                                                "w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground text-left flex items-center gap-2",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                            {date ? format(new Date(date), 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent z-[100]" align="start" side="bottom" sideOffset={8}>
                                        <CustomCalendar
                                            selectedDate={date ? new Date(date) : undefined}
                                            onSelect={(d) => {
                                                setDate(format(d, 'yyyy-MM-dd'));
                                                setIsPopoverOpen(false);
                                            }}
                                            className="bg-card border border-border shadow-lg rounded-xl"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* 时间输入逻辑 */}
                            {isTimeRangeMode ? (
                                <>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="block text-sm font-medium text-foreground mb-1">地点 (可选)</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground"
                                            placeholder="例如: 第二教学楼 302"
                                        />
                                    </div>
                                    <CustomTimePicker
                                        label="开始时间"
                                        value={startTime}
                                        onChange={setStartTime}
                                    />
                                    <CustomTimePicker
                                        label="结束时间"
                                        value={endTime}
                                        onChange={setEndTime}
                                    />
                                </>
                            ) : (
                                <CustomTimePicker
                                    label="截止时间"
                                    value={endTime}
                                    onChange={setEndTime}
                                />
                            )}

                            <div className="col-span-1 sm:col-span-2 flex items-center gap-2 mt-1">
                                <div className="relative flex items-center justify-center w-5 h-5">
                                    <input
                                        type="checkbox"
                                        id="showInSchedule"
                                        checked={showInSchedule}
                                        onChange={(e) => setShowInSchedule(e.target.checked)}
                                        className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-full checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                    />
                                    <svg
                                        className="absolute w-3 h-3 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <label htmlFor="showInSchedule" className="text-sm text-foreground select-none cursor-pointer">
                                    显示在课表中
                                </label>
                            </div>

                            {!isRangeType && (
                                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 mt-1">
                                    <div className="relative flex items-center justify-center w-5 h-5">
                                        <input
                                            type="checkbox"
                                            id="enableTimeRange"
                                            checked={isTimeRangeMode}
                                            onChange={(e) => setIsTimeRangeMode(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-full checked:bg-primary checked:border-primary transition-all cursor-pointer"
                                        />
                                        <svg
                                            className="absolute w-3 h-3 text-primary-foreground pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <label htmlFor="enableTimeRange" className="text-sm text-foreground select-none cursor-pointer">
                                        作为卡片显示
                                    </label>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">描述 (可选)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground resize-none h-20"
                                placeholder="添加详细描述（地点、范围等）..."
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? '处理中...' : (isEdit ? '保存修改' : '创建任务')}
                            </button>
                        </div>
                    </form>
                </div >
            </div>
            <ConfirmDialog
                open={showValidationDialog}
                onOpenChange={setShowValidationDialog}
                title="时间设置错误"
                description="结束时间必须晚于开始时间，请重新设置。"
                variant="destructive"
                confirmText="知道了"
                showCancel={false}
                onConfirm={() => setShowValidationDialog(false)}
            />
        </>
    );
}
