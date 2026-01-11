'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CourseTimeInput } from '@/types';
import { ChevronRight, X, Circle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { parseWeekRange, formatWeekRange } from '@/lib/date-utils';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CustomCalendar } from '@/components/ui/CustomCalendar';

interface TimeSlotEditorProps {
    isOpen: boolean;
    onClose: () => void;
    value: CourseTimeInput;
    onChange: (value: CourseTimeInput) => void;
    totalWeeks?: number;
    hasBackdrop?: boolean;
    startDate?: string;
    zIndex?: number;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function TimeSlotEditor({ isOpen, onClose, value, onChange, totalWeeks = 20, startDate, hasBackdrop = true, zIndex = 60 }: TimeSlotEditorProps) {
    const [localValue, setLocalValue] = useState<CourseTimeInput>(value);

    // Generate weeks grid based on totalWeeks
    const WEEKS_GRID = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    // Parse week range to active weeks array
    const [activeWeeks, setActiveWeeks] = useState<number[]>([]);

    const startPeriodRef = useRef<HTMLDivElement>(null);
    const endPeriodRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Migration: Ensure specificDates is populated from specificDate if needed
            const dates = value.specificDates || (value.specificDate ? [value.specificDate] : []);
            setLocalValue({
                ...value,
                specificDates: dates
            });
            // Use robust parser from date-utils
            const weeks = parseWeekRange(value.weekRange);
            setActiveWeeks(weeks);
        }
    }, [isOpen, value]);

    // Scroll helper: centers selected item in 128px viewport
    // Container: h-32 (128px), Item: h-8 (32px), Padding: py-12 (48px each)
    // Item center position = 48 (top padding) + (p-1)*32 + 16 (half item)
    // To center in 128px viewport, scrollTop = itemCenter - viewportCenter
    const scrollToCenter = (ref: React.RefObject<HTMLDivElement | null>, period: number) => {
        if (!ref.current) return;
        const itemHeight = 32;
        const paddingTop = 48;
        const viewportHeight = 128;
        // Item center in scroll content
        const itemCenter = paddingTop + (period - 1) * itemHeight + itemHeight / 2;
        // Scroll position to center item in viewport
        const scrollTop = itemCenter - viewportHeight / 2;
        ref.current.scrollTop = Math.max(0, scrollTop);
    };

    // Scroll start period when it changes
    useEffect(() => {
        if (isOpen) {
            // Longer delay to wait for modal animation
            const timer = setTimeout(() => {
                scrollToCenter(startPeriodRef, localValue.startPeriod);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localValue.startPeriod]);

    // Scroll end period when it changes
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                scrollToCenter(endPeriodRef, localValue.endPeriod);
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, localValue.endPeriod]);

    const handleSave = () => {
        // Convert activeWeeks back to string
        const rangeStr = formatWeekRange(activeWeeks);

        onChange({
            ...localValue,
            weekRange: rangeStr || '1-16' // Default fallback
        });
        onClose();
    };

    const toggleWeek = (week: number) => {
        setActiveWeeks(prev =>
            prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]
        );
    };

    const setWeeksBatch = (type: 'all' | 'odd' | 'even') => {
        const max = totalWeeks;

        if (type === 'all') {
            // Check if all weeks are currently selected
            if (activeWeeks.length === max) {
                // If already all selected, reset to default (just 1st week)
                setActiveWeeks([1]);
            } else {
                setActiveWeeks(Array.from({ length: max }, (_, i) => i + 1));
            }
        } else if (type === 'odd') {
            setActiveWeeks(Array.from({ length: max }, (_, i) => i + 1).filter(w => w % 2 !== 0));
        } else if (type === 'even') {
            setActiveWeeks(Array.from({ length: max }, (_, i) => i + 1).filter(w => w % 2 === 0));
        }
    };

    const isCustomTime = !!(localValue.startTime && localValue.endTime);

    const toggleCustomTime = (enabled: boolean) => {
        if (enabled) {
            setLocalValue(prev => ({ ...prev, startTime: '08:00', endTime: '09:35' }));
        } else {
            setLocalValue(prev => {
                const { startTime, endTime, ...rest } = prev;
                return rest;
            });
        }
    };

    const getWeekNumber = (dateStr: string) => {
        if (!startDate) return null;
        const start = new Date(startDate);
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        const diffTime = d.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 7) + 1;
    };

    const handleRemoveDate = (index: number) => {
        const dateToRemove = localValue.specificDates?.[index];
        const newDates = localValue.specificDates?.filter((_, i) => i !== index);

        setLocalValue(prev => ({
            ...prev,
            specificDates: newDates,
            specificDate: newDates?.[0]
        }));

        // If startDate is available, check if we should deselect the week
        if (startDate && dateToRemove) {
            const weekToRemove = getWeekNumber(dateToRemove);

            if (weekToRemove !== null) {
                // Check if any OTHER date is in this week
                const hasOtherDateInWeek = newDates?.some(d => getWeekNumber(d) === weekToRemove);

                if (!hasOtherDateInWeek) {
                    setActiveWeeks(prev => prev.filter(w => w !== weekToRemove));
                }
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={zIndex}
            hasBackdrop={hasBackdrop}
        >
            <div className="flex items-center justify-between p-4 border-b border-border bg-white dark:bg-card rounded-t-2xl shadow-sm shrink-0">
                <button onClick={onClose} className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>取消</button>
                <h3 className="text-base font-bold text-foreground">编辑时间段</h3>
                <button onClick={handleSave} className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>保存</button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-4 space-y-6">
                {/* Week Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">周数</label>
                        <span className="text-xs text-muted-foreground">已选 {activeWeeks.length} 周</span>
                    </div>

                    <div className="flex gap-2 text-sm bg-white dark:bg-card p-1 rounded-xl border border-border/50">
                        <button onClick={() => setWeeksBatch('all')} className="flex-1 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors text-xs font-medium">全周</button>
                        <button onClick={() => setWeeksBatch('odd')} className="flex-1 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors text-xs font-medium">单周</button>
                        <button onClick={() => setWeeksBatch('even')} className="flex-1 py-1.5 rounded-lg hover:bg-muted text-foreground transition-colors text-xs font-medium">双周</button>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {WEEKS_GRID.map(w => (
                            <button
                                key={w}
                                onClick={() => toggleWeek(w)}
                                className={cn(
                                    "h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center border",
                                    activeWeeks.includes(w)
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-white dark:bg-card text-foreground border-border/50 hover:border-primary/50 shadow-sm"
                                )}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Day Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">星期</label>
                    <div className="grid grid-cols-7 gap-1 bg-muted/30 p-1 rounded-xl">
                        {WEEKDAYS.slice(1).concat(WEEKDAYS[0]).map((d, i) => {
                            // i=0(Mon)->1, ..., i=5(Sat)->6, i=6(Sun)->7
                            const dayIndex = i + 1;

                            return (
                                <button
                                    key={dayIndex}
                                    onClick={() => {
                                        setLocalValue(prev => {
                                            const updates: any = { dayOfWeek: dayIndex };

                                            // If specificDate is set, shift it to match the new dayOfWeek
                                            if (prev.specificDate) {
                                                const current = new Date(prev.specificDate);
                                                if (!isNaN(current.getTime())) {
                                                    // Current day of week (1-7)
                                                    const currentDay = current.getDay() === 0 ? 7 : current.getDay();
                                                    const diff = dayIndex - currentDay;

                                                    if (diff !== 0) {
                                                        const newDate = new Date(current);
                                                        newDate.setDate(current.getDate() + diff);
                                                        updates.specificDate = format(newDate, 'yyyy-MM-dd');
                                                    }
                                                }
                                            }

                                            return { ...prev, ...updates };
                                        });
                                    }}
                                    className={cn(
                                        "h-9 rounded-lg text-xs font-medium transition-all",
                                        localValue.dayOfWeek === dayIndex
                                            ? "bg-white dark:bg-card shadow-sm text-foreground border border-border/50"
                                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-card/50"
                                    )}
                                >
                                    {d.replace('周', '')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Time Selection */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">时间</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">自定义时间</span>
                            <button
                                onClick={() => toggleCustomTime(!isCustomTime)}
                                className={cn(
                                    "w-10 h-6 rounded-full transition-colors relative",
                                    isCustomTime ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                                    isCustomTime ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    {isCustomTime ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">开始时间</label>
                                <input
                                    type="time"
                                    value={localValue.startTime || '08:00'}
                                    onChange={(e) => setLocalValue(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full p-2 rounded-xl bg-white dark:bg-card border border-border/50 shadow-sm text-center outline-none focus:border-primary transition-colors text-foreground"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted-foreground">结束时间</label>
                                <input
                                    type="time"
                                    value={localValue.endTime || '09:35'}
                                    onChange={(e) => setLocalValue(prev => ({ ...prev, endTime: e.target.value }))}
                                    className="w-full p-2 rounded-xl bg-white dark:bg-card border border-border/50 shadow-sm text-center outline-none focus:border-primary transition-colors text-foreground"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border/50">
                            <div className="flex-1 text-center">
                                <div className="text-xs text-muted-foreground mb-2">开始节次</div>
                                <div
                                    className="relative h-32 overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white dark:from-card to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-card to-transparent pointer-events-none z-10" />
                                    <div
                                        ref={startPeriodRef}
                                        className="overflow-y-auto h-full scrollbar-none py-12 snap-y snap-mandatory"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
                                            <div
                                                key={p}
                                                onClick={() => setLocalValue(prev => ({ ...prev, startPeriod: p, endPeriod: Math.max(p, prev.endPeriod) }))}
                                                className={cn(
                                                    "h-8 flex items-center justify-center text-sm font-medium snap-center cursor-pointer transition-colors",
                                                    localValue.startPeriod === p ? "text-primary text-base" : "text-muted-foreground"
                                                )}
                                            >
                                                第 {p} 节
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-2 opacity-0">分隔</div>
                                <div className="relative h-32 flex items-center justify-center text-muted-foreground">-</div>
                            </div>
                            <div className="flex-1 text-center">
                                <div className="text-xs text-muted-foreground mb-2">结束节次</div>
                                <div
                                    className="relative h-32 overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white dark:from-card to-transparent pointer-events-none z-10" />
                                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-card to-transparent pointer-events-none z-10" />
                                    <div
                                        ref={endPeriodRef}
                                        className="overflow-y-auto h-full scrollbar-none py-12 snap-y snap-mandatory"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
                                            <div
                                                key={p}
                                                onClick={() => setLocalValue(prev => ({ ...prev, endPeriod: p, startPeriod: Math.min(prev.startPeriod, p) }))}
                                                className={cn(
                                                    "h-8 flex items-center justify-center text-sm font-medium snap-center cursor-pointer transition-colors",
                                                    localValue.endPeriod === p ? "text-primary text-base" : "text-muted-foreground"
                                                )}
                                            >
                                                第 {p} 节
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-px bg-border" />

                {/* Specific Date */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">指定日期 (可选)</label>
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20 space-y-2">
                        <div className="text-xs text-amber-700 dark:text-amber-300">
                            设置具体日期后，课程将会在该日期显示。
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className={cn(
                                        "w-full p-2.5 rounded-lg bg-white dark:bg-card border border-border/50 shadow-sm outline-none focus:border-primary transition-colors text-sm text-left flex items-center justify-between",
                                        !localValue.specificDate && "text-muted-foreground"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                        {localValue.specificDate ? format(new Date(localValue.specificDate), 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                                    </span>
                                    {localValue.specificDate && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Calculate week to remove
                                                const weekToRemove = getWeekNumber(localValue.specificDate!);

                                                setLocalValue(prev => ({
                                                    ...prev,
                                                    specificDate: undefined,
                                                    specificDates: []
                                                }));

                                                // Deselect week
                                                if (weekToRemove !== null) {
                                                    setActiveWeeks(prev => prev.filter(w => w !== weekToRemove));
                                                }
                                            }}
                                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent z-[100]" align="start" side="bottom" sideOffset={8}>
                                <CustomCalendar
                                    selectedDate={localValue.specificDate ? new Date(localValue.specificDate) : undefined}
                                    onSelect={(d) => {
                                        const dateStr = format(d, 'yyyy-MM-dd');
                                        const oldDate = localValue.specificDate;

                                        setLocalValue(prev => ({
                                            ...prev,
                                            specificDate: dateStr,
                                            specificDates: [dateStr]
                                        }));

                                        // Auto calculate day of week
                                        const date = new Date(dateStr);
                                        if (!isNaN(date.getTime())) {
                                            const day = date.getDay();
                                            setLocalValue(prev => ({
                                                ...prev,
                                                dayOfWeek: day === 0 ? 7 : day // Convert Sunday(0) to 7
                                            }));
                                        }

                                        // Update Weeks using helper
                                        if (startDate) {
                                            const newWeekNum = getWeekNumber(dateStr);
                                            const oldWeekNum = oldDate ? getWeekNumber(oldDate) : null;

                                            if (newWeekNum !== null && newWeekNum >= 1 && newWeekNum <= totalWeeks) {
                                                // STRICT REQUIREMENT: If specific date is set, ONLY that week is selected.
                                                setActiveWeeks([newWeekNum]);
                                            }
                                        }
                                    }}
                                    className="bg-card border border-border shadow-xl rounded-xl"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Teacher & Location */}
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">老师</label>
                        <input
                            type="text"
                            value={localValue.teacher || ''}
                            onChange={(e) => setLocalValue(prev => ({ ...prev, teacher: e.target.value }))}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-card border border-border/50 shadow-sm outline-none focus:border-primary transition-colors text-sm"
                            placeholder="输入教师姓名"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">地点</label>
                        <input
                            type="text"
                            value={localValue.location || ''}
                            onChange={(e) => setLocalValue(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-card border border-border/50 shadow-sm outline-none focus:border-primary transition-colors text-sm"
                            placeholder="输入上课地点"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
