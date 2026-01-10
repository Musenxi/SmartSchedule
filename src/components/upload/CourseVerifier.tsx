'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Check, X, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseForm } from '../schedule/CourseForm';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CustomCalendar } from '@/components/ui/CustomCalendar';

// Basic info common to a course
export interface CourseTimeSlot {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    location?: string;
    teacher?: string;
    specificDate?: string; // YYYY-MM-DD
}

export interface RecognizedCourse {
    name: string;
    teacher?: string;
    // Optional because some courses might have per-slot teachers/locations
    location?: string;
    times: CourseTimeSlot[];
    originalText?: string;
    confidence?: number;
}

interface CourseVerifierProps {
    courses: RecognizedCourse[];
    onConfirm: (courses: RecognizedCourse[]) => void;
    onCancel: () => void;
    scheduleConfig?: {
        totalWeeks?: number;
        startDate?: string;
    };
}

const DAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

import { useMemo } from 'react';

// Helper function matching TimeSlotEditor's getWeekNumber logic exactly
function getWeekNumber(startDate: string, dateStr: string): number {
    const start = new Date(startDate);
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = d.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
}

export function CourseVerifier({ courses: initialCourses, onConfirm, onCancel, scheduleConfig }: CourseVerifierProps) {
    const [courses, setCourses] = useState<RecognizedCourse[]>(initialCourses);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<RecognizedCourse | null>(null);

    // Dynamically compute week numbers from specificDate at render time
    const displayCourses = useMemo(() => {
        if (!scheduleConfig?.startDate) return courses;

        return courses.map(course => ({
            ...course,
            times: course.times.map(time => {
                if (time.specificDate) {
                    // Calculate week number using same logic as TimeSlotEditor
                    const weekNum = getWeekNumber(scheduleConfig.startDate!, time.specificDate);
                    return {
                        ...time,
                        weekRange: weekNum.toString()
                    };
                }
                return time;
            })
        }));
    }, [courses, scheduleConfig?.startDate]);

    useEffect(() => {
        if (editingIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [editingIndex]);

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...courses[index] });
    };

    const handleSaveEdit = (data: any) => {
        if (editingIndex !== null) {
            const mappedTimes = data.times.map((t: any) => ({
                dayOfWeek: t.dayOfWeek,
                startPeriod: t.startPeriod,
                endPeriod: t.endPeriod,
                weekRange: t.weekRange,
                location: t.location,
                teacher: t.teacher,
                specificDate: t.specificDate
            }));

            if (editingIndex === -1) {
                // Create new course
                const newCourse: RecognizedCourse = {
                    name: data.name,
                    teacher: data.teacher,
                    times: mappedTimes,
                    confidence: 1.0 // Manual created, full confidence
                };
                setCourses([...courses, newCourse]);
            } else {
                // Update existing course
                const newCourses = [...courses];
                newCourses[editingIndex] = {
                    ...courses[editingIndex],
                    name: data.name,
                    teacher: data.teacher,
                    times: mappedTimes
                };
                setCourses(newCourses);
            }
            setEditingIndex(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    const handleDelete = (index: number) => {
        setCourses(courses.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(null);
            setEditForm(null);
        }
    };

    const handleAddNew = () => {
        // Instead of adding to array immediately, set special index -1
        setEditingIndex(-1);
    };

    const handleConfirm = () => {
        onConfirm(displayCourses);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                    共识别到 {courses.length} 门课程
                </h3>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <Plus className="w-4 h-4" />
                    手动添加
                </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {displayCourses.map((course, index) => (
                    <div
                        key={index}
                        className={cn(
                            "p-4 rounded-xl border transition-all border-border bg-card hover:bg-muted/30"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground text-lg">{course.name}</span>
                                    {course.teacher && <span className="text-sm text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{course.teacher}</span>}
                                    {course.confidence !== undefined && course.confidence < 0.8 && (
                                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">需确认</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {course.times?.map((time, tIndex) => (
                                        <div key={tIndex} className="text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md flex items-center gap-2 border border-border/50">
                                            <span className="font-medium text-foreground">{DAY_LABELS[time.dayOfWeek]}</span>
                                            <span>{time.startPeriod}-{time.endPeriod}节</span>
                                            <span className={cn("font-medium", time.specificDate ? "text-blue-600 dark:text-blue-400" : "text-primary/80")}>
                                                {time.specificDate ? time.specificDate : time.weekRange}
                                            </span>
                                            {time.location && <span className="text-muted-foreground">@{time.location}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-1 pl-4">
                                <button
                                    onClick={() => handleEdit(index)}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="编辑"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    title="删除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal Overlay */}
            {editingIndex !== null && (
                <Modal
                    isOpen={true}
                    onClose={handleCancelEdit}
                    zIndex={60}
                >
                    <CourseForm
                        initialData={editingIndex === -1 ? {
                            name: '',
                            times: [],
                            color: '#3B82F6',
                            credits: 0,
                            note: ''
                        } : {
                            name: displayCourses[editingIndex].name,
                            teacher: displayCourses[editingIndex].teacher,
                            times: displayCourses[editingIndex].times.map(t => ({ ...t, id: crypto.randomUUID(), courseId: '' })),
                            color: '#3B82F6',
                            credits: 0,
                            note: ''
                        }}
                        onSubmit={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        totalWeeks={scheduleConfig?.totalWeeks}
                        startDate={scheduleConfig?.startDate}
                        submitLabel={editingIndex === -1 ? '创建' : '保存'}
                    />
                </Modal>
            )}

            {courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>没有识别到课程，请手动添加</p>
                </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
                >
                    返回
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={courses.length === 0}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    确认并保存
                </button>
            </div>
        </div>
    );
}
