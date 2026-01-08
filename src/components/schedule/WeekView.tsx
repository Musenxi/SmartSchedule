'use client';

import { useMemo, useRef } from 'react';
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

    const headerRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (headerRef.current) {
            headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* 顶部悬浮表头 - 独立容器，手动同步滚动 */}
            <div
                ref={headerRef}
                className="flex-none overflow-hidden bg-background z-20"
            >
                <div className="w-full">
                    <WeekHeader dates={weekDates} visibleDays={visibleDays} />
                </div>
            </div>

            {/* 课表网格 - 滚动容器 */}
            <div
                ref={bodyRef}
                className="flex-1 overflow-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                onScroll={handleScroll}
            >
                <div className="flex min-h-full w-full">
                    {/* 时间列 - 左侧悬浮 */}
                    <div className="sticky left-0 z-10 bg-background">
                        <TimeGrid
                            periods={periods}
                            periodHeight={periodHeight}
                            showPeriodTime={showPeriodTime}
                        />
                    </div>

                    {/* 每天的列 */}
                    <div className="flex flex-1">
                        {visibleDays.map((day) => (
                            <div
                                key={day}
                                className="flex-1 relative border-r border-dashed border-muted-foreground/20 min-w-0"
                                style={{ minHeight: gridHeight }}
                            >
                                {/* 网格线 */}
                                {showGridLines && periods.map((period) => (
                                    <div
                                        key={period.number}
                                        className="absolute left-0 right-0 border-b border-dashed border-muted-foreground/20"
                                        style={{ top: (period.number - 1) * periodHeight + periodHeight }}
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
