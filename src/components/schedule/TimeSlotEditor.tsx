'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CourseTimeInput } from '@/types';
import { ChevronRight, X, Circle, CheckCircle2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface TimeSlotEditorProps {
    isOpen: boolean;
    onClose: () => void;
    value: CourseTimeInput;
    onChange: (value: CourseTimeInput) => void;
    totalWeeks?: number;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function TimeSlotEditor({ isOpen, onClose, value, onChange, totalWeeks = 20 }: TimeSlotEditorProps) {
    const [localValue, setLocalValue] = useState<CourseTimeInput>(value);

    // Generate weeks grid based on totalWeeks
    const WEEKS_GRID = Array.from({ length: totalWeeks }, (_, i) => i + 1);

    // Parse week range to active weeks array
    const [activeWeeks, setActiveWeeks] = useState<number[]>([]);

    const startPeriodRef = useRef<HTMLDivElement>(null);
    const endPeriodRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalValue(value);
            // Parse initial week range
            const weeks = new Set<number>();
            const parts = value.weekRange.split(',').map(p => p.trim());
            parts.forEach(part => {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    for (let i = start; i <= end; i++) weeks.add(i);
                } else if (part) {
                    weeks.add(Number(part));
                }
            });
            setActiveWeeks(Array.from(weeks).sort((a, b) => a - b));
        }
    }, [isOpen, value]);

    useEffect(() => {
        if (isOpen) {
            // Wait for render/animation
            const timer = setTimeout(() => {
                // Scroll start period (item height 32, padding 48 for center)
                if (startPeriodRef.current) {
                    const p = localValue.startPeriod;
                    const scrollTop = 32 * (p - 1);
                    startPeriodRef.current.scrollTo({ top: scrollTop, behavior: 'instant' });
                }
                // Scroll end period
                if (endPeriodRef.current) {
                    const p = localValue.endPeriod;
                    const scrollTop = 32 * (p - 1);
                    endPeriodRef.current.scrollTo({ top: scrollTop, behavior: 'instant' });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]); // Only run on open for initial positioning

    const handleSave = () => {
        // Convert activeWeeks back to string
        const sorted = [...activeWeeks].sort((a, b) => a - b);
        let rangeStr = '';
        if (sorted.length > 0) {
            let start = sorted[0];
            let end = sorted[0];
            const ranges = [];
            for (let i = 1; i <= sorted.length; i++) {
                if (sorted[i] === end + 1) {
                    end = sorted[i];
                } else {
                    ranges.push(start === end ? `${start}` : `${start}-${end}`);
                    if (i < sorted.length) {
                        start = sorted[i];
                        end = sorted[i];
                    }
                }
            }
            rangeStr = ranges.join(',');
        }

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            {/* Content */}
            <div
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-[#F5F5F9] dark:bg-background rounded-2xl shadow-xl border border-border animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col relative"
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
                            {WEEKDAYS.slice(1).concat(WEEKDAYS[0]).map((d, i) => { // Shift Sun to end for display if needed, but standard is usually Mon-Sun
                                const dayIndex = i + 1 > 6 ? 0 : i + 1; // 1-6, 0(Sun)
                                return (
                                    <button
                                        key={dayIndex}
                                        onClick={() => setLocalValue(prev => ({ ...prev, dayOfWeek: dayIndex }))}
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
                                <div className="text-muted-foreground">-</div>
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
            </div>
        </div>
    );
}
