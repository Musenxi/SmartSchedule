'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, ChevronRight, Clock } from 'lucide-react';
import { Schedule, TimeTable } from '@/types';
import { cn } from '@/lib/utils';
import { TimeTableEditorModal } from './TimeTableEditorModal';

interface TimeTableListModalProps {
    schedule: Schedule;
    timeTables: TimeTable[];
    isOpen: boolean;
    onClose: () => void;
    onScheduleUpdate: (id: string, data: Partial<Schedule>) => Promise<void>;
    onTimeTablesRefresh: () => Promise<void>;
}

export function TimeTableListModal({
    schedule,
    timeTables,
    isOpen,
    onClose,
    onScheduleUpdate,
    onTimeTablesRefresh,
}: TimeTableListModalProps) {
    const [editingTimeTable, setEditingTimeTable] = useState<TimeTable | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [optimisticActiveId, setOptimisticActiveId] = useState<string | null>(null);

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

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            // Use user-level API
            const res = await fetch('/api/timetables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: '新时间表' })
            });

            if (!res.ok) throw new Error('Create failed');

            const newTimeTable = await res.json();

            // Refresh timetables
            await onTimeTablesRefresh();

            // Open editor immediately
            setEditingTimeTable(newTimeTable);
            setIsEditorOpen(true);
        } catch (error) {
            console.error('Create failed', error);
            alert('创建失败');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('确定要删除这个时间表吗？')) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/timetables/${id}`, {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
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
                                            disabled={deletingId === timeTable.id}
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
            </div>

            {/* Nested Editor Modal */}
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
                />
            )}
        </div>
    );
}
