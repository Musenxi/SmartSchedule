'use client';

import { ChevronLeft, ChevronRight, CalendarDays, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { useRef } from 'react';

interface ScheduleToolbarProps {
    currentWeek: number;
    realCurrentWeek: number;
    totalWeeks: number;
    scheduleName: string;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    onGoToWeek: (week: number) => void;
    onDateSelect: (date: Date) => void;
}

export function ScheduleToolbar({
    currentWeek,
    realCurrentWeek,
    totalWeeks,
    scheduleName,
    onPrevWeek,
    onNextWeek,
    onGoToWeek,
    onDateSelect,
}: ScheduleToolbarProps) {
    const isFirstWeek = currentWeek <= 1;
    const isLastWeek = currentWeek >= totalWeeks;
    const isCurrentRealWeek = currentWeek === realCurrentWeek;
    const dateInputRef = useRef<HTMLInputElement>(null);

    // 今天的真实日期
    const today = new Date();

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            {/* 左侧：日期和周次 */}
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {formatDate(today, 'yyyy/M/d')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        第{currentWeek}周 · {scheduleName}
                    </p>
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

                {isCurrentRealWeek ? (
                    <div className="relative">
                        <button
                            onClick={() => dateInputRef.current?.showPicker()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border text-foreground"
                        >
                            <CalendarDays className="w-4 h-4" />
                            本周
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none w-0 h-0"
                            onChange={(e) => {
                                if (e.target.value) {
                                    onDateSelect(new Date(e.target.value));
                                    // 清空值以便下次选择同一日期也能触发
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => onGoToWeek(realCurrentWeek)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border text-foreground"
                    >
                        <Undo2 className="w-4 h-4" />
                        回到本周
                    </button>
                )}

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

            {/* 右侧：周次指示 */}
            <div className="text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                {currentWeek} / {totalWeeks} 周
            </div>
        </div>
    );
}
