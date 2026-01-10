'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { TimeTable, Period } from '@/types';
import { cn } from '@/lib/utils';

import { Modal } from '@/components/ui/Modal';

interface TimeTableEditorModalProps {
    timeTable: TimeTable;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => Promise<void>; // Trigger refresh in parent
    zIndex?: number;
    hasBackdrop?: boolean;
}

export function TimeTableEditorModal({
    timeTable,
    isOpen,
    onClose,
    onSave,
    zIndex = 60,
    hasBackdrop = true,
}: TimeTableEditorModalProps) {
    const [name, setName] = useState(timeTable.name);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [sameDuration, setSameDuration] = useState(timeTable.sameDuration);
    const [duration, setDuration] = useState<number | ''>(timeTable.duration || 45);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && timeTable) {
            setName(timeTable.name);
            setSameDuration(timeTable.sameDuration);
            setDuration(timeTable.duration || 45);
            // Sort periods by number just in case
            const sorted = [...timeTable.periods].sort((a, b) => a.number - b.number);
            setPeriods(sorted);
        }
    }, [isOpen, timeTable]);

    // Helper to add minutes to "HH:mm"
    const addMinutes = (time: string, minutes: number) => {
        const [h, m] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        date.setMinutes(date.getMinutes() + minutes);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const handlePeriodChange = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newPeriods = [...periods];
        newPeriods[index] = { ...newPeriods[index], [field]: value };

        // Auto-calculate end time if sameDuration is on and start time changed
        if (sameDuration && field === 'startTime' && value && typeof duration === 'number') {
            newPeriods[index].endTime = addMinutes(value, duration);
        }

        setPeriods(newPeriods);
    };

    const handleDurationChange = (value: string) => {
        if (value === '') {
            setDuration('');
            return;
        }

        const newDuration = parseInt(value);
        if (isNaN(newDuration)) return;

        setDuration(newDuration);

        if (sameDuration) {
            const newPeriods = periods.map(p => ({
                ...p,
                endTime: p.startTime ? addMinutes(p.startTime, newDuration) : p.endTime
            }));
            setPeriods(newPeriods);
        }
    };

    const toggleSameDuration = (checked: boolean) => {
        setSameDuration(checked);
        if (checked) {
            // Recalculate all end times based on current duration
            const currentDur = typeof duration === 'number' ? duration : 45;
            if (duration === '') setDuration(45);

            const newPeriods = periods.map(p => ({
                ...p,
                endTime: p.startTime ? addMinutes(p.startTime, currentDur) : p.endTime
            }));
            setPeriods(newPeriods);
        }
    };

    const handleAddPeriod = () => {
        const nextNumber = periods.length > 0 ? periods[periods.length - 1].number + 1 : 1;
        // Try to guess start time based on last end time + 10 min break
        let nextStart = "08:00";
        if (periods.length > 0) {
            const lastEnd = periods[periods.length - 1].endTime;
            if (lastEnd) nextStart = addMinutes(lastEnd, 10);
        }

        const newPeriod: Period = {
            id: `temp-${Date.now()}`, // Temp ID
            timeTableId: timeTable.id,
            number: nextNumber,
            startTime: nextStart,
            endTime: sameDuration ? addMinutes(nextStart, typeof duration === 'number' ? duration : 45) : addMinutes(nextStart, 45)
        };
        setPeriods([...periods, newPeriod]);
    };

    const handleDeletePeriod = (index: number) => {
        const newPeriods = periods.filter((_, i) => i !== index);
        // Optional: Renumber periods?
        // Usually better to renumber to keep sequence 1..N
        const renumbered = newPeriods.map((p, i) => ({ ...p, number: i + 1 }));
        setPeriods(renumbered);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const isNew = timeTable.id === 'new';
            const url = isNew ? '/api/timetables' : `/api/timetables/${timeTable.id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    sameDuration,
                    duration: (sameDuration && typeof duration === 'number') ? duration : null,
                    periods: periods.map((p) => ({
                        number: p.number,
                        startTime: p.startTime,
                        endTime: p.endTime
                    }))
                })
            });

            if (!res.ok) throw new Error('Failed to update timetable');

            await onSave();
            onClose();
        } catch (error) {
            console.error('Save failed:', error);
            alert('保存失败，请检查时间格式');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            zIndex={zIndex}
            hasBackdrop={hasBackdrop}
            className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
        >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    上课时间设置
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="space-y-6">
                    {/* Time Table Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">时间表名称</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="如：冬令时"
                        />
                    </div>

                    {/* Same Duration Setting */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div>
                            <div className="text-sm font-medium">每节课时长相同</div>
                            <div className="text-xs text-muted-foreground mt-0.5">修改开始时间由于自动计算结束时间</div>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={sameDuration}
                            onChange={(e) => toggleSameDuration(e.target.checked)}
                        />
                    </div>

                    {sameDuration && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">单节时长 (分钟)</label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                value={duration === '' ? '' : duration}
                                onChange={(e) => handleDurationChange(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    )}

                    {/* Periods List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-muted-foreground">节次时间 ({periods.length}节)</label>
                            <button
                                onClick={handleAddPeriod}
                                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                添加节次
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {periods.map((period, index) => (
                                <div key={period.id || `temp-${index}`} className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50 group">
                                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-medium rounded-md text-sm shrink-0">
                                        {period.number}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={period.startTime}
                                            onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                                            className="flex-1 px-2 py-1.5 bg-background border border-input rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                        />
                                        <span className="text-muted-foreground">-</span>
                                        <input
                                            type="time"
                                            value={period.endTime}
                                            onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                                            className={cn(
                                                "flex-1 px-2 py-1.5 bg-background border border-input rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary",
                                                sameDuration && "bg-muted text-muted-foreground"
                                            )}
                                            readOnly={sameDuration}
                                            title={sameDuration ? "自动计算 (关闭'每节课时长相同'以手动修改)" : ""}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleDeletePeriod(index)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除此节次"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {periods.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                                点击右上角添加节次
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3 flex-shrink-0 bg-card">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                    取消
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                >
                    {saving ? '保存中...' : '保存'}
                </button>
            </div>
        </Modal>
    );
}
