'use client';

import { Course, Period, CourseTime } from '@/types';
import { X, Calendar, Clock, User, MapPin, Copy, FileText, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useCourses } from '@/hooks/use-courses';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CourseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    onEdit: () => void;
    periods?: Period[];
    currentWeek?: number;
    selectedTimeIndex?: number;
    onRefresh?: () => void;
    zIndex?: number;
    hasBackdrop?: boolean;
    fromList?: boolean; // When true, delete button directly deletes entire course
}

export function CourseDetailModal({ isOpen, onClose, course, onEdit, periods, currentWeek = 1, selectedTimeIndex = 0, onRefresh, zIndex = 50, hasBackdrop = true, fromList = false }: CourseDetailModalProps) {
    const { deleteCourse, updateCourse } = useCourses();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteOptions, setShowDeleteOptions] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    if (!isOpen) return null;

    const selectedTime = course.times[selectedTimeIndex] || course.times[0];
    const dayName = ['', '一', '二', '三', '四', '五', '六', '日'][selectedTime?.dayOfWeek || 1];

    // Helper: Parse week range string to array of week numbers
    const parseWeekRange = (rangeStr: string): number[] => {
        const weeks = new Set<number>();
        const parts = rangeStr.split(',').map(p => p.trim());
        parts.forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(Number);
                for (let i = start; i <= end; i++) weeks.add(i);
            } else if (part) {
                weeks.add(Number(part));
            }
        });
        return Array.from(weeks).sort((a, b) => a - b);
    };

    // Helper: Convert week array back to range string
    const weeksToRangeString = (weeks: number[]): string => {
        if (weeks.length === 0) return '';
        const sorted = [...weeks].sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sorted[0];
        let end = sorted[0];
        for (let i = 1; i <= sorted.length; i++) {
            if (sorted[i] === end + 1) {
                end = sorted[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                if (i < sorted.length) {
                    start = sorted[i];
                    end = sorted[i];
                }
            }
        }
        return ranges.join(',');
    };

    // Option 1: Delete only this week's occurrence
    const handleDeleteThisWeek = async () => {
        if (!selectedTime) return;
        setIsDeleting(true);
        try {
            const weeks = parseWeekRange(selectedTime.weekRange);
            const newWeeks = weeks.filter(w => w !== currentWeek);

            if (newWeeks.length === 0) {
                // If no weeks left, remove this time slot entirely
                const newTimes = course.times.filter((_, idx) => idx !== selectedTimeIndex);
                if (newTimes.length === 0) {
                    // If no time slots left, delete the course
                    await deleteCourse(course.id);
                } else {
                    await updateCourse({
                        id: course.id,
                        data: { times: newTimes }
                    });
                }
            } else {
                // Update the week range
                const newTimes = course.times.map((t, idx) =>
                    idx === selectedTimeIndex
                        ? { ...t, weekRange: weeksToRangeString(newWeeks) }
                        : t
                );
                await updateCourse({
                    id: course.id,
                    data: { times: newTimes }
                });
            }
            onRefresh?.();
            onClose();
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteOptions(false);
        }
    };

    // Option 2: Delete this time slot (all weeks, same day/teacher/location)
    const handleDeleteTimeSlot = async () => {
        if (!selectedTime) return;
        setIsDeleting(true);
        try {
            const newTimes = course.times.filter((_, idx) => idx !== selectedTimeIndex);
            if (newTimes.length === 0) {
                // If no time slots left, delete the course
                await deleteCourse(course.id);
            } else {
                await updateCourse({
                    id: course.id,
                    data: { times: newTimes }
                });
            }
            onRefresh?.();
            onClose();
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteOptions(false);
        }
    };

    // Option 3: Delete entire course
    const handleDeleteCourse = async () => {
        setIsDeleting(true);
        try {
            await deleteCourse(course.id);
            onRefresh?.();
            onClose();
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteOptions(false);
            setShowConfirmDelete(false); // Close the confirm dialog
        }
    };

    // Trigger confirmation dialog before delete
    const handleDeleteClick = () => {
        if (fromList) {
            // When from list, show confirmation first
            setShowConfirmDelete(true);
        } else {
            // When from schedule, show delete options
            setShowDeleteOptions(true);
        }
    };

    const handleCopyInfo = () => {
        // Create a fixed format that can be parsed for import
        // Format: [SmartSchedule Course Export]
        // Followed by base64-encoded JSON for machine parsing
        // Plus human-readable text for viewing

        const exportData = {
            version: 1,
            type: 'course',
            data: {
                name: course.name,
                color: course.color,
                credits: course.credits,
                note: course.note || '',
                times: course.times.map(t => ({
                    dayOfWeek: t.dayOfWeek,
                    startPeriod: t.startPeriod,
                    endPeriod: t.endPeriod,
                    weekRange: t.weekRange,
                    teacher: t.teacher || '',
                    location: t.location || '',
                    startTime: t.startTime || '',
                    endTime: t.endTime || ''
                }))
            }
        };

        const jsonStr = JSON.stringify(exportData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));

        // Human-readable summary
        const humanReadable = `[${course.name}]
学分：${course.credits || '未设置'}
${course.times.map(t => {
            const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];
            return `周${dayNames[t.dayOfWeek]} 第${t.startPeriod}-${t.endPeriod}节 (${t.weekRange}周)${t.teacher ? ` ${t.teacher}` : ''}${t.location ? ` @${t.location}` : ''}`;
        }).join('\n')}`;

        // Combined format with marker
        const exportText = `===SmartSchedule===
${humanReadable}
---DATA---
${base64Data}
===END===`;

        navigator.clipboard.writeText(exportText).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const getTimeRange = (start: number, end: number) => {
        if (!periods || periods.length === 0) return null;
        const startP = periods.find(p => p.number === start);
        const endP = periods.find(p => p.number === end);
        if (startP && endP) {
            return `${startP.startTime} - ${endP.endTime}`;
        }
        return null;
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                zIndex={zIndex}
                hasBackdrop={hasBackdrop}
                className="bg-card w-full max-w-sm max-h-[90vh] p-0 flex flex-col"
            >
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 pb-2">
                        <button
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="font-medium text-sm hover:opacity-80 transition-opacity"
                            style={{ color: 'hsl(var(--primary))' }}
                        >
                            {isDeleting ? '删除中...' : '删除'}
                        </button>
                        <div className="flex gap-4">
                            <button
                                onClick={onEdit}
                                className="font-medium text-sm hover:opacity-80 transition-opacity"
                                style={{ color: 'hsl(var(--primary))' }}
                            >
                                编辑
                            </button>
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="px-6 pb-6 pt-2">
                        <h2 className="text-2xl font-bold text-foreground mb-1">{course.name}</h2>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                            <span>{course.credits ? `${course.credits} 学分` : '暂无学分信息'}</span>
                        </div>
                    </div>

                    {/* Details List */}
                    <div className="px-4 space-y-4 pb-6 overflow-y-auto custom-scrollbar flex-1">
                        {course.times.map((time, index) => (
                            <div key={index} className="space-y-4">
                                {/* Weeks */}
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10" style={{ color: 'hsl(var(--primary))' }}>
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 py-1 border-b border-border/50">
                                        <div className="text-base text-foreground">第{time.weekRange}周</div>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10" style={{ color: 'hsl(var(--primary))' }}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 py-1 border-b border-border/50">
                                        <div className="text-base text-foreground">
                                            周{['', '一', '二', '三', '四', '五', '六', '日'][time.dayOfWeek]} 第{time.startPeriod}-{time.endPeriod}节
                                            {periods && (
                                                <span className="ml-2 font-medium text-muted-foreground">{getTimeRange(time.startPeriod, time.endPeriod)}</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                        </div>
                                    </div>
                                </div>

                                {/* Teacher */}
                                {time.teacher && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10" style={{ color: 'hsl(var(--primary))' }}>
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 py-1 border-b border-border/50">
                                            <div className="text-base text-foreground">{time.teacher}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {time.location && (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5 p-1.5 rounded-lg bg-primary/10" style={{ color: 'hsl(var(--primary))' }}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 py-1 border-b border-border/50">
                                            <div className="text-base text-foreground">{time.location}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {course.times.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
                                暂无时间安排
                            </div>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 space-y-3 bg-card mt-auto border-t border-border">
                        <button
                            onClick={handleCopyInfo}
                            disabled={copySuccess}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 p-3 rounded-xl transition-all duration-200",
                                copySuccess
                                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                    : "bg-primary/10 hover:bg-primary/20"
                            )}
                        >
                            {copySuccess ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm font-medium">已复制到剪贴板</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                                    <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>复制课程信息为文本</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Options Dialog */}
            {showDeleteOptions && (
                <div
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setShowDeleteOptions(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#F5F5F9] dark:bg-background w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200"
                    >
                        <div className="p-4 border-b border-border bg-white dark:bg-card rounded-t-2xl">
                            <h3 className="text-lg font-bold text-center text-foreground">选择删除范围</h3>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                周{dayName} 第{selectedTime?.startPeriod}-{selectedTime?.endPeriod}节
                            </p>
                        </div>

                        <div className="p-2 space-y-2">
                            <button
                                onClick={handleDeleteThisWeek}
                                disabled={isDeleting}
                                className="w-full p-3 text-left rounded-xl bg-white dark:bg-card hover:bg-primary/5 transition-colors disabled:opacity-50 shadow-sm border border-border/50"
                            >
                                <div className="font-medium text-foreground">仅删除本周</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    删除第 {currentWeek} 周的这节课
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteTimeSlot}
                                disabled={isDeleting}
                                className="w-full p-3 text-left rounded-xl bg-white dark:bg-card hover:bg-primary/5 transition-colors disabled:opacity-50 shadow-sm border border-border/50"
                            >
                                <div className="font-medium text-foreground">删除该时间段</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    删除周{dayName}同教师、同地点的所有周次
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteCourse}
                                disabled={isDeleting}
                                className="w-full p-3 text-left rounded-xl bg-white dark:bg-card hover:bg-destructive/10 transition-colors disabled:opacity-50 shadow-sm border border-border/50"
                            >
                                <div className="font-medium text-destructive">删除整门课程</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    删除《{course.name}》的全部时间段
                                </div>
                            </button>
                        </div>

                        <div className="p-2 border-t border-border bg-white dark:bg-card rounded-b-2xl">
                            <button
                                onClick={() => setShowDeleteOptions(false)}
                                className="w-full p-3 rounded-xl font-medium hover:bg-muted/50 transition-colors"
                                style={{ color: 'hsl(var(--primary))' }}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={showConfirmDelete}
                onOpenChange={setShowConfirmDelete}
                title="删除课程"
                description={`确定要删除整门课程《${course.name}》吗？\n\n这将删除该课程的所有时间段，此操作不可撤销。`}
                confirmText="删除"
                cancelText="取消"
                onConfirm={handleDeleteCourse}
                variant="destructive"
            />
        </>
    );
}
