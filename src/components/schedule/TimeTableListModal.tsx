'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, ChevronRight, Clock } from 'lucide-react';
import { Schedule, TimeTable } from '@/types';
import { cn } from '@/lib/utils';
import { TimeTableEditorModal } from './TimeTableEditorModal';
import { TimeTableSwitchConfigModal } from './TimeTableSwitchConfigModal';

import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TimeTableListModalProps {
    schedule: Schedule;
    timeTables: TimeTable[];
    isOpen: boolean;
    onClose: () => void;
    onScheduleUpdate: (id: string, data: Partial<Schedule>) => Promise<void>;
    onTimeTablesRefresh: () => Promise<void>;
    zIndex?: number;
    hasBackdrop?: boolean;
}

const getDefaultPeriods = () => {
    return [
        { id: 't1', timeTableId: 'new', number: 1, startTime: '08:00', endTime: '08:45' },
        { id: 't2', timeTableId: 'new', number: 2, startTime: '08:55', endTime: '09:40' },
        { id: 't3', timeTableId: 'new', number: 3, startTime: '10:00', endTime: '10:45' },
        { id: 't4', timeTableId: 'new', number: 4, startTime: '10:55', endTime: '11:40' },
        { id: 't5', timeTableId: 'new', number: 5, startTime: '14:00', endTime: '14:45' },
        { id: 't6', timeTableId: 'new', number: 6, startTime: '14:55', endTime: '15:40' },
        { id: 't7', timeTableId: 'new', number: 7, startTime: '16:00', endTime: '16:45' },
        { id: 't8', timeTableId: 'new', number: 8, startTime: '16:55', endTime: '17:40' },
        { id: 't9', timeTableId: 'new', number: 9, startTime: '19:00', endTime: '19:45' },
        { id: 't10', timeTableId: 'new', number: 10, startTime: '19:55', endTime: '20:40' },
    ];
};

