'use client';

import { useMemo } from 'react';
import { TimeGrid } from './TimeGrid';
import { WeekHeader } from './WeekHeader';
import { CourseCard } from './CourseCard';
import { getWeekDates, isWeekInRange } from '@/lib/date-utils';
import { Course, Period } from '@/types';
import { cn } from '@/lib/utils';

interface WeekViewProps {
    courses: Course[];
    periods: Period[];
    currentWeek: number;
    firstWeekStart: Date;
    // 设置
    showGridLines: boolean;
    showPeriodTime: boolean;
    showSaturday: boolean;
    showSunday: boolean;
    showNonCurrentWeek: boolean;
    periodHeight: number;
    courseCornerRadius: number;
    onCourseClick?: (course: Course) => void;
}

export function WeekView({
    courses,
    periods,
    currentWeek,
    firstWeekStart,
    showGridLines,
    showPeriodTime,
    showSaturday,
    showSunday,
    showNonCurrentWeek,
    periodHeight,
    courseCornerRadius,
    onCourseClick,
}: WeekViewProps) {
    // 计算当前周的日期
    const weekDates = useMemo(() =>
        getWeekDates(firstWeekStart, currentWeek),
        [firstWeekStart, currentWeek]
    );

    // 可见的星期列
    const visibleDays = useMemo(() => {
        const days = [1, 2, 3, 4, 5]; // 周一到周五
        if (showSaturday) days.push(6);
        if (showSunday) days.push(7);
        return days;
    }, [showSaturday, showSunday]);

    // 按星期分组的课程
    const coursesByDay = useMemo(() => {
        const result: Record<number, Array<{ course: Course; time: Course['times'][0] }>> = {};

        for (const day of visibleDays) {
            result[day] = [];
        }

        for (const course of courses) {
            for (const time of course.times) {
                // 检查是否在可见的星期内
                if (!visibleDays.includes(time.dayOfWeek)) continue;

                // 检查是否显示非本周课程
                const isInCurrentWeek = isWeekInRange(currentWeek, time.weekRange);
                if (!showNonCurrentWeek && !isInCurrentWeek) continue;

                result[time.dayOfWeek].push({ course, time });
            }
        }

        return result;
    }, [courses, visibleDays, currentWeek, showNonCurrentWeek]);

    const gridHeight = periods.length * periodHeight;

    return (
        <div className="flex flex-col h-full bg-background">
            {/* 周表头 */}
            <WeekHeader dates={weekDates} visibleDays={visibleDays} />

            {/* 课表网格 */}
            <div className="flex-1 overflow-auto">
                <div className="flex min-h-full">
                    {/* 时间列 */}
                    <TimeGrid
                        periods={periods}
                        periodHeight={periodHeight}
                        showPeriodTime={showPeriodTime}
                    />

                    {/* 每天的列 */}
                    <div className="flex flex-1">
                        {visibleDays.map((day) => (
                            <div
                                key={day}
                                className="flex-1 relative border-r border-border/30"
                                style={{ minHeight: gridHeight }}
                            >
                                {/* 网格线 */}
                                {showGridLines && periods.map((period) => (
                                    <div
                                        key={period.number}
                                        className="absolute left-0 right-0 border-b border-border/20"
                                        style={{ top: period.number * periodHeight }}
                                    />
                                ))}

                                {/* 课程卡片 */}
                                {coursesByDay[day]?.map(({ course, time }) => (
                                    <CourseCard
                                        key={`${course.id}-${time.id}`}
                                        course={course}
                                        time={time}
                                        periodHeight={periodHeight}
                                        currentWeek={currentWeek}
                                        cornerRadius={courseCornerRadius}
                                        onClick={() => onCourseClick?.(course)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
