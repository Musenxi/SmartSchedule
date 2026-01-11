'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { TimeGrid } from './TimeGrid';
import { WeekHeader } from './WeekHeader';
import { CourseCard } from './CourseCard';
import { getWeekDates, isWeekInRange, isCourseFinished } from '@/lib/date-utils';
import { Course, Period, CourseTime } from '@/types';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export interface DeadlineMarker {
    id: string;
    title: string;
    dayOfWeek: number;
    week: number;
    fraction: number; // 0 to 1, position within grid
    dueDate: Date;
    type: string;
}

interface Selection {
    day: number;
    startPeriod: number;
    endPeriod: number;
}

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
    onCourseClick?: (course: Course, time: CourseTime, overlapping?: Array<{ course: Course; time: CourseTime }>) => void;
    // 触摸滑动事件
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    // 截止时间线
    deadlines?: DeadlineMarker[];
    // 空白格点击添加
    onEmptyCellSelect?: (day: number, startPeriod: number, endPeriod: number) => void;
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
    deadlines = [],
    onEmptyCellSelect,
}: WeekViewProps) {
    // Selection state for empty cell click
    const [selection, setSelection] = useState<Selection | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPeriod = useRef<number | null>(null);
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
        const result: Record<number, Array<{ course: Course; time: CourseTime; overlapping: Array<{ course: Course; time: CourseTime }> }>> = {};

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

                result[time.dayOfWeek].push({ course, time, overlapping: [] });
            }
        }

        // Post-processing: Filter out non-current week courses if they overlap perfectly with current week courses
        if (showNonCurrentWeek) {
            for (const day of visibleDays) {
                const dayCourses = result[day];
                const newDayCourses: typeof dayCourses = [];

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

        // Calculate overlaps for badges
        for (const day of visibleDays) {
            const dayCourses = result[day];
            for (const item of dayCourses) {
                // Find all OTHER courses that overlap with this one
                const overlaps = dayCourses.filter(other => {
                    if (other === item) return false;
                    return Math.max(item.time.startPeriod, other.time.startPeriod) <= Math.min(item.time.endPeriod, other.time.endPeriod);
                });
                item.overlapping = overlaps;
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

    // Helper: calculate period from Y position relative to grid
    const getPeriodFromY = useCallback((clientY: number, gridElement: HTMLElement) => {
        const rect = gridElement.getBoundingClientRect();
        const y = clientY - rect.top;
        const period = Math.floor(y / periodHeight) + 1;
        return Math.max(1, Math.min(periods.length, period));
    }, [periodHeight, periods.length]);

    // Grid cell selection handlers
    const handleGridMouseDown = useCallback((e: React.MouseEvent, day: number, gridElement: HTMLElement) => {
        // Ignore if clicking on a course card
        if ((e.target as HTMLElement).closest('[data-course-card]')) return;

        // If clicking on the selection overlay, let its click handler handle it
        if ((e.target as HTMLElement).closest('[data-selection-overlay]')) {
            return;
        }

        const period = getPeriodFromY(e.clientY, gridElement);

        // If there's already a selection, clicking elsewhere clears it
        if (selection) {
            setSelection(null);
            return;
        }

        // Check if this period overlaps with any existing course on this day
        const dayCourses = coursesByDay[day] || [];
        const hasOverlap = dayCourses.some(({ time }) =>
            period >= time.startPeriod && period <= time.endPeriod
        );
        if (hasOverlap) return;

        setSelection({ day, startPeriod: period, endPeriod: period });
        setIsDragging(true);
        dragStartPeriod.current = period;
        e.preventDefault();
    }, [getPeriodFromY, selection, coursesByDay]);

    const handleGridMouseMove = useCallback((e: React.MouseEvent, day: number, gridElement: HTMLElement) => {
        if (!isDragging || !selection || selection.day !== day) return;

        const period = getPeriodFromY(e.clientY, gridElement);
        const start = Math.min(dragStartPeriod.current!, period);
        const end = Math.max(dragStartPeriod.current!, period);
        setSelection({ day, startPeriod: start, endPeriod: end });
    }, [isDragging, selection, getPeriodFromY]);

    const handleGridMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Clear selection when clicking outside
    const handleClearSelection = useCallback(() => {
        if (!isDragging) {
            setSelection(null);
        }
    }, [isDragging]);

    // Handle add button click
    const handleAddClick = useCallback(() => {
        if (selection && onEmptyCellSelect) {
            onEmptyCellSelect(selection.day, selection.startPeriod, selection.endPeriod);
            setSelection(null);
        }
    }, [selection, onEmptyCellSelect]);

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
                    <div className="flex flex-1" onMouseUp={handleGridMouseUp} onMouseLeave={handleGridMouseUp}>
                        {visibleDays.map((day) => (
                            <div
                                key={day}
                                className="flex-1 relative border-r border-dashed border-muted-foreground/20 min-w-0 cursor-pointer"
                                style={{ minHeight: gridHeight }}
                                onMouseDown={(e) => handleGridMouseDown(e, day, e.currentTarget)}
                                onMouseMove={(e) => handleGridMouseMove(e, day, e.currentTarget)}
                            >
                                {/* 网格线 */}
                                {showGridLines && periods.map((period) => (
                                    <div
                                        key={period.number}
                                        className="absolute left-0 right-0 border-b border-dashed border-muted-foreground/20"
                                        style={{ top: (period.number - 1) * periodHeight + periodHeight }}
                                    />
                                ))}

                                {/* 选中覆盖层 */}
                                {selection && selection.day === day && (
                                    <div
                                        data-selection-overlay
                                        className="absolute left-[2px] right-[2px] bg-primary/20 border-2 border-primary border-dashed rounded-lg z-10 cursor-pointer hover:bg-primary/30 transition-colors"
                                        style={{
                                            top: (selection.startPeriod - 1) * periodHeight + 2,
                                            height: (selection.endPeriod - selection.startPeriod + 1) * periodHeight - 4,
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddClick();
                                        }}
                                    />
                                )}

                                {/* 课程卡片 */}
                                {coursesByDay[day]?.map(({ course, time, overlapping }) => (
                                    <CourseCard
                                        key={`${course.id}-${time.id}`}
                                        course={course}
                                        time={time}
                                        periodHeight={periodHeight}
                                        currentWeek={currentWeek}
                                        cornerRadius={courseCornerRadius}
                                        onClick={() => onCourseClick?.(course, time, overlapping)}
                                        overlapCount={overlapping.length > 0 ? overlapping.length + 1 : 0}
                                    />
                                ))}

                                {/* 截止时间红线 */}
                                {deadlines
                                    .filter(d => d.dayOfWeek === day && d.week === currentWeek)
                                    .map(deadline => (
                                        <div
                                            key={`deadline-${deadline.id}`}
                                            className="absolute left-0 right-0 z-20 pointer-events-none"
                                            style={{ top: `${deadline.fraction * 100}%` }}
                                        >
                                            <div className="relative group">
                                                {/* 红线 */}
                                                <div className="h-0.5 bg-red-500 w-full shadow-sm" />
                                                {/* 标签 */}
                                                <div className="absolute left-1 -top-4 text-[10px] text-red-500 font-medium bg-background/80 px-1 rounded truncate max-w-[90%]">
                                                    {deadline.title}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
