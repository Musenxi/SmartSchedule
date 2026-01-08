'use client';

import { useState, useEffect } from 'react';
import { Course, CourseTime } from '@/types';
import { X, Plus, Trash2, Copy, ChevronRight } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { cn } from '@/lib/utils';

interface EditCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    totalWeeks?: number;
    onSave?: () => void;
}

const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
];

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

import { TimeSlotEditor } from './TimeSlotEditor';

export function EditCourseModal({ isOpen, onClose, course, totalWeeks = 20, onSave }: EditCourseModalProps) {
    const { updateCourse } = useCourses();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [color, setColor] = useState('');
    const [credits, setCredits] = useState<string>('0');
    const [note, setNote] = useState('');
    const [times, setTimes] = useState<CourseTime[]>([]);

    // Editor state
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && course) {
            setName(course.name);
            setColor(course.color);
            setCredits(course.credits?.toString() || '0');
            setNote(course.note || '');
            setTimes(course.times ? JSON.parse(JSON.stringify(course.times)) : []);
        }
    }, [isOpen, course]);

    const handleSave = async () => {
        if (!name) return;
        setLoading(true);
        try {
            await updateCourse({
                id: course.id,
                data: {
                    name,
                    color,
                    credits: parseFloat(credits),
                    note,
                    times: times.map(t => ({
                        ...t,
                        teacher: t.teacher || null,
                        location: t.location || null,
                        startTime: t.startTime || null,
                        endTime: t.endTime || null,
                    })),
                },
            });
            onSave?.();
            onClose();
        } catch (error) {
            console.error('Failed to update course:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTimeSlot = () => {
        const newSlot = {
            id: crypto.randomUUID(),
            courseId: course.id,
            dayOfWeek: 1,
            startPeriod: 1,
            endPeriod: 2,
            weekRange: '1-16',
            teacher: '',
            location: ''
        };
        setTimes([...times, newSlot]);
        setEditingSlotIndex(times.length); // Open editor for new slot
    };

    const removeTimeSlot = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTimes = [...times];
        newTimes.splice(index, 1);
        setTimes(newTimes);
    };

    const duplicateTimeSlot = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const slot = times[index];
        setTimes([...times, { ...slot, id: crypto.randomUUID() }]);
    };

    const handleSlotUpdate = (updatedSlot: any) => {
        if (editingSlotIndex !== null) {
            const newTimes = [...times];
            newTimes[editingSlotIndex] = updatedSlot;
            setTimes(newTimes);
            setEditingSlotIndex(null);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={onClose}
            >
                <div
                    className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] bg-[#F5F5F9] dark:bg-background"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-card border-b border-border shadow-sm z-10">
                        <button onClick={onClose} className="font-medium text-sm" style={{ color: 'hsl(var(--primary))' }}>取消</button>
                        <h2 className="text-base font-bold text-foreground">修改课程</h2>
                        <button onClick={handleSave} disabled={loading} className="font-medium text-sm disabled:opacity-50" style={{ color: 'hsl(var(--primary))' }}>
                            {loading ? '保存中' : '保存'}
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-4 space-y-4">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-card rounded-xl p-4 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <label className="w-12 text-sm font-medium text-foreground">课程</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex-1 text-right bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                    placeholder="输入课程名称"
                                />
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex items-center gap-4">
                                <label className="w-12 text-sm font-medium text-foreground">颜色</label>
                                <div className="flex-1 flex justify-end gap-2 overflow-x-auto py-1 no-scrollbar">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 transition-all flex-shrink-0",
                                                color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex items-center gap-4">
                                <label className="w-12 text-sm font-medium text-foreground">学分</label>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={credits}
                                    onChange={(e) => {
                                        // Allow only numbers and one decimal point
                                        const val = e.target.value;
                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                            setCredits(val);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Format to 1 decimal place on blur
                                        const num = parseFloat(credits);
                                        if (!isNaN(num)) {
                                            setCredits(num.toFixed(1));
                                        } else {
                                            setCredits('0.0');
                                        }
                                    }}
                                    className="flex-1 text-right bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="h-px bg-border/50" />
                            <div className="flex items-start gap-4">
                                <label className="w-12 text-sm font-medium text-foreground pt-1.5">备注</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="flex-1 text-right bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-h-[60px] resize-none py-1.5"
                                    placeholder="添加备注"
                                />
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-xs text-muted-foreground">时间段</span>
                                <button onClick={addTimeSlot} className="text-xs font-medium flex items-center gap-1" style={{ color: 'hsl(var(--primary))' }}>
                                    <Plus className="w-3 h-3" />
                                    添加时间段
                                </button>
                            </div>

                            <div className="space-y-3">
                                {times.map((time, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setEditingSlotIndex(index)}
                                        className="bg-white dark:bg-card rounded-xl p-4 shadow-sm space-y-3 relative group active:scale-[0.99] transition-transform cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-base">
                                                    周{['日', '一', '二', '三', '四', '五', '六'][time.dayOfWeek]}
                                                    <span className="mx-2 text-muted-foreground">|</span>
                                                    {time.startTime && time.endTime ? (
                                                        <span>{time.startTime} - {time.endTime}</span>
                                                    ) : (
                                                        <span>第 {time.startPeriod}-{time.endPeriod} 节</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {time.weekRange}周 • {time.location || '无地点'} • {time.teacher || '无教师'}
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={(e) => duplicateTimeSlot(index, e)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button onClick={(e) => removeTimeSlot(index, e)} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {times.length === 0 && (
                                    <div
                                        onClick={addTimeSlot}
                                        className="text-center py-8 text-muted-foreground bg-white dark:bg-card rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                        <p>点击添加上课时间</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Time Slot Editor Modal */}
            {editingSlotIndex !== null && times[editingSlotIndex] && (
                <TimeSlotEditor
                    isOpen={true}
                    onClose={() => setEditingSlotIndex(null)}
                    value={{
                        ...times[editingSlotIndex],
                        teacher: times[editingSlotIndex].teacher || undefined,
                        location: times[editingSlotIndex].location || undefined,
                        startTime: times[editingSlotIndex].startTime || undefined,
                        endTime: times[editingSlotIndex].endTime || undefined,
                    }}
                    onChange={handleSlotUpdate}
                    totalWeeks={totalWeeks}
                />
            )}
        </>
    );
}
