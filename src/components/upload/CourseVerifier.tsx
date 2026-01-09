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
    onConfirm: (courses: RecognizedCourse[], options?: {
        newScheduleName?: string;
        mode?: 'create' | 'add' | 'overwrite';
        periodsPerDay?: number;
        totalWeeks?: number;
        startDate?: string;
    }) => void;
    onCancel: () => void;
}

const DAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function CourseVerifier({ courses: initialCourses, onConfirm, onCancel }: CourseVerifierProps) {
    const [courses, setCourses] = useState<RecognizedCourse[]>(initialCourses);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<RecognizedCourse | null>(null);

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
            const newCourses = [...courses];
            // Merge form data back into recognized course structure
            // We need to map CourseForm data back to RecognizedCourse
            newCourses[editingIndex] = {
                ...courses[editingIndex],
                name: data.name,
                teacher: data.teacher,
                times: data.times.map((t: any) => ({
                    dayOfWeek: t.dayOfWeek,
                    startPeriod: t.startPeriod,
                    endPeriod: t.endPeriod,
                    weekRange: t.weekRange,
                    location: t.location,
                    teacher: t.teacher
                }))
            };
            setCourses(newCourses);
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
        const newCourse: RecognizedCourse = {
            name: '新课程',
            times: [{
                dayOfWeek: 1,
                startPeriod: 1,
                endPeriod: 2,
                weekRange: '1-16',
            }]
        };
        setCourses([...courses, newCourse]);
        // Immediately open edit for the new course
        setEditingIndex(courses.length);
    };

    const [importMode, setImportMode] = useState<'create' | 'add' | 'overwrite'>('create');
    const [newScheduleName, setNewScheduleName] = useState('');
    const [periodsPerDay, setPeriodsPerDay] = useState(12);
    const [totalWeeks, setTotalWeeks] = useState(20);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        // Default to this week's Monday
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    });

    // Manual Calendar State
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const handleConfirm = () => {
        if (importMode === 'create' && !newScheduleName.trim()) {
            alert('请输入新课表名称');
            return;
        }
        onConfirm(courses, {
            newScheduleName: importMode === 'create' ? newScheduleName : undefined,
            mode: importMode,
            periodsPerDay: importMode === 'create' ? periodsPerDay : undefined,
            totalWeeks: importMode === 'create' ? totalWeeks : undefined,
            startDate: importMode === 'create' ? startDate : undefined
        });
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
                {courses.map((course, index) => (
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
                                            <span className="text-primary/80 font-medium">{time.weekRange}</span>
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
            {editingIndex !== null && courses[editingIndex] && (
                <Modal
                    isOpen={true}
                    onClose={handleCancelEdit}
                    zIndex={60} // Slightly higher than default just in case, though 50 is default for Modal
                >
                    <CourseForm
                        initialData={{
                            name: courses[editingIndex].name,
                            teacher: courses[editingIndex].teacher,
                            times: courses[editingIndex].times.map(t => ({ ...t, id: crypto.randomUUID(), courseId: '' })),
                            color: '#3B82F6',
                            credits: 0,
                            note: ''
                        }}
                        onSubmit={handleSaveEdit}
                        onCancel={handleCancelEdit}
                    />
                </Modal>
            )}

            {courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>没有识别到课程，请手动添加</p>
                </div>
            )}

            {/* Import Target Selection */}
            <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-border">
                <h4 className="text-sm font-medium text-foreground">导入目标</h4>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            value="create"
                            checked={importMode === 'create'}
                            onChange={() => setImportMode('create')}
                            className="w-4 h-4 text-primary"
                        />
                        创建新课表
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            value="add"
                            checked={importMode === 'add'}
                            onChange={() => setImportMode('add')}
                            className="w-4 h-4 text-primary"
                        />
                        添加到当前课表
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            value="overwrite"
                            checked={importMode === 'overwrite'}
                            onChange={() => setImportMode('overwrite')}
                            className="w-4 h-4 text-primary"
                        />
                        覆盖当前课表
                    </label>
                </div>
                {importMode === 'create' && (
                    <div className="animate-in slide-in-from-top-2 duration-200 space-y-3 pt-2">
                        <input
                            type="text"
                            value={newScheduleName}
                            onChange={(e) => setNewScheduleName(e.target.value)}
                            placeholder="请输入课表名称"
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none"
                            autoFocus
                        />
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">开学日期</label>
                            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none text-left flex items-center gap-2",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                        {startDate ? format(new Date(startDate), 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent z-[100]" align="start" side="bottom" sideOffset={8}>
                                    <CustomCalendar
                                        selectedDate={startDate ? new Date(startDate) : undefined}
                                        onSelect={(d) => {
                                            setStartDate(format(d, 'yyyy-MM-dd'));
                                            setIsPopoverOpen(false);
                                        }}
                                        className="bg-card border border-border shadow-lg rounded-xl"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">每天节数</label>
                                <input
                                    type="number"
                                    min={4}
                                    max={20}
                                    value={periodsPerDay}
                                    onChange={(e) => setPeriodsPerDay(parseInt(e.target.value) || 12)}
                                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">学期周数</label>
                                <input
                                    type="number"
                                    min={10}
                                    max={30}
                                    value={totalWeeks}
                                    onChange={(e) => setTotalWeeks(parseInt(e.target.value) || 20)}
                                    className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors"
                >
                    取消
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={courses.length === 0}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {importMode === 'create' ? '创建并导入' : (importMode === 'overwrite' ? '覆盖并导入' : '确认导入')}
                </button>
            </div>
        </div>
    );
}
