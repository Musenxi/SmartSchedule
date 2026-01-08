'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingsInput } from '@/types/settings';

export function useSettings() {
    const { updateSettings } = useSettingsStore();
    const queryClient = useQueryClient();

    // 获取设置
    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await fetch('/api/settings');
            if (!res.ok) throw new Error('Failed to fetch settings');
            const data = await res.json();

            // 同步到 Zustand store
            updateSettings(data);

            return data;
        },
    });

    // 更新设置
    const mutation = useMutation({
        mutationFn: async (newSettings: SettingsInput) => {
            // 乐观更新 Zustand store
            updateSettings(newSettings);

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSettings),
            });

            if (!res.ok) throw new Error('Failed to update settings');
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings'], data);
        },
        onError: (err, newSettings, context) => {
            // 错误回滚逻辑可以这里实现，或者使用 queryClient.invalidateQueries
            queryClient.invalidateQueries({ queryKey: ['settings'] });
        },
    });

    return {
        settings,
        isLoading,
        error,
        updateSettings: mutation.mutate,
        isUpdating: mutation.isPending,
    };
}
