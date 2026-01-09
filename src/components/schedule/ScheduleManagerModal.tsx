'use client';

import { useState } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CustomCalendar } from '@/components/ui/CustomCalendar';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

import { Schedule, TimeTable } from '@/types';
import { TimeTableListModal } from './TimeTableListModal';
import { Modal } from '@/components/ui/Modal';

interface ScheduleManagerModalProps {
    schedule: Schedule;
    timeTables?: TimeTable[];
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, data: Partial<Schedule>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onTimeTablesRefresh?: () => Promise<void>;
}

export function ScheduleManagerModal({
    schedule,
    timeTables = [],
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onTimeTablesRefresh,
}: ScheduleManagerModalProps) {
    const [name, setName] = useState(schedule.name);
    const [firstWeekStart, setFirstWeekStart] = useState<string>(
        new Date(schedule.firstWeekStart).toISOString().split('T')[0]
    );
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const [totalWeeks, setTotalWeeks] = useState(schedule.totalWeeks);
    const [isDeleting, setIsDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    // TimeTable List State
    const [isTimeListOpen, setIsTimeListOpen] = useState(false);

    // Identify active time table (active > default > first)
    const activeTimeTable = timeTables.find(t => t.id === schedule.activeTimeTableId) || timeTables.find(t => t.isDefault) || timeTables[0];

    if (!isOpen) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(schedule.id, {
                name,
                firstWeekStart: new Date(firstWeekStart),
                totalWeeks,
            });
            onClose();
        } catch (error) {
            console.error('Failed to update schedule', error);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定要删除这个课表吗？此操作无法撤销。')) return;

        setIsDeleting(true);
        try {
            await onDelete(schedule.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete schedule', error);
            alert('删除失败');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={60}
            className="w-full max-w-md bg-card p-0 flex flex-col"
        >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">编辑课表信息</h3>
                <button
                    onClick={onClose}
                    className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">课表名称</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">开学日期 (第一周周一)</label>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input outline-none text-foreground text-left flex items-center gap-2",
                                    !firstWeekStart && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                {firstWeekStart ? format(new Date(firstWeekStart), 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-none shadow-none bg-transparent z-[100]" align="center" sideOffset={8}>
                            <CustomCalendar
                                selectedDate={firstWeekStart ? new Date(firstWeekStart) : undefined}
                                onSelect={(d) => {
                                    setFirstWeekStart(format(d, 'yyyy-MM-dd'));
                                    setIsPopoverOpen(false);
                                }}
                                className="bg-card border border-border shadow-lg rounded-xl"
                            />
                        </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                        修改开学日期会自动重新计算当前周次
                    </p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">学期总周数</label>
                    <input
                        type="number"
                        min={1}
                        max={52}
                        value={totalWeeks}
                        onChange={(e) => setTotalWeeks(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Class Time Settings Button */}
                <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-muted-foreground">上课时间设置</label>
                    <button
                        onClick={() => setIsTimeListOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-background border border-input rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <span className="text-sm">
                            {activeTimeTable ? activeTimeTable.name : '设置节次时间'}
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-primary font-medium">管理</span>
                        </div>
                    </button>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || schedule.isActive}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors",
                            schedule.isActive && "opacity-50 cursor-not-allowed hidden"
                        )}
                        title={schedule.isActive ? "不能删除当前正在使用的课表" : "删除课表"}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>删除课表</span>
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                        >
                            {saving ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>

            {/* TimeTable List Modal */}
            <TimeTableListModal
                isOpen={isTimeListOpen}
                onClose={() => setIsTimeListOpen(false)}
                schedule={schedule}
                timeTables={timeTables}
                onScheduleUpdate={onUpdate}
                onTimeTablesRefresh={async () => {
                    if (onTimeTablesRefresh) await onTimeTablesRefresh();
                }}
            />
        </Modal >
    );
}

