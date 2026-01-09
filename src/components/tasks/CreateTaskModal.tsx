'use client';

import { useEffect, useState, useRef } from 'react';
import { TaskType, TaskInput, Task } from '@/types/task';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { parseISO, format, addDays, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: TaskInput) => Promise<void>;
    courseId?: string; // 可选的预设课程ID
    initialData?: Task; // 编辑模式下的初始数据
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, courseId, initialData }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<TaskType>('HOMEWORK');
    const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [showInSchedule, setShowInSchedule] = useState(true);
    const [location, setLocation] = useState('');

    // 生成日历天数
    const generateCalendarDays = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDay = startOfWeek(firstDay, { weekStartsOn: 1 }); // 周一开始

        const days: Date[] = [];
        let current = startDay;
        while (days.length < 42) { // 6 weeks x 7 days
            days.push(new Date(current));
            current = addDays(current, 1);
        }
        return days;
    };

    const calendarDays = generateCalendarDays();

    // 不同类型的时间字段不同
    // 作业: 只需截止时间
    // 考试/活动: 需要开始时间和结束时间
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00'); // 用于考试结束时间 或者 作业截止时间 (复用)

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
                if (initialData.startTime && (initialData.type === 'EXAM' || initialData.type === 'EVENT')) {
                    const start = typeof initialData.startTime === 'string'
                        ? parseISO(initialData.startTime)
                        : initialData.startTime;
                    setDate(format(start, 'yyyy-MM-dd'));
                    setStartTime(format(start, 'HH:mm'));
                } else if (initialData.dueDate) {
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
                setShowInSchedule(true);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            const hasRange = type === 'EXAM' || type === 'EVENT';

            let start: Date | undefined;
            let due: Date;

            if (hasRange) {
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
                startTime: start?.toISOString(), // 仅 EXAM/EVENT 有 startTime
                dueDate: due.toISOString(),
                courseId: initialData ? (initialData.courseId || undefined) : courseId, // 保持原有的 courseId 或使用传入的
                location: hasRange ? location : undefined,
                showInSchedule: hasRange ? showInSchedule : undefined,
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
                                    onClick={() => setType(t)}
                                    className={`flex-1 py-2 text-sm rounded-lg border transition-all ${type === t
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-foreground border-input hover:border-primary/50'
                                        }`}
                                >
                                    {t === 'HOMEWORK' ? '作业' : t === 'EXAM' ? '考试' : t === 'EVENT' ? '活动' : '其他'}
                                </button>
                            ))}
                        </div>
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
                        <div className={isRangeType ? "col-span-1 sm:col-span-2" : ""}>
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
                                <PopoverContent className="w-auto p-2 z-[100]" align="center" sideOffset={8}>
                                    <div className="w-[230px]">
                                        {/* 月份导航 */}
                                        <div className="flex items-center justify-between mb-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                                                className="p-1 hover:bg-muted rounded-md transition-colors"
                                            >
                                                <ChevronLeft className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm font-medium">
                                                {format(selectedMonth, 'yyyy年M月', { locale: zhCN })}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                                                className="p-1 hover:bg-muted rounded-md transition-colors"
                                            >
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* 星期标题 */}
                                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                                            {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                                                <div key={day} className="text-center text-[10px] text-muted-foreground py-0.5">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* 日期网格 */}
                                        <div className="grid grid-cols-7 gap-0.5">
                                            {calendarDays.map((day, index) => {
                                                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                                                const isToday = day.toDateString() === new Date().toDateString();
                                                const isSelected = date === format(day, 'yyyy-MM-dd');

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => {
                                                            setDate(format(day, 'yyyy-MM-dd'));
                                                            setIsPopoverOpen(false);
                                                        }}
                                                        className={cn(
                                                            "w-full aspect-square rounded-md text-xs font-medium transition-all flex items-center justify-center",
                                                            !isCurrentMonth && "text-muted-foreground/40",
                                                            isCurrentMonth && "text-foreground hover:bg-muted",
                                                            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                                            !isSelected && isToday && "bg-secondary text-secondary-foreground"
                                                        )}
                                                    >
                                                        {day.getDate()}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-border">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const today = new Date();
                                                    setDate(format(today, 'yyyy-MM-dd'));
                                                    setSelectedMonth(today);
                                                    setIsPopoverOpen(false);
                                                }}
                                                className="w-full py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                                            >
                                                跳转到今天
                                            </button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* 时间输入逻辑 */}
                        {isRangeType ? (
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
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">开始时间</label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">结束时间</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground"
                                        required
                                    />
                                </div>

                                <div className="col-span-1 sm:col-span-2 flex items-center gap-2 mt-1">
                                    <input
                                        type="checkbox"
                                        id="showInSchedule"
                                        checked={showInSchedule}
                                        onChange={(e) => setShowInSchedule(e.target.checked)}
                                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="showInSchedule" className="text-sm text-foreground select-none cursor-pointer">
                                        显示在课表中
                                    </label>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">截止时间</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground"
                                    required
                                />
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
            </div>
        </div>
    );
}
