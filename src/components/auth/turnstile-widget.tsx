'use client';

import { useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
    onVerify: (token: string) => void;
}

export default function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
    const [enabled, setEnabled] = useState(false);
    const [siteKey, setSiteKey] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/turnstile-config')
            .then(res => res.json())
            .then(data => {
                if (data.enabled && data.siteKey) {
                    setEnabled(true);
                    setSiteKey(data.siteKey);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading || !enabled || !siteKey) {
        return null; // Don't render anything if disabled or loading
    }

    return (
        <div className="flex justify-center my-4">
            <Turnstile
                siteKey={siteKey}
                onSuccess={onVerify}
                options={{
                    theme: 'auto',
                }}
            />
        </div>
    );
}
