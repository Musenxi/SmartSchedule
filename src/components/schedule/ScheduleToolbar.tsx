'use client';

import { ChevronLeft, ChevronRight, CalendarDays, Undo2, Calendar, Hash, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { useRef, useState, useEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Schedule {
    id: string;
    name: string;
    isActive: boolean;
}

interface ScheduleToolbarProps {
    currentWeek: number;
    realCurrentWeek: number;
    totalWeeks: number;
    scheduleName: string;
    schedules?: Schedule[];
    currentScheduleId?: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onGoToWeek: (week: number) => void;
    onDateSelect: (date: Date) => void;
    onScheduleChange?: (scheduleId: string) => void;
    onEditSchedule?: (scheduleId: string) => void;
}

export function ScheduleToolbar({
    currentWeek,
    realCurrentWeek,
    totalWeeks,
    scheduleName,
    schedules,
    currentScheduleId,
    onPrevWeek,
    onNextWeek,
    onGoToWeek,
    onDateSelect,
    onScheduleChange,
    onEditSchedule,
}: ScheduleToolbarProps) {
    const isFirstWeek = currentWeek <= 1;
    const isLastWeek = currentWeek >= totalWeeks;
    const isCurrentRealWeek = currentWeek === realCurrentWeek;
    const [showPicker, setShowPicker] = useState(false);
    const [showScheduleList, setShowScheduleList] = useState(false);
    const [pickerMode, setPickerMode] = useState<'week' | 'date'>('week');
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const pickerRef = useRef<HTMLDivElement>(null);
    const scheduleListRef = useRef<HTMLDivElement>(null);

    // 今天的真实日期
    const today = new Date();

    // 点击外部关闭选择器
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
            if (scheduleListRef.current && !scheduleListRef.current.contains(e.target as Node)) {
                setShowScheduleList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 生成日历天数
    const generateCalendarDays = () => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
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

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-background">
            {/* 左侧：日期和周次 */}
            <div className="flex items-center gap-4">
                <div>
                    <button
                        onClick={() => onGoToWeek(realCurrentWeek)}
                        className="hover:opacity-70 transition-opacity"
                        title="点击返回今日"
                    >
                        <h2 className="text-lg font-semibold text-foreground text-left">
                            {formatDate(today, 'yyyy/M/d')}
                        </h2>
                    </button>
                    <div className="relative flex items-center gap-2" ref={scheduleListRef}>
                        <button
                            onClick={() => setShowScheduleList(!showScheduleList)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                            {scheduleName}
                            {schedules && schedules.length > 1 && (
                                <ChevronDown className={cn(
                                    "w-3 h-3 transition-transform",
                                    showScheduleList && "rotate-180"
                                )} />
                            )}
                        </button>

                        {/* 添加课表按钮 - 只有一个课表时显示 */}
                        {showScheduleList && schedules && schedules.length === 1 && (
                            <a
                                href="/import"
                                className="flex items-center justify-center w-4 h-4 text-primary hover:text-primary/80 transition-colors animate-in fade-in slide-in-from-left-1 duration-300"
                                title="添加课表"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v8m4-4H8" />
                                </svg>
                            </a>
                        )}

                        {/* 课程表列表下拉菜单 - 多个课表时显示 */}
                        {showScheduleList && schedules && schedules.length > 1 && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                {schedules.map((s) => (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "w-full flex items-center justify-between group",
                                            s.id === currentScheduleId ? "bg-primary/10" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <button
                                            onClick={() => {
                                                onScheduleChange?.(s.id);
                                                setShowScheduleList(false);
                                            }}
                                            className="flex-1 p-3 text-left text-sm flex items-center gap-2"
                                        >
                                            <span className="truncate max-w-[120px]">{s.name}</span>
                                            {s.id === currentScheduleId && (
                                                <Check className="w-3.5 h-3.5 text-primary" />
                                            )}
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditSchedule?.(s.id);
                                                setShowScheduleList(false);
                                            }}
                                            className="p-3 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                            title="编辑课表"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <a
                                    href="/import"
                                    className="w-full p-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-t border-border text-primary"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    添加新课表
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 中间：周次切换 */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onPrevWeek}
                    disabled={isFirstWeek}
                    className={cn(
                        "p-2 rounded-lg transition-colors border border-transparent",
                        isFirstWeek
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "hover:bg-muted text-foreground hover:border-border"
                    )}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative" ref={pickerRef}>
                    <button
                        onClick={() => setShowPicker(!showPicker)}
                        className={cn(
                            "flex items-center justify-center gap-1 w-[96px] py-1.5 text-sm font-medium rounded-lg transition-colors border border-transparent",
                            "hover:bg-muted hover:border-border text-foreground",
                            !isCurrentRealWeek && "text-primary"
                        )}
                    >
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span className="flex items-center">
                            第
                            <span className="w-[1.2rem] text-center inline-block">{currentWeek}</span>
                            周
                        </span>
                    </button>

                    {/* 选择器下拉菜单 */}
                    {showPicker && (
                        <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[280px] animate-in fade-in zoom-in-95 duration-150">
                            {/* 模式切换标签 */}
                            <div className="flex mb-3 bg-muted/50 rounded-lg p-1">
                                <button
                                    onClick={() => setPickerMode('week')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                                        pickerMode === 'week'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Hash className="w-3.5 h-3.5" />
                                    按周选择
                                </button>
                                <button
                                    onClick={() => setPickerMode('date')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                                        pickerMode === 'date'
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    按日期选择
                                </button>
                            </div>

                            {/* 周选择模式 */}
                            {pickerMode === 'week' && (
                                <>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                                            <button
                                                key={week}
                                                onClick={() => {
                                                    onGoToWeek(week);
                                                    setShowPicker(false);
                                                }}
                                                className={cn(
                                                    "w-full aspect-square rounded-lg text-sm font-medium transition-all",
                                                    week === currentWeek
                                                        ? "bg-primary text-primary-foreground shadow-sm"
                                                        : week === realCurrentWeek
                                                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                                                            : "hover:bg-muted text-foreground"
                                                )}
                                            >
                                                {week}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border">
                                        <button
                                            onClick={() => {
                                                onGoToWeek(realCurrentWeek);
                                                setShowPicker(false);
                                            }}
                                            className="w-full py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                                        >
                                            回到本周 (第{realCurrentWeek}周)
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* 日期选择模式 */}
                            {pickerMode === 'date' && (
                                <>
                                    {/* 月份导航 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <button
                                            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                                            className="p-1 hover:bg-muted rounded-md transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm font-medium">
                                            {format(selectedMonth, 'yyyy年M月', { locale: zhCN })}
                                        </span>
                                        <button
                                            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                                            className="p-1 hover:bg-muted rounded-md transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* 星期标题 */}
                                    <div className="grid grid-cols-7 gap-1 mb-1">
                                        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                                            <div key={day} className="text-center text-xs text-muted-foreground py-1">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 日期网格 */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {calendarDays.map((day, index) => {
                                            const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                                            const isToday = day.toDateString() === today.toDateString();

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        onDateSelect(day);
                                                        setShowPicker(false);
                                                    }}
                                                    className={cn(
                                                        "w-full aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center",
                                                        !isCurrentMonth && "text-muted-foreground/40",
                                                        isCurrentMonth && "text-foreground hover:bg-muted",
                                                        isToday && "bg-primary text-primary-foreground hover:bg-primary/90"
                                                    )}
                                                >
                                                    {day.getDate()}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-border">
                                        <button
                                            onClick={() => {
                                                onDateSelect(today);
                                                setShowPicker(false);
                                            }}
                                            className="w-full py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                                        >
                                            跳转到今天
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={onNextWeek}
                    disabled={isLastWeek}
                    className={cn(
                        "p-2 rounded-lg transition-colors border border-transparent",
                        isLastWeek
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "hover:bg-muted text-foreground hover:border-border"
                    )}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div >
    );
}
