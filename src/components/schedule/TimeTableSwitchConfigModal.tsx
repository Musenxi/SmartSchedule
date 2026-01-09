'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Calendar as CalendarIcon, X, Sun, Snowflake } from 'lucide-react';
import { CustomCalendar } from "@/components/ui/CustomCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimeTable } from '@/types';
import { cn } from '@/lib/utils'; // Assuming cn exists

interface TimeTableSwitchConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
    timeTables: TimeTable[];
}

export function TimeTableSwitchConfigModal({ isOpen, onClose, onSaved, timeTables }: TimeTableSwitchConfigModalProps) {
    const [config, setConfig] = useState({
        winterStartDate: '10-01',
        winterEndDate: '04-30',
        winterTimeTableId: '',
        summerTimeTableId: '',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Parse MM-DD
    const parseDate = (str: string) => {
        if (!str) return { month: 10, day: 1 };
        const [m, d] = str.split('-').map(Number);
        return { month: m, day: d };
    };

    const formatConfigDate = (m: number, d: number) => {
        return `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/api/timetables/config')
                .then(res => res.json())
                .then(data => {
                    if (!data.error) {
                        setConfig({
                            winterStartDate: data.winterStartDate || '10-01',
                            winterEndDate: data.winterEndDate || '04-30',
                            winterTimeTableId: data.winterTimeTableId || '',
                            summerTimeTableId: data.summerTimeTableId || '',
                        });
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/timetables/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (!res.ok) throw new Error('Failed to save');
            if (onSaved) {
                onSaved();
            } else {
                onClose();
            }
        } catch (error) {
            console.error(error);
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const DateSelect = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
        const [open, setOpen] = useState(false);
        const { month, day } = parseDate(value);
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, month - 1, day);

        const handleSelect = (d: Date | undefined) => {
            if (d) {
                const m = d.getMonth() + 1;
                const dNum = d.getDate();
                onChange(formatConfigDate(m, dNum));
                setOpen(false);
            }
        };

        return (
            <div className="flex flex-col gap-1.5 font-medium">
                <span className="text-xs text-muted-foreground ml-1">{label}</span>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-2 px-3 py-2 bg-background border border-input rounded-lg text-sm text-left font-normal hover:bg-muted/50 transition-colors focus:ring-2 focus:ring-primary/20",
                            !value && "text-muted-foreground"
                        )}>
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span>{month}月{day}日</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[80] border-none shadow-none bg-transparent" align="start">
                        <CustomCalendar
                            selectedDate={date}
                            onSelect={handleSelect}
                            className="bg-card border border-border shadow-lg rounded-xl"
                        />
                    </PopoverContent>
                </Popover>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex={70} className="w-full max-w-md bg-card p-0 flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    夏冬令时设置
                </h3>
                <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-muted rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                {/* 1. Winter Date Range */}
                {/* 1. Winter Date Range */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                        冬令时生效时间
                    </div>
                    <div className="grid grid-cols-2 gap-6 items-center px-1">
                        <DateSelect
                            label="开始日期"
                            value={config.winterStartDate}
                            onChange={(v) => setConfig({ ...config, winterStartDate: v })}
                        />
                        <DateSelect
                            label="结束日期"
                            value={config.winterEndDate}
                            onChange={(v) => setConfig({ ...config, winterEndDate: v })}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground px-2">
                        * 在此日期范围之外的时间将自动视为夏令时
                    </p>
                </div>

                {/* 2. Table Selection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                        对应时间表
                    </div>

                    <div className="grid gap-3">
                        {/* Winter Selector */}
                        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                    <Snowflake className="w-5 h-5" />
                                </div>
                                <div className="text-sm font-medium">冬令时使用</div>
                            </div>
                            <select
                                value={config.winterTimeTableId}
                                onChange={(e) => setConfig({ ...config, winterTimeTableId: e.target.value })}
                                className="w-[160px] text-sm bg-muted/50 border-none rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary"
                            >
                                <option value="">请选择...</option>
                                {timeTables.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Summer Selector */}
                        <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-orange-500/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                    <Sun className="w-5 h-5" />
                                </div>
                                <div className="text-sm font-medium">夏令时使用</div>
                            </div>
                            <select
                                value={config.summerTimeTableId}
                                onChange={(e) => setConfig({ ...config, summerTimeTableId: e.target.value })}
                                className="w-[160px] text-sm bg-muted/50 border-none rounded-md px-2 py-1.5 focus:ring-1 focus:ring-primary"
                            >
                                <option value="">请选择...</option>
                                {timeTables.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg"
                >
                    取消
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg disabled:opacity-50"
                >
                    {saving ? '保存中...' : '保存设置'}
                </button>
            </div>
        </Modal>
    );
}
