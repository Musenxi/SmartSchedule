'use client';

import { cn } from '@/lib/utils';
import { formatWeekdayShort, isToday } from '@/lib/date-utils';

interface WeekHeaderProps {
    dates: Date[];
    visibleDays: number[];
}

export function WeekHeader({ dates, visibleDays }: WeekHeaderProps) {
    return (
        <div className="flex border-b border-border bg-muted/50">
            {/* 空白角落 - 与TimeGrid对齐 */}
            <div className="w-[50px] h-14 border-r border-border/50" />

            {/* 星期表头 */}
            {visibleDays.map((dayOfWeek, index) => {
                const date = dates[dayOfWeek - 1];
                const today = date ? isToday(date) : false;

                return (
                    <div
                        key={dayOfWeek}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center h-14 border-r border-border/30",
                            today && "bg-primary/10"
                        )}
                    >
                        <span className={cn(
                            "text-sm font-medium",
                            today ? "text-primary" : "text-muted-foreground"
                        )}>
                            {formatWeekdayShort(dayOfWeek)}
                        </span>
                        {date && (
                            <span className={cn(
                                "text-lg font-semibold",
                                today ? "text-primary" : "text-foreground"
                            )}>
                                {date.getDate()}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
