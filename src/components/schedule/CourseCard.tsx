'use client';

import { useMemo } from 'react';
import { cn, isLightColor } from '@/lib/utils';
import { isWeekInRange } from '@/lib/date-utils';
import { Course, CourseTime } from '@/types';

interface CourseCardProps {
    course: Course;
    time: CourseTime;
    periodHeight: number;
    currentWeek: number;
    cornerRadius: number;
    onClick?: () => void;
}

export function CourseCard({
    course,
    time,
    periodHeight,
    currentWeek,
    cornerRadius,
    onClick
}: CourseCardProps) {
    const isCurrentWeek = isWeekInRange(currentWeek, time.weekRange);

    const style = useMemo(() => ({
        top: (time.startPeriod - 1) * periodHeight + 2,
        height: (time.endPeriod - time.startPeriod + 1) * periodHeight - 4,
        backgroundColor: isCurrentWeek ? course.color : `${course.color}40`,
        borderRadius: cornerRadius,
    }), [time, periodHeight, course.color, isCurrentWeek, cornerRadius]);

    const textColor = '#ffffff';

    return (
        <div
            className={cn(
                "absolute left-[1px] right-[1px] p-0.5 cursor-pointer",
                "flex flex-col items-center justify-center text-center",
                "hover:opacity-90 transition-all hover:shadow-md overflow-hidden",
                !isCurrentWeek && "opacity-50"
            )}
            style={style}
            onClick={onClick}
        >
            <div className="flex flex-col items-center justify-center w-full h-full px-[1px] md:px-1">
                {/* 课程名称 - 允许收缩，如果空间不足 */}
                <span
                    className="text-[11px] md:text-xs font-bold leading-tight line-clamp-6 break-all w-full min-h-0 flex-shrink overflow-hidden"
                    style={{ color: isCurrentWeek ? textColor : course.color }}
                >
                    {course.name}
                </span>

                {/* 地点 - 禁止收缩，保证优先显示 */}
                {time.location && (
                    <div className="flex flex-col items-center justify-center w-full mt-0.5 space-y-[1px] flex-shrink-0">
                        {time.location.split(' ').map((part, index) => (
                            <span
                                key={index}
                                className="text-[10px] leading-tight opacity-90 break-all w-full"
                                style={{ color: isCurrentWeek ? textColor : course.color }}
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
