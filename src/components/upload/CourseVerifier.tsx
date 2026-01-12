'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Check, X, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardPaste } from 'lucide-react';
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
    credits?: number;
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
    const [showPasteModal, setShowPasteModal] = useState(false);
    const [pasteText, setPasteText] = useState('');

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

            // Ensure credits is a number
            const credits = typeof data.credits === 'number' ? data.credits : parseFloat(data.credits) || 0;

            if (editingIndex === -1) {
                // Create new course
                const newCourse: RecognizedCourse = {
                    name: data.name,
                    teacher: data.teacher,
                    credits: credits,
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
                    credits: credits,
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

    const handlePaste = () => {
        setPasteText('');
        setShowPasteModal(true);
    };

    const handleConfirmPaste = () => {
        try {
            const text = pasteText.trim();
            if (!text) return;

            // Try to extract data block
            let data = null;
            if (text.includes('===SmartSchedule===') && text.includes('---DATA---')) {
                const parts = text.split('---DATA---');
                if (parts.length > 1) {
                    const base64Part = parts[1].split('===END===')[0].trim();
                    try {
                        const jsonStr = decodeURIComponent(escape(atob(base64Part)));
                        data = JSON.parse(jsonStr);
                    } catch (e) {
                        console.error('Base64 decode failed', e);
                    }
                }
            } else {
                // Try parsing raw JSON (fallback)
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Not JSON
                }
            }

            if (!data) {
                toast.error('无法识别的内容，请确保复制了完整的分享文本');
                return;
            }

            // Process data
            let newCoursesToAdd: RecognizedCourse[] = [];

            // Check version/type
            if (data.type === 'course' || data.type === 'smart-schedule-course') {
                const c = data.data;
                newCoursesToAdd.push({
                    name: c.name,
                    teacher: c.teacher || undefined,
                    location: undefined,
                    credits: c.credits,
                    times: Array.isArray(c.times) ? c.times.map((t: any) => ({
                        dayOfWeek: t.dayOfWeek,
                        startPeriod: t.startPeriod,
                        endPeriod: t.endPeriod,
                        weekRange: t.weekRange,
                        location: t.location,
                        teacher: t.teacher,
                        specificDate: t.specificDate
                    })) : [],
                    confidence: 1.0
                });
            } else if (data.type === 'schedule' || data.type === 'smart-schedule-full') {
                if (Array.isArray(data.data.courses)) {
                    newCoursesToAdd = data.data.courses.map((c: any) => ({
                        name: c.name,
                        teacher: c.teacher || undefined,
                        credits: c.credits,
                        times: Array.isArray(c.times) ? c.times.map((t: any) => ({
                            dayOfWeek: t.dayOfWeek,
                            startPeriod: t.startPeriod,
                            endPeriod: t.endPeriod,
                            weekRange: t.weekRange,
                            location: t.location,
                            teacher: t.teacher,
                            specificDate: t.specificDate
                        })) : [],
                        confidence: 1.0
                    }));
                }
            } else {
                toast.error('未知的数据格式');
                return;
            }

            if (newCoursesToAdd.length > 0) {
                setCourses(prev => [...prev, ...newCoursesToAdd]);
                toast.success(`已成功识别并添加 ${newCoursesToAdd.length} 门课程`);
                setShowPasteModal(false);
            } else {
                toast.info('未找到有效的课程数据');
            }

        } catch (error) {
            console.error('Paste failed', error);
            toast.error('解析失败，请检查文本格式');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                    共识别到 {courses.length} 门课程
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePaste}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                        title="从剪贴板粘贴课程或课表分享文本"
                    >
                        <ClipboardPaste className="w-4 h-4" />
                        粘贴分享文本
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        <Plus className="w-4 h-4" />
                        手动添加
                    </button>
                </div>
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
                                    {course.credits !== undefined && course.credits > 0 && (
                                        <span className="text-sm text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{course.credits} 学分</span>
                                    )}
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
                            credits: displayCourses[editingIndex].credits || 0,
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

            {/* Paste Text Modal */}
            <Modal
                isOpen={showPasteModal}
                onClose={() => setShowPasteModal(false)}
                zIndex={70}
                className="w-full max-w-md bg-card p-0 flex flex-col"
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ClipboardPaste className="w-5 h-5 text-primary" />
                        粘贴分享文本
                    </h3>
                    <button
                        onClick={() => setShowPasteModal(false)}
                        className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <textarea
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder="在此处粘贴以 ===SmartSchedule=== 开头的分享文本..."
                        className="w-full h-40 p-3 rounded-xl border border-input bg-background resize-none focus:ring-2 focus:ring-primary/20 outline-none text-sm font-mono"
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        支持识别课程详情分享文本和完整课表备份文本
                    </p>
                </div>
                <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/10">
                    <button
                        onClick={() => setShowPasteModal(false)}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirmPaste}
                        disabled={!pasteText.trim()}
                        className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50"
                    >
                        识别并添加
                    </button>
                </div>
            </Modal>

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
