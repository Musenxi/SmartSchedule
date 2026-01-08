// 任务相关类型定义

export type TaskType = 'HOMEWORK' | 'EXAM' | 'EVENT' | 'CUSTOM';

export interface Task {
    id: string;
    userId: string;
    courseId?: string | null;
    type: TaskType;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    location?: string | null;
    completed: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
    course?: {
        id: string;
        name: string;
        color: string;
    } | null;
}

export interface TaskInput {
    courseId?: string;
    type: TaskType;
    title: string;
    description?: string;
    dueDate?: string; // ISO date string
    location?: string;
    priority?: number;
}

export interface TaskFilter {
    type?: TaskType;
    completed?: boolean;
    courseId?: string;
    startDate?: Date;
    endDate?: Date;
}
