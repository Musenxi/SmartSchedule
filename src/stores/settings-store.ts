'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSettings } from '@/types/settings';

interface SettingsState {
    // 外观设置
    useSolidBackground: boolean;
    backgroundImage: string | null;
    headerColor: string;
    showGridLines: boolean;
    showPeriodTime: boolean;
    showSaturday: boolean;
    showSunday: boolean;
    showNonCurrentWeek: boolean;
    courseCornerRadius: number;
    courseTextColor: string;
    periodHeight: number;

    // 通用设置
    theme: 'light' | 'dark' | 'system';
    language: string;

    // Actions
    updateSettings: (settings: Partial<SettingsState>) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // 初始值
            ...defaultSettings,

            updateSettings: (settings) => set((state) => ({
                ...state,
                ...settings,
            })),

            resetSettings: () => set({
                ...defaultSettings,
            }),
        }),
        {
            name: 'settings-storage',
        }
    )
);