export function TimeTableListModal({
    schedule,
    timeTables,
    isOpen,
    onClose,
    onScheduleUpdate,
    onTimeTablesRefresh,
    zIndex = 50,
    hasBackdrop = false,
}: TimeTableListModalProps) {
    const [editingTimeTable, setEditingTimeTable] = useState<TimeTable | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [isPendingEnable, setIsPendingEnable] = useState(false);

    // Determine active ID: optimistic > server > default
    const activeId = optimisticActiveId || schedule.activeTimeTableId || timeTables.find(t => t.isDefault)?.id;

    // Reset optimistic ID when server syncs up
    useEffect(() => {
        if (optimisticActiveId && schedule.activeTimeTableId === optimisticActiveId) {
            setOptimisticActiveId(null);
        }
    }, [schedule.activeTimeTableId, optimisticActiveId]);

    // Sync editingTimeTable when timeTables update
    useEffect(() => {
        if (editingTimeTable && isEditorOpen) {
            const updated = timeTables.find(t => t.id === editingTimeTable.id);
            if (updated && updated !== editingTimeTable) {
                setEditingTimeTable(updated);
            }
        }
    }, [timeTables, editingTimeTable, isEditorOpen]);

    if (!isOpen) return null;

    const handleCreate = () => {
        const tempTimeTable: TimeTable = {
            id: 'new',
            userId: schedule.userId,
            name: '新时间表',
            sameDuration: true,
            duration: 45,
            isDefault: false,
            periods: getDefaultPeriods(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setEditingTimeTable(tempTimeTable);
        setIsEditorOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeletingId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;

        try {
            const res = await fetch(`/api/timetables/${deletingId}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }

            await onTimeTablesRefresh();
        } catch (error: any) {
            console.error('Delete failed', error);
            alert(error.message || '删除失败');
        } finally {
            setDeletingId(null);
            setShowDeleteConfirm(false);
        }
    };

    const handleSetActive = async (id: string) => {
        if (id === activeId) return;

        // Optimistic update
        setOptimisticActiveId(id);

        try {
            await fetch(`/api/schedules/${schedule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeTimeTableId: id })
            });
            await onScheduleUpdate(schedule.id, {});
        } catch (error) {
            console.error('Set active failed', error);
            setOptimisticActiveId(null);
        }
    };

    const handleEdit = (e: React.MouseEvent, timeTable: TimeTable) => {
        e.stopPropagation();
        setEditingTimeTable(timeTable);
        setIsEditorOpen(true);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={zIndex}
            hasBackdrop={hasBackdrop} // Default to false since it's usually nested, but let's make it configurable via props if needed
            className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
        >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    上课时间列表
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Auto Switch Toggle Section */}
            <div className="px-6 py-3 bg-muted/20 border-b border-border flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">自动切换夏冬令时</span>
                    <span className="text-xs text-muted-foreground">根据日期自动变更时间表</span>
                </div>
                <div className="flex items-center gap-3">
                    {schedule.enableAutoTimeTableSwitch && (
                        <button
                            onClick={() => setIsConfigOpen(true)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            设置规则
                        </button>
                    )}
                    <button
                        onClick={async () => {
                            if (toggling) return;
                            setToggling(true);
                            const newValue = !schedule.enableAutoTimeTableSwitch;
                            try {
                                await onScheduleUpdate(schedule.id, {
                                    enableAutoTimeTableSwitch: newValue
                                });
                                if (newValue) {
                                    setIsPendingEnable(true);
                                    setIsConfigOpen(true);
                                }
                            } finally {
                                setToggling(false);
                            }
                        }}
                        className={cn(
                            "w-10 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/20",
                            schedule.enableAutoTimeTableSwitch ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                            schedule.enableAutoTimeTableSwitch ? "translate-x-4" : ""
                        )} />
                    </button>
                </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
                {timeTables.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        还没有设置时间表
                    </div>
                )}

                {timeTables.map((timeTable) => {
                    const isActive = timeTable.id === activeId;
                    return (
                        <div
                            key={timeTable.id}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                isActive
                                    ? "bg-primary/5 border-primary/20"
                                    : "bg-card border-border hover:border-primary/50"
                            )}
                            onClick={() => handleSetActive(timeTable.id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center border transition-colors",
                                    isActive
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}>
                                    {isActive && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                    <div className={cn("font-medium", isActive && "text-primary")}>
                                        {timeTable.name}
                                    </div>
                                    {timeTable.isDefault && (
                                        <div className="text-xs text-muted-foreground">系统默认</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Delete Button (Only if not default and not active) */}
                                {!timeTable.isDefault && !isActive && (
                                    <button
                                        onClick={(e) => handleDelete(e, timeTable.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="删除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}

                                {/* Edit Button */}
                                <button
                                    onClick={(e) => handleEdit(e, timeTable)}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    title="编辑时间"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border bg-card flex-shrink-0">
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                >
                    <Plus className="w-4 h-4" />
                    <span>新建时间表</span>
                </button>
            </div>

            {/* Nested Editor Modal - Needs zIndex handling */}
            {editingTimeTable && (
                <TimeTableEditorModal
                    isOpen={isEditorOpen}
                    timeTable={editingTimeTable}
                    onClose={() => {
                        setIsEditorOpen(false);
                        setEditingTimeTable(null);
                    }}
                    onSave={async () => {
                        await onTimeTablesRefresh();
                    }}
                    zIndex={80}
                    hasBackdrop={false}
                />
            )}

            {/* Config Modal */}
            <TimeTableSwitchConfigModal
                isOpen={isConfigOpen}
                onClose={() => {
                    setIsConfigOpen(false);
                    // If we were pending enabling (just turned on) and closed without save, revert
                    if (isPendingEnable) {
                        onScheduleUpdate(schedule.id, { enableAutoTimeTableSwitch: false });
                        setIsPendingEnable(false);
                    }
                }}
                onSaved={async () => {
                    setIsPendingEnable(false);
                    await onScheduleUpdate(schedule.id, {});
                    setIsConfigOpen(false);
                }}
                timeTables={timeTables}
            />


            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(open) => {
                    setShowDeleteConfirm(open);
                    if (!open) setDeletingId(null);
                }}
                title="删除上课时间表"
                description="确定要删除这个时间表吗？删除后，使用此时间表的历史数据可能受影响。"
                confirmText="删除"
                cancelText="取消"
                onConfirm={confirmDelete}
                variant="destructive"
            />
        </Modal>
    );
}
