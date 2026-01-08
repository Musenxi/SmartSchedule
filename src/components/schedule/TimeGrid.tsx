'use client';

import { cn } from '@/lib/utils';
import { Period } from '@/types';

interface TimeGridProps {
    periods: Period[];
    periodHeight: number;
    showPeriodTime: boolean;
}

export function TimeGrid({ periods, periodHeight, showPeriodTime }: TimeGridProps) {
    return (
        <div className="flex flex-col">
            {/* 节次时间 */}
            {periods.map((period) => (
                <div
                    key={period.number}
                    className={cn(
                        "flex flex-col items-center justify-center border-b border-border/30",
                        "text-xs text-muted-foreground"
                    )}
                    style={{ height: periodHeight, minWidth: 32 }}
                >
                    <span className="font-medium text-foreground">{period.number}</span>
                    {showPeriodTime && (
                        <>
                            <span className="text-[10px] opacity-70">{period.startTime}</span>
                            <span className="text-[10px] opacity-70">{period.endTime}</span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
