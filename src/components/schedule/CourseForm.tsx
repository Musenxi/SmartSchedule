'use client';

import { useState, useEffect } from 'react';
import { CourseTime } from '@/types';
import { Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeSlotEditor } from './TimeSlotEditor';

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

export interface CourseFormData {
    name: string;
    color: string;
    credits: number;
    note: string;
    teacher?: string; // Global teacher override/default
    times: CourseTime[];
}

interface CourseFormProps {
    initialData?: Partial<CourseFormData>;
    onSubmit: (data: CourseFormData) => void;
    onCancel: () => void;
    loading?: boolean;
    submitLabel?: string;
    totalWeeks?: number;
}

export function CourseForm({
    initialData,
    onSubmit,
    onCancel,
    loading = false,
    submitLabel = '保存',
    totalWeeks = 20
}: CourseFormProps) {
    // Form state
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [credits, setCredits] = useState<string>('0');
    const [note, setNote] = useState('');
    const [teacher, setTeacher] = useState('');
    const [times, setTimes] = useState<CourseTime[]>([]);

    // Editor state
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setColor(initialData.color || COLORS[0]);
            setCredits(initialData.credits?.toString() || '0');
            setNote(initialData.note || '');
            setTeacher(initialData.teacher || '');
            // Deep copy times to avoid reference issues
            setTimes(initialData.times ? JSON.parse(JSON.stringify(initialData.times)) : []);
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (!name) return;
        onSubmit({
            name,
            color,
            credits: parseFloat(credits) || 0,
            note,
            teacher,
            times
        });
    };

    const addTimeSlot = () => {
        const newSlot: CourseTime = {
            id: crypto.randomUUID(),
            courseId: '', // Placeholder
            dayOfWeek: 1,
            startPeriod: 1,
            endPeriod: 2,
            weekRange: '1-16',
            teacher: teacher || '', // Inherit global teacher if set
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

    return (
        <>
            <div className="flex flex-col h-full bg-[#F5F5F9] dark:bg-background overflow-hidden relative">
                {/* Top Bar - now part of the form layout or provided by parent? 
                     Usually Form is content. Let's make it fill the container provided by parent.
                 */}

                {/* Provide our own header if needed, but usually Modal provides header.
                     Let's verify usage. EditCourseModal has header inside.
                     We can include the header here for consistency or let parent handle it.
                     The request is "reuse logic", likely UI too.
                     Let's keep the header here to ensure it looks exactly the same.
                 */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-card border-b border-border shadow-sm z-10 flex-shrink-0">
                    <button onClick={onCancel} className="font-medium text-sm" style={{ color: 'hsl(var(--primary))' }}>取消</button>
                    <h2 className="text-base font-bold text-foreground">{initialData?.name ? '修改课程' : '添加课程'}</h2>
                    <button onClick={handleSubmit} disabled={loading || !name} className="font-medium text-sm disabled:opacity-50" style={{ color: 'hsl(var(--primary))' }}>
                        {loading ? '保存中' : submitLabel}
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

                        {/* Teacher Field (Added because Import often has it) */}
                        <div className="flex items-center gap-4">
                            <label className="w-12 text-sm font-medium text-foreground">教师</label>
                            <input
                                type="text"
                                value={teacher}
                                onChange={(e) => setTeacher(e.target.value)}
                                className="flex-1 text-right bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                placeholder="教师姓名 (默认)"
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
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setCredits(val);
                                    }
                                }}
                                onBlur={() => {
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
                                                {time.weekRange} • {time.location || '无地点'} • {time.teacher || '无教师'}
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

            {/* Time Slot Editor Modal - needs to be inside or handled by parent? 
                It's a modal over this modal.
            */}
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
                    hasBackdrop={false}
                />
            )}
        </>
    );
}
