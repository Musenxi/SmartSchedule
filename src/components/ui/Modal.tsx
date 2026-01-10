'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// Global counter to track open modals
let openModalCount = 0;
let savedScrollY = 0;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    hasBackdrop?: boolean;
    className?: string; // For content wrapper
    zIndex?: number;
    disableAnimation?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    hasBackdrop = true,
    className,
    zIndex = 50,
    disableAnimation = false
}: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            openModalCount++;
            // Only lock scroll on first modal
            if (openModalCount === 1) {
                savedScrollY = window.scrollY;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${savedScrollY}px`;
                document.body.style.left = '0';
                document.body.style.right = '0';
                document.body.style.overflow = 'hidden';
                document.body.style.touchAction = 'none';
            }
        }

        return () => {
            if (isOpen) {
                openModalCount--;
                // Only unlock scroll when all modals are closed
                if (openModalCount === 0) {
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.left = '';
                    document.body.style.right = '';
                    document.body.style.overflow = '';
                    document.body.style.touchAction = '';
                    window.scrollTo(0, savedScrollY);
                }
            }
        };
    }, [isOpen]);

    // Prevent scroll on backdrop only
    useEffect(() => {
        if (!isOpen) return;

        const backdrop = backdropRef.current;
        if (!backdrop) return;

        const preventScroll = (e: Event) => {
            // Only prevent if the event target is the backdrop itself, not children
            if (e.target === backdrop) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        backdrop.addEventListener('wheel', preventScroll, { passive: false });
        backdrop.addEventListener('touchmove', preventScroll, { passive: false });

        return () => {
            backdrop.removeEventListener('wheel', preventScroll);
            backdrop.removeEventListener('touchmove', preventScroll);
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            ref={backdropRef}
            className={cn(
                "fixed inset-0 flex items-center justify-center p-4",
                !disableAnimation && "animate-in fade-in duration-200",
                hasBackdrop ? "bg-black/40 backdrop-blur-md" : "bg-transparent",
            )}
            style={{ zIndex, touchAction: 'none' }}
            onClick={onClose}
        >
            <div
                data-modal-content
                className={cn(
                    "w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]",
                    !disableAnimation && "animate-in zoom-in-95 duration-200",
                    className
                )}
                onClick={e => e.stopPropagation()}
                onWheel={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}
