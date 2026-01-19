'use client';

import React, { useState, useEffect } from 'react';
import { WidgetCard } from './WidgetCard';

const variants = ['dual', 'single', 'tomorrow', 'empty'] as const;
type Variant = typeof variants[number];

export function WidgetPreview() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Auto-rotate every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % variants.length);
                setIsTransitioning(false);
            }, 300);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleDotClick = (index: number) => {
        if (index !== currentIndex) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
            }, 300);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Widget Display */}
            <div
                className="transition-opacity duration-300"
                style={{ opacity: isTransitioning ? 0 : 1 }}
            >
                <WidgetCard variant={variants[currentIndex]} />
            </div>

            {/* Indicators */}
            <div className="flex gap-2">
                {variants.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                ? 'bg-primary w-6'
                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                        aria-label={`切换到样式 ${index + 1}`}
                    />
                ))}
            </div>

            {/* Labels */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    {currentIndex === 0 && '双视图 - 当前课程 + 接下来'}
                    {currentIndex === 1 && '单视图 - 接下来课程'}
                    {currentIndex === 2 && '明天视图'}
                    {currentIndex === 3 && '空闲状态'}
                </p>
            </div>
        </div>
    );
}
