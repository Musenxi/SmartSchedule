'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CustomCalendarProps {
    selectedDate?: Date;
    onSelect: (date: Date) => void;
    className?: string;
}

export function CustomCalendar({ selectedDate, onSelect, className }: CustomCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(selectedDate);
        }
    }, [selectedDate]);

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDay = startOfWeek(firstDay, { weekStartsOn: 1 });

        const days: Date[] = [];
        let current = startDay;
        while (days.length < 42) {
            days.push(new Date(current));
            current = addDays(current, 1);
        }
        return days;
    };

    const days = generateCalendarDays();
    const today = new Date();

    return (
        <div className={cn("w-[230px] p-2", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)); }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium">
                    {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
                </span>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)); }}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                    <div key={day} className="text-center text-[10px] text-muted-foreground py-0.5">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isToday = day.toDateString() === today.toDateString();
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelect(day); }}
                            className={cn(
                                "w-full aspect-square rounded-md text-xs font-medium transition-all flex items-center justify-center",
                                !isCurrentMonth && "text-muted-foreground/40",
                                isCurrentMonth && "text-foreground hover:bg-muted",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                !isSelected && isToday && "bg-secondary text-secondary-foreground"
                            )}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-border">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        const now = new Date();
                        onSelect(now);
                        setCurrentMonth(now);
                    }}
                    className="w-full py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                >
                    跳转到今天
                </button>
            </div>
        </div>
    );
}
