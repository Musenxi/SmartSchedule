'use client';

import { useMemo, useRef } from 'react';
import { TimeGrid } from './TimeGrid';
import { WeekHeader } from './WeekHeader';
import { CourseCard } from './CourseCard';
import { getWeekDates, isWeekInRange, isCourseFinished } from '@/lib/date-utils';
import { Course, Period, CourseTime } from '@/types';
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
    onCourseClick?: (course: Course, time: CourseTime) => void;
    // 触摸滑动事件
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
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
    onSwipeLeft,
    onSwipeRight,
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

                // 检查是否在当前周
                const isInCurrentWeek = isWeekInRange(currentWeek, time.weekRange);

                // 如果不仅在本周，检查显示设置
                if (!isInCurrentWeek) {
                    // 如果不显示非本周课程，跳过
                    if (!showNonCurrentWeek) continue;

                    // 如果课程已经结课（在这周之前结束），跳过
                    if (isCourseFinished(currentWeek, time.weekRange)) continue;
                }

                result[time.dayOfWeek].push({ course, time });
            }
        }

        // Post-processing: Filter out non-current week courses if they overlap perfectly with current week courses
        if (showNonCurrentWeek) {
            for (const day of visibleDays) {
                const dayCourses = result[day];
                const newDayCourses: typeof dayCourses = [];

                // Group by time slots to find overlaps
                // Simple version: check for exact period match or overlap
                // Since grid logic is complex, we'll do a simpler distinct check:
                // If a non-current-week course occupies the SAME period as a current-week course, hide it.

                for (const item of dayCourses) {
                    const isCurrent = isWeekInRange(currentWeek, item.time.weekRange);

                    if (!isCurrent) {
                        // Check if there is ANY current week course that overlaps with this one
                        const hasOverlap = dayCourses.some(other => {
                            if (other === item) return false;
                            const otherIsCurrent = isWeekInRange(currentWeek, other.time.weekRange);
                            if (!otherIsCurrent) return false;

                            // Check period overlap
                            const overlap = Math.max(item.time.startPeriod, other.time.startPeriod) <= Math.min(item.time.endPeriod, other.time.endPeriod);
                            return overlap;
                        });

                        if (hasOverlap) continue; // Skip this non-current course because it overlaps with a current one
                    }

                    newDayCourses.push(item);
                }
                result[day] = newDayCourses;
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

    // 触摸事件处理
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current || !touchStartY.current) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX.current;
        const deltaY = touchEndY - touchStartY.current;

        // 重置触摸起点
        touchStartX.current = null;
        touchStartY.current = null;

        // 判定滑动：水平距离 > 50px 且 水平距离 > 垂直距离 (防止误触垂直滚动)
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                onSwipeRight?.(); // 向右滑 -> 上一周
            } else {
                onSwipeLeft?.(); // 向左滑 -> 下一周
            }
        }
    };

    return (
        <div
            className="flex flex-col h-full bg-background"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
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
                                        onClick={() => onCourseClick?.(course, time)}
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
