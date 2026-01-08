'use client';

import { create } from 'zustand';
import { Task, TaskFilter, TaskType } from '@/types';

interface TaskState {
    tasks: Task[];
    filter: TaskFilter;

    // Actions
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    toggleComplete: (id: string) => void;
    setFilter: (filter: TaskFilter) => void;

    // Computed
    filteredTasks: () => Task[];
    todayTasks: () => Task[];
    weekTasks: () => Task[];
    upcomingTasks: () => Task[];
}

export const useTaskStore = create<TaskState>()((set, get) => ({
    tasks: [],
    filter: {},

    setTasks: (tasks) => set({ tasks }),

    addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task]
    })),

    updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t =>
            t.id === id ? { ...t, ...updates } : t
        )
    })),

    deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
    })),

    toggleComplete: (id) => set((state) => ({
        tasks: state.tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        )
    })),

    setFilter: (filter) => set({ filter }),

    filteredTasks: () => {
        const { tasks, filter } = get();
        return tasks.filter(task => {
            if (filter.type && task.type !== filter.type) return false;
            if (filter.completed !== undefined && task.completed !== filter.completed) return false;
            if (filter.courseId && task.courseId !== filter.courseId) return false;
            if (filter.startDate && task.dueDate && new Date(task.dueDate) < filter.startDate) return false;
            if (filter.endDate && task.dueDate && new Date(task.dueDate) > filter.endDate) return false;
            return true;
        });
    },

    todayTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < tomorrow;
        }).sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            return 0;
        });
    },

    weekTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < weekEnd;
        }).sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            return 0;
        });
    },

    upcomingTasks: () => {
        const { tasks } = get();
        const now = new Date();

        return tasks
            .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) > now)
            .sort((a, b) => {
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }
                return 0;
            })
            .slice(0, 10);
    },
}));
