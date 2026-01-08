'use client';

import { Course, Period } from '@/types';
import { X, Calendar, Clock, User, MapPin, Copy, FileText, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useCourses } from '@/hooks/use-courses';

interface CourseDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    onEdit: () => void;
    periods?: Period[];
}

export function CourseDetailModal({ isOpen, onClose, course, onEdit, periods }: CourseDetailModalProps) {
    const { deleteCourse } = useCourses();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (confirm('确定要删除该课程吗？')) {
            setIsDeleting(true);
            try {
                await deleteCourse(course.id);
                onClose();
            } catch (error) {
                console.error('Delete failed', error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleCopyInfo = () => {
        const info = `课程：${course.name}
学分：${course.credits || 'N/A'}
${course.times.map(t => {
            const timeRange = getTimeRange(t.startPeriod, t.endPeriod);
            const timeStr = timeRange ? ` ${timeRange}` : '';
            return `时间：周${['日', '一', '二', '三', '四', '五', '六'][t.dayOfWeek]} ${t.startPeriod}-${t.endPeriod}节${timeStr} (${t.weekRange}周)
老师：${t.teacher || '无'}
地点：${t.location || '无'}`;
        }).join('\n')}`;
        navigator.clipboard.writeText(info);
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
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
            >
                {/* Top Bar */}
                <div className="flex items-center justify-between p-4 pb-2">
                    <button
                        onClick={handleDelete}
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
                <div className="px-4 space-y-4 pb-6">
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
                                        周{['日', '一', '二', '三', '四', '五', '六'][time.dayOfWeek]} 第{time.startPeriod}-{time.endPeriod}节
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
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                        <FileText className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
                        <span className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>复制课程信息为文本</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
