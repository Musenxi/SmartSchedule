'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface CustomTimePickerProps {
    label?: string;
    value: string; // "HH:mm" format
    onChange: (value: string) => void;
    className?: string;
}

export function CustomTimePicker({ label, value, onChange, className }: CustomTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, minute] = value.split(':').map(Number);

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);
    const scrollTimeoutHourRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutMinuteRef = useRef<NodeJS.Timeout | null>(null);

    const ITEM_HEIGHT = 36;
    const VISIBLE_ITEMS = 5;
    const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const PADDING_HEIGHT = ITEM_HEIGHT * 2; // Top and bottom padding

    // Initialize scroll position when opened (center the selected item)
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                if (hourRef.current) {
                    hourRef.current.scrollTop = hour * ITEM_HEIGHT;
                }
                if (minuteRef.current) {
                    minuteRef.current.scrollTop = minute * ITEM_HEIGHT;
                }
            });
        }
    }, [isOpen]);

    const handleHourScrollEnd = () => {
        if (!hourRef.current) return;
        const scrollTop = hourRef.current.scrollTop;
        const selectedIndex = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(23, selectedIndex));

        // Snap to position
        hourRef.current.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });

        if (clampedIndex !== hour) {
            onChange(`${String(clampedIndex).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    };

    const handleMinuteScrollEnd = () => {
        if (!minuteRef.current) return;
        const scrollTop = minuteRef.current.scrollTop;
        const selectedIndex = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(59, selectedIndex));

        // Snap to position
        minuteRef.current.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });

        if (clampedIndex !== minute) {
            onChange(`${String(hour).padStart(2, '0')}:${String(clampedIndex).padStart(2, '0')}`);
        }
    };

    const handleHourScroll = () => {
        if (scrollTimeoutHourRef.current) {
            clearTimeout(scrollTimeoutHourRef.current);
        }
        scrollTimeoutHourRef.current = setTimeout(handleHourScrollEnd, 150);
    };

    const handleMinuteScroll = () => {
        if (scrollTimeoutMinuteRef.current) {
            clearTimeout(scrollTimeoutMinuteRef.current);
        }
        scrollTimeoutMinuteRef.current = setTimeout(handleMinuteScrollEnd, 150);
    };

    const selectHour = (h: number) => {
        onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        if (hourRef.current) {
            hourRef.current.scrollTo({ top: h * ITEM_HEIGHT, behavior: 'smooth' });
        }
    };

    const selectMinute = (m: number) => {
        onChange(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        if (minuteRef.current) {
            minuteRef.current.scrollTo({ top: m * ITEM_HEIGHT, behavior: 'smooth' });
        }
    };

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
            )}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full px-3 py-2 bg-background border border-input rounded-lg",
                            "focus:ring-2 focus:ring-ring focus:border-input outline-none",
                            "text-foreground text-left flex items-center gap-2",
                            "hover:bg-muted/50 transition-colors"
                        )}
                    >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium tabular-nums">
                            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 border border-border shadow-lg bg-card rounded-xl overflow-hidden"
                    align="start"
                    sideOffset={8}
                >
                    <div className="flex">
                        {/* Hours Column */}
                        <div
                            ref={hourRef}
                            className="w-14 overflow-y-auto custom-scrollbar"
                            onScroll={handleHourScroll}
                            style={{ height: CONTAINER_HEIGHT }}
                        >
                            {/* Top padding for centering */}
                            <div style={{ height: ITEM_HEIGHT * 2 }} />
                            {hours.map((h) => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => selectHour(h)}
                                    className={cn(
                                        "w-full text-center text-sm font-medium transition-colors",
                                        h === hour
                                            ? "text-primary font-bold text-base"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    style={{ height: ITEM_HEIGHT, lineHeight: `${ITEM_HEIGHT}px` }}
                                >
                                    {String(h).padStart(2, '0')}
                                </button>
                            ))}
                            {/* Bottom padding for centering */}
                            <div style={{ height: ITEM_HEIGHT * 2 }} />
                        </div>

                        {/* Minutes Column */}
                        <div
                            ref={minuteRef}
                            className="w-14 overflow-y-auto custom-scrollbar"
                            onScroll={handleMinuteScroll}
                            style={{ height: CONTAINER_HEIGHT }}
                        >
                            {/* Top padding for centering */}
                            <div style={{ height: ITEM_HEIGHT * 2 }} />
                            {minutes.map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => selectMinute(m)}
                                    className={cn(
                                        "w-full text-center text-sm font-medium transition-colors",
                                        m === minute
                                            ? "text-primary font-bold text-base"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    style={{ height: ITEM_HEIGHT, lineHeight: `${ITEM_HEIGHT}px` }}
                                >
                                    {String(m).padStart(2, '0')}
                                </button>
                            ))}
                            {/* Bottom padding for centering */}
                            <div style={{ height: ITEM_HEIGHT * 2 }} />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t border-border p-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                const newHour = now.getHours();
                                const newMinute = now.getMinutes();
                                onChange(`${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`);
                                setTimeout(() => {
                                    if (hourRef.current) {
                                        hourRef.current.scrollTo({ top: newHour * ITEM_HEIGHT, behavior: 'smooth' });
                                    }
                                    if (minuteRef.current) {
                                        minuteRef.current.scrollTo({ top: newMinute * ITEM_HEIGHT, behavior: 'smooth' });
                                    }
                                }, 10);
                            }}
                            className="flex-1 py-1.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
                        >
                            现在
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
                        >
                            确定
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
