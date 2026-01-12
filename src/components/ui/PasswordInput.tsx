'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {

}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);

        return (
            <div className="relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                        "w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-input transition-all outline-none text-foreground placeholder:text-muted-foreground pr-10",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                    ) : (
                        <Eye className="w-4 h-4" />
                    )}
                </button>
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';
