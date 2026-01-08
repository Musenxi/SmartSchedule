// 设置相关类型定义

export interface Settings {
    id: string;
    userId: string;
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
}

export interface SettingsInput {
    useSolidBackground?: boolean;
    backgroundImage?: string | null;
    headerColor?: string;
    showGridLines?: boolean;
    showPeriodTime?: boolean;
    showSaturday?: boolean;
    showSunday?: boolean;
    showNonCurrentWeek?: boolean;
    courseCornerRadius?: number;
    courseTextColor?: string;
    periodHeight?: number;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
}

// 默认设置值
export const defaultSettings: Omit<Settings, 'id' | 'userId'> = {
    useSolidBackground: true,
    backgroundImage: null,
    headerColor: '#f5f5f5',
    showGridLines: true,
    showPeriodTime: true,
    showSaturday: true,
    showSunday: true,
    showNonCurrentWeek: true,
    courseCornerRadius: 8,
    courseTextColor: '#ffffff',
    periodHeight: 47,
    theme: 'system',
    language: 'zh-CN',
};
