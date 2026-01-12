'use client';

import { copyToClipboard } from '@/lib/clipboard';

import { useState } from 'react';
import { X, User, MapPin, BookOpen, Trash2, Share, Check, CheckCircle, Circle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Course, Period } from '@/types';
import { CourseDetailModal } from './CourseDetailModal';
import { EditCourseModal } from './EditCourseModal';
import { useCourses } from '@/hooks/use-courses';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

interface CourseListModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    scheduleName: string;
    periods?: Period[];
    onRefresh?: () => void;
    zIndex?: number;
    hasBackdrop?: boolean;
    totalWeeks?: number;
    startDate?: string;
}

export function CourseListModal({
    isOpen,
    onClose,
    courses,
    scheduleName,
    periods = [], // Default to empty if not provided
    onRefresh,
    zIndex = 70,
    hasBackdrop = true,
    totalWeeks,
    startDate,
}: CourseListModalProps) {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const { deleteCourse } = useCourses();
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === courses.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(courses.map(c => c.id)));
        }
    };

    const handleBatchDelete = async () => {
        setIsDeleting(true);
        try {
            // Execute sequentially to avoid overwhelming server/db
            for (const id of Array.from(selectedIds)) {
                await deleteCourse(id);
            }
            onRefresh?.();
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Batch delete failed', error);
            alert('部分课程删除失败');
        } finally {
            setIsDeleting(false);
            setShowBatchDeleteConfirm(false);
        }
    };

    // Use shared utility
    // const copyToClipboard = ... (removed)

    const handleBatchShare = async () => {
        if (selectedIds.size === 0) return;

        const selectedCourses = courses.filter(c => selectedIds.has(c.id));
        const exportData = {
            version: 1,
            type: 'schedule', // Use schedule type but with subset
            data: {
                name: `${scheduleName} (选中课程)`,
                totalWeeks: totalWeeks || 20, // Fallback
                courses: selectedCourses.map(c => ({
                    name: c.name,
                    teacher: c.times[0]?.teacher || undefined,
                    location: c.times[0]?.location || undefined,
                    credits: c.credits,
                    color: c.color,
                    note: c.note,
                    times: c.times.map(t => ({
                        dayOfWeek: t.dayOfWeek,
                        startPeriod: t.startPeriod,
                        endPeriod: t.endPeriod,
                        weekRange: t.weekRange,
                        location: t.location,
                        teacher: t.teacher,
                        startTime: t.startTime,
                        endTime: t.endTime
                    }))
                }))
            }
        };

        const jsonStr = JSON.stringify(exportData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
        const humanReadable = `[SmartSchedule 批量分享]
共包含 ${selectedCourses.length} 门课程`;

        const exportText = `===SmartSchedule===
${humanReadable}
---DATA---
${base64Data}
===END===`;

        const success = await copyToClipboard(exportText);
        if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } else {
            alert('复制失败，请检查浏览器权限');
        }
    };

    // If main modal is closed, ensure detail modal is also effectively closed/reset
    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                zIndex={zIndex}
                hasBackdrop={hasBackdrop}
                className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold">已添课程列表</h3>
                        <p className="text-xs text-muted-foreground">{scheduleName} • 共 {courses.length} 门课程</p>
                    </div>
                    <button
                        onClick={() => {
                            if (isSelectionMode) {
                                setIsSelectionMode(false);
                                setSelectedIds(new Set());
                            } else {
                                setIsSelectionMode(true);
                            }
                        }}
                        className={cn(
                            "px-3 py-1 text-sm font-medium rounded-lg transition-colors",
                            isSelectionMode
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "text-primary hover:bg-primary/5"
                        )}
                    >
                        {isSelectionMode ? '完成' : '批量管理'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {courses.length > 0 ? (
                        <>
                            {isSelectionMode && (
                                <div className="px-1 py-1 flex justify-between items-center bg-muted/20 rounded-lg mb-2">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs text-primary px-2 py-1 hover:underline"
                                    >
                                        {selectedIds.size === courses.length ? '取消全选' : '全选'}
                                    </button>
                                    <span className="text-xs text-muted-foreground px-2">
                                        已选 {selectedIds.size} 项
                                    </span>
                                </div>
                            )}
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            toggleSelection(course.id);
                                        } else {
                                            setSelectedCourse(course);
                                        }
                                    }}
                                    className={cn(
                                        "p-3 rounded-xl border border-border bg-background transition-colors flex gap-3 cursor-pointer group",
                                        isSelectionMode && selectedIds.has(course.id) && "border-primary/50 bg-primary/5",
                                        !isSelectionMode && "hover:bg-muted/30"
                                    )}
                                >
                                    {isSelectionMode && (
                                        <div className="flex items-center justify-center pt-1">
                                            {selectedIds.has(course.id) ? (
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-muted-foreground/50" />
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <span className="font-medium text-foreground">{course.name}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            {course.times?.[0]?.teacher && (
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{course.times[0].teacher}</span>
                                                </div>
                                            )}
                                            {course.times?.[0]?.location && (
                                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{course.times[0].location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>{course.times?.length || 0} 个时间段</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p>暂无课程</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex-shrink-0">
                    {isSelectionMode ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBatchDeleteConfirm(true)}
                                disabled={selectedIds.size === 0 || isDeleting}
                                className="flex-1 py-2 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                删除 ({selectedIds.size})
                            </button>
                            <button
                                onClick={handleBatchShare}
                                disabled={selectedIds.size === 0 || copySuccess}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2",
                                    copySuccess ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                                )}
                            >
                                {copySuccess ? <Check className="w-4 h-4" /> : <Share className="w-4 h-4" />}
                                分享 ({selectedIds.size})
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                        >
                            关闭
                        </button>
                    )}
                </div>
            </Modal>

            {/* Course Detail Modal */}
            {selectedCourse && (
                <CourseDetailModal
                    isOpen={!!selectedCourse && !isEditOpen}
                    onClose={() => setSelectedCourse(null)}
                    course={selectedCourse}
                    periods={periods}
                    onEdit={() => {
                        setIsEditOpen(true);
                    }}
                    onRefresh={onRefresh}
                    zIndex={80}
                    hasBackdrop={false}
                    fromList={true}
                />
            )}

            {/* Edit Course Modal */}
            {selectedCourse && (
                <EditCourseModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    course={selectedCourse}
                    totalWeeks={totalWeeks}
                    startDate={startDate}
                    onSave={() => {
                        onRefresh?.();
                        setIsEditOpen(false);
                        setSelectedCourse(null);
                    }}
                    zIndex={90}
                    hasBackdrop={false}
                />
            )}

            <ConfirmDialog
                open={showBatchDeleteConfirm}
                onOpenChange={setShowBatchDeleteConfirm}
                title="确认批量删除"
                description={`您确定要删除选中的 ${selectedIds.size} 门课程吗？此操作无法撤销。`}
                confirmText={isDeleting ? '删除中...' : '确认删除'}
                cancelText="取消"
                onConfirm={handleBatchDelete}
                variant="destructive"
            />
        </>
    );
}
