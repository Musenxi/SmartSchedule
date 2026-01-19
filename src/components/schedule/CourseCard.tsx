'use client';

import { useMemo } from 'react';
import { cn, isLightColor } from '@/lib/utils';
import { isWeekInRange } from '@/lib/date-utils';
import { Course, CourseTime, Period } from '@/types';

interface CourseCardProps {
    course: Course;
    time: CourseTime;
    periodHeight: number;
    currentWeek: number;
    cornerRadius: number;
    onClick?: () => void;
    overlapCount?: number;
    periods?: Period[]; // Optional periods for custom time calculation
}

// Helper to convert time string "HH:mm" to minutes from midnight
const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export function CourseCard({
    course,
    time,
    periodHeight,
    currentWeek,
    cornerRadius,
    onClick,
    overlapCount,
    periods
}: CourseCardProps) {
    const isCurrentWeek = isWeekInRange(currentWeek, time.weekRange);

    const style = useMemo(() => {
        const isLight = isLightColor(course.color);
        const opacity = isCurrentWeek
            ? (isLight ? 'E6' : 'BF') // 本周：浅色系90%，深色系75%
            : '80'; // 非本周：50%

        let top: number;
        let height: number;

        // If custom time is set and periods are available, calculate position based on time
        if (time.startTime && time.endTime && periods && periods.length > 0) {
            // Get the time range of all periods
            const sortedPeriods = [...periods].sort((a, b) => a.number - b.number);
            const firstPeriodStart = timeToMinutes(sortedPeriods[0].startTime);
            const lastPeriodEnd = timeToMinutes(sortedPeriods[sortedPeriods.length - 1].endTime);
            const totalMinutes = lastPeriodEnd - firstPeriodStart;
            const totalHeight = periods.length * periodHeight;

            // Calculate position based on custom time
            const customStart = timeToMinutes(time.startTime);
            const customEnd = timeToMinutes(time.endTime);

            // Convert time to pixel position
            const startOffset = ((customStart - firstPeriodStart) / totalMinutes) * totalHeight;
            const endOffset = ((customEnd - firstPeriodStart) / totalMinutes) * totalHeight;

            top = Math.max(0, startOffset) + 2;
            height = Math.max(endOffset - startOffset, periodHeight * 0.5) - 4;
        } else {
            // Default: use period-based positioning
            top = (time.startPeriod - 1) * periodHeight + 2;
            height = (time.endPeriod - time.startPeriod + 1) * periodHeight - 4;
        }

        return {
            top,
            height,
            backgroundColor: `${course.color}${opacity}`,
            borderRadius: cornerRadius,
            zIndex: isCurrentWeek ? 5 : 1,
        };
    }, [time, periodHeight, course.color, isCurrentWeek, cornerRadius, periods]);

    return (
        <div
            data-course-card
            className={cn(
                "absolute left-[1px] right-[1px] p-0.5 cursor-pointer",
                "flex flex-col items-center justify-center text-center",
                "shadow-sm ring-1 ring-inset ring-black/5",
                "hover:opacity-95 transition-all hover:shadow-lg hover:-translate-y-[1px] overflow-hidden",
                !isCurrentWeek && "grayscale-[0.2]"
            )}
            style={style}
            onClick={onClick}
        >
            {/* Overlap Badge */}
            {(overlapCount || 0) > 1 && (
                <div className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm z-10">
                    {overlapCount}
                </div>
            )}

            <div className="flex flex-col items-center justify-center w-full h-full px-[1px] md:px-1">
                {/* 考试标签 */}
                {time.teacher === '考试' && (
                    <span className={cn(
                        "text-[11px] md:text-xs font-bold text-white mb-0.5",
                        isCurrentWeek ? "opacity-90" : "opacity-50"
                    )}>
                        考试
                    </span>
                )}

                {/* 课程名称 - 允许收缩，如果空间不足 */}
                <span
                    className={cn(
                        "text-[11px] md:text-xs font-bold leading-tight line-clamp-3 break-all w-full min-h-0 flex-shrink overflow-hidden text-white",
                        !isCurrentWeek && "opacity-60"
                    )}
                >
                    {course.name}
                </span>

                {/* 地点 - 禁止收缩，保证优先显示 */}
                {time.location && (
                    <div className="flex flex-col items-center justify-center w-full mt-0.5 space-y-[1px] flex-shrink-0">
                        {time.location.split(' ').map((part, index) => (
                            <span
                                key={index}
                                className={cn(
                                    "text-[10px] leading-tight break-all w-full text-white",
                                    isCurrentWeek ? "opacity-90" : "opacity-60"
                                )}
                            >
                                {index === 0 ? '@' : ''}{part}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
