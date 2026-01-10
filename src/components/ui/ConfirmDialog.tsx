'use client';

import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
    showCancel?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    variant = 'default',
    showCancel = true
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPortal>
                {/* Custom Overlay with higher z-index */}
                <DialogPrimitive.Overlay
                    className={cn(
                        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/50"
                    )}
                />
                {/* Custom Content with higher z-index */}
                <DialogPrimitive.Content
                    className={cn(
                        "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[100] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-md"
                    )}
                >
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            {variant === 'destructive' && (
                                <div className="p-2 bg-destructive/10 rounded-full">
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                </div>
                            )}
                            <DialogTitle>{title}</DialogTitle>
                        </div>
                        <DialogDescription className="text-left pt-2 whitespace-pre-line">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {showCancel && (
                            <button
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${variant === 'destructive'
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </DialogFooter>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
