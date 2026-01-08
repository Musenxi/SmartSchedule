'use client';

import { cn } from '@/lib/utils';
import { formatWeekdayShort, isToday } from '@/lib/date-utils';

interface WeekHeaderProps {
    dates: Date[];
    visibleDays: number[];
}

export function WeekHeader({ dates, visibleDays }: WeekHeaderProps) {
    return (
        <div className="flex">
            {/* 左上角月份显示 */}
            <div className="w-[32px] h-14 flex flex-col items-center justify-center gap-0.5">
                <span className="text-xs font-medium text-muted-foreground leading-none">
                    {dates[0]?.getMonth() + 1}
                </span>
                <span className="text-xs font-medium text-muted-foreground leading-none">
                    月
                </span>
            </div>

            {/* 星期表头 */}
            {visibleDays.map((dayOfWeek, index) => {
                const date = dates[dayOfWeek - 1];
                const today = date ? isToday(date) : false;

                return (
                    <div
                        key={dayOfWeek}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center h-14",
                            today && "bg-primary/10 rounded-lg"
                        )}
                    >
                        <span className={cn(
                            "text-xs font-medium",
                            today ? "text-primary" : "text-muted-foreground"
                        )}>
                            {formatWeekdayShort(dayOfWeek)}
                        </span>
                        {date && (
                            <span className={cn(
                                "text-sm font-semibold mt-0.5",
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
