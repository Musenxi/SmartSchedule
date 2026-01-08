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
                "absolute left-1 right-1 p-2 cursor-pointer",
                "flex flex-col overflow-hidden",
                "hover:opacity-90 transition-all hover:shadow-md",
                !isCurrentWeek && "opacity-50"
            )}
            style={style}
            onClick={onClick}
        >
            <span
                className="text-xs font-medium leading-tight line-clamp-2"
                style={{ color: isCurrentWeek ? textColor : course.color }}
            >
                {course.name}
            </span>
            {time.location && (
                <span
                    className="text-[10px] mt-1 opacity-80 line-clamp-2"
                    style={{ color: isCurrentWeek ? textColor : course.color }}
                >
                    @{time.location}
                </span>
            )}
            {time.teacher && (
                <span
                    className="text-[10px] opacity-70 line-clamp-1"
                    style={{ color: isCurrentWeek ? textColor : course.color }}
                >
                    {time.teacher}
                </span>
            )}
        </div>
    );
}
