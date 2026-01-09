'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

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

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            // Only unlock if we are top-level or if explicit
            // Simple approach: unlock when closed. 
            // If multiple modals are stacked, the underlying one might need to keep it locked.
            // But since we use Portals, they are independent. 
            // If we close the top one, the bottom one is still open? 
            // Actually, if we close top one, we just remove it.
            // We should check if any OTHER modals are open? Too complex for now.
            // Let's stick to simple unlock. If underlying modal is open, it should re-lock?
            // No, React useEffect cleanups might run in order.
            // Better: Don't unlock if another modal is present?
            // For now, let's just unlock. If issues arise with background scrolling, we'll refine.
            document.body.style.overflow = '';
        }
        return () => {
            // Clean up
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 flex items-center justify-center p-4",
                !disableAnimation && "animate-in fade-in duration-200",
                hasBackdrop ? "bg-black/40 backdrop-blur-md" : "bg-transparent", // Unified frosted glass style
                // If nested, we might want transparent backing, but Portal moves it to root.
                // So transparent backing makes sense if we want to see the modal below.
                // If hasBackdrop is false, we just show content.
                // NOTE: If hasBackdrop is false, we still need a wrapper to center content?
                // Yes, standard modal behavior.
            )}
            style={{ zIndex }}
            onClick={onClose}
        >
            <div
                className={cn(
                    "w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]",
                    !disableAnimation && "animate-in zoom-in-95 duration-200",
                    className
                )}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}
