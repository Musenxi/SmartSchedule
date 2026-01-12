'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Trash2, Check, Pencil, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ScheduleSummary {
    id: string;
    name: string;
    isActive: boolean;
}

interface ScheduleListModalProps {
    schedules: ScheduleSummary[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (id: string) => Promise<void>;
    onEdit: (id: string) => void;
    onDelete: (id: string) => Promise<void>;
}

export function ScheduleListModal({
    schedules,
    isOpen,
    onClose,
    onSelect,
    onEdit,
    onDelete,
}: ScheduleListModalProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Filter valid schedules if necessary, but assume props are clean
    const sortedSchedules = [...schedules].sort((a, b) => {
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
    });

    const handleSelect = async (id: string) => {
        if (id === switchingId || schedules.find(s => s.id === id)?.isActive) return;
        setSwitchingId(id);
        try {
            await onSelect(id);
        } catch (error) {
            console.error('Failed to switch schedule', error);
        } finally {
            setSwitchingId(null);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteTargetId(id);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;

        setDeletingId(deleteTargetId);
        try {
            await onDelete(deleteTargetId);
        } catch (error) {
            console.error('Failed to delete schedule', error);
        } finally {
            setDeletingId(null);
            setDeleteTargetId(null);
        }
    };

    const handleAdd = () => {
        router.push('/import');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={50}
            className="w-full max-w-md bg-card p-0 flex flex-col max-h-[85vh]"
        >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    课表列表
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
                {sortedSchedules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        暂无课表
                    </div>
                )}

                {sortedSchedules.map((schedule) => {
                    const isProcessing = switchingId === schedule.id || deletingId === schedule.id;

                    return (
                        <div
                            key={schedule.id}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                schedule.isActive
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-card border-border hover:border-primary/50",
                                isProcessing && "opacity-50 pointer-events-none"
                            )}
                            onClick={() => handleSelect(schedule.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                    "w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center border transition-colors",
                                    schedule.isActive
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}>
                                    {schedule.isActive && <Check className="w-3 h-3" />}
                                </div>
                                <div className="truncate">
                                    <div className={cn("font-medium truncate", schedule.isActive && "text-primary")}>
                                        {schedule.name}
                                    </div>
                                    {schedule.isActive && (
                                        <div className="text-xs text-primary/80">当前使用中</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Delete Button (Only if not active) */}
                                {!schedule.isActive && (
                                    <button
                                        onClick={(e) => handleDeleteClick(e, schedule.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 mobile:opacity-100"
                                        title="删除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Edit Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(schedule.id);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="编辑设置"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border bg-card flex-shrink-0">
                <button
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>添加新课表</span>
                </button>
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="删除课表"
                description="确定要删除这个课表吗？此操作无法撤销，所有相关课程都将被永久删除。"
                confirmText="删除"
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </Modal>
    );
}
