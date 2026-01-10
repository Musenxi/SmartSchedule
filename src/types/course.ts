// 课程相关类型定义

export interface Course {
    id: string;
    scheduleId: string;
    name: string;
    color: string;
    credits?: number | null;
    note?: string | null;
    times: CourseTime[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CourseTime {
    id: string;
    courseId: string;
    dayOfWeek: number; // 1-7, 1=周一
    startPeriod: number;
    endPeriod: number;
    weekRange: string; // "1-16" 或 "1,3,5,7-10"
    teacher?: string | null;
    location?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    specificDate?: string | null; // YYYY-MM-DD format
    specificDates?: string[]; // Array of YYYY-MM-DD
}

export interface CourseInput {
    name: string;
    color?: string;
    credits?: number;
    note?: string;
    times: CourseTimeInput[];
}

export interface CourseTimeInput {
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    teacher?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    specificDate?: string;
    specificDates?: string[];
}

// PDF识别结果
export interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    color?: string;
    credits?: number;
    confidence?: number; // 识别置信度 0-1
}
