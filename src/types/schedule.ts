// 课表相关类型定义

export interface Schedule {
    id: string;
    userId: string;
    name: string;
    firstWeekStart: Date;
    weekStartDay: number; // 1=周一, 7=周日
    totalWeeks: number;
    periodsPerDay: number;
    isActive: boolean;
    enableAutoTimeTableSwitch: boolean;
    activeTimeTableId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    // 可选的关联数据（从 API 响应获取时存在）
    courses?: import('./course').Course[];
}

// 保持向后兼容
export interface ScheduleWithRelations extends Schedule {
    courses: import('./course').Course[];
}

export interface ScheduleInput {
    name: string;
    firstWeekStart: string; // ISO date string
    weekStartDay?: number;
    totalWeeks?: number;
    periodsPerDay?: number;
    enableAutoTimeTableSwitch?: boolean;
}

export interface TimeTable {
    id: string;
    userId: string;
    name: string;
    sameDuration: boolean;
    duration?: number | null;
    isDefault: boolean;
    periods: Period[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TimeTableInput {
    name: string;
    sameDuration?: boolean;
    startDate?: string;
    endDate?: string;
    isDefault?: boolean;
    periods: PeriodInput[];
}

export interface Period {
    id: string;
    timeTableId: string;
    number: number;
    startTime: string; // "08:00"
    endTime: string; // "08:45"
}

export interface PeriodInput {
    number: number;
    startTime: string;
    endTime: string;
}

// 课表视图类型
export type ScheduleViewType = 'week' | 'day' | 'month';
