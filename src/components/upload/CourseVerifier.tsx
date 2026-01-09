'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';

interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    originalText?: string;
    confidence?: number;
}

interface CourseVerifierProps {
    courses: RecognizedCourse[];
    onConfirm: (courses: RecognizedCourse[], options?: { newScheduleName?: string }) => void;
    onCancel: () => void;
}

const DAY_LABELS = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function CourseVerifier({ courses: initialCourses, onConfirm, onCancel }: CourseVerifierProps) {
    const [courses, setCourses] = useState<RecognizedCourse[]>(initialCourses);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<RecognizedCourse | null>(null);

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditForm({ ...courses[index] });
    };

    const handleSaveEdit = () => {
        if (editingIndex !== null && editForm) {
            const newCourses = [...courses];
            newCourses[editingIndex] = editForm;
            setCourses(newCourses);
            setEditingIndex(null);
            setEditForm(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditForm(null);
    };

    const handleDelete = (index: number) => {
        setCourses(courses.filter((_, i) => i !== index));
    };

    const handleAddNew = () => {
        const newCourse: RecognizedCourse = {
            name: '新课程',
            dayOfWeek: 1,
            startPeriod: 1,
            endPeriod: 2,
            weekRange: '1-16周',
        };
        setCourses([...courses, newCourse]);
        setEditingIndex(courses.length);
        setEditForm(newCourse);
    };

    const [importMode, setImportMode] = useState<'current' | 'new'>('current');
    const [newScheduleName, setNewScheduleName] = useState('');

    const handleConfirm = () => {
        if (importMode === 'new' && !newScheduleName.trim()) {
            alert('请输入新课表名称');
            return;
        }
        onConfirm(courses, importMode === 'new' ? { newScheduleName } : undefined);
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

            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {courses.map((course, index) => (
                    <div
                        key={index}
                        className={cn(
                            "p-3 rounded-lg border transition-colors",
                            editingIndex === index ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"
                        )}
                    >
                        {editingIndex === index && editForm ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        placeholder="课程名称"
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.teacher || ''}
                                        onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })}
                                        placeholder="教师"
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <select
                                        value={editForm.dayOfWeek}
                                        onChange={(e) => setEditForm({ ...editForm, dayOfWeek: parseInt(e.target.value) })}
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <option key={d} value={d}>{DAY_LABELS[d]}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={editForm.startPeriod}
                                        onChange={(e) => setEditForm({ ...editForm, startPeriod: parseInt(e.target.value) || 1 })}
                                        placeholder="开始节"
                                        min={1}
                                        max={12}
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    />
                                    <input
                                        type="number"
                                        value={editForm.endPeriod}
                                        onChange={(e) => setEditForm({ ...editForm, endPeriod: parseInt(e.target.value) || 2 })}
                                        placeholder="结束节"
                                        min={1}
                                        max={12}
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.weekRange}
                                        onChange={(e) => setEditForm({ ...editForm, weekRange: e.target.value })}
                                        placeholder="周次"
                                        className="px-2 py-1 text-sm border border-input rounded bg-background"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={editForm.location || ''}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="上课地点"
                                    className="w-full px-2 py-1 text-sm border border-input rounded bg-background"
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={handleCancelEdit} className="p-1.5 text-muted-foreground hover:text-foreground rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button onClick={handleSaveEdit} className="p-1.5 text-primary hover:bg-primary/10 rounded">
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">{course.name}</span>
                                        {course.confidence !== undefined && course.confidence < 0.8 && (
                                            <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">
                                                待确认
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground space-x-2">
                                        <span>{DAY_LABELS[course.dayOfWeek]}</span>
                                        <span>第{course.startPeriod}-{course.endPeriod}节</span>
                                        <span>{course.weekRange}</span>
                                        {course.location && <span>@{course.location}</span>}
                                        {course.teacher && <span>({course.teacher})</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(index)}
                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

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
                            value="current"
                            checked={importMode === 'current'}
                            onChange={() => setImportMode('current')}
                            className="w-4 h-4 text-primary"
                        />
                        添加到当前课表
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            name="importMode"
                            value="new"
                            checked={importMode === 'new'}
                            onChange={() => setImportMode('new')}
                            className="w-4 h-4 text-primary"
                        />
                        创建新课表
                    </label>
                </div>
                {importMode === 'new' && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        <input
                            type="text"
                            value={newScheduleName}
                            onChange={(e) => setNewScheduleName(e.target.value)}
                            placeholder="请输入新课表名称 (如: 大三下学期)"
                            className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:ring-1 focus:ring-primary outline-none"
                            autoFocus
                        />
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
                    {importMode === 'new' ? '创建并导入' : '确认导入'}
                </button>
            </div>
        </div>
    );
}
