'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Schedule, TimeTable, Period } from '@/types';

interface ScheduleState {
    // 数据
    schedules: Schedule[];
    activeScheduleId: string | null;
    courses: Course[];
    timeTables: TimeTable[];
    periods: Period[];
    currentWeek: number;

    // Computed
    activeSchedule: Schedule | null;
    activeTimeTable: TimeTable | null;

    // Actions
    setSchedules: (schedules: Schedule[]) => void;
    setActiveSchedule: (id: string) => void;
    setCourses: (courses: Course[]) => void;
    setTimeTables: (timeTables: TimeTable[]) => void;
    setPeriods: (periods: Period[]) => void;

    addCourse: (course: Course) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    deleteCourse: (id: string) => void;

    setCurrentWeek: (week: number) => void;
    nextWeek: () => void;
    prevWeek: () => void;
    goToCurrentWeek: () => void;

    // 初始化
    initializeFromSchedule: (schedule: Schedule, courses: Course[], timeTables: TimeTable[]) => void;
}

export const useScheduleStore = create<ScheduleState>()(
    persist(
        (set, get) => ({
            // 初始状态
            schedules: [],
            activeScheduleId: null,
            courses: [],
            timeTables: [],
            periods: [],
            currentWeek: 1,

            // Computed getters (as properties updated when relevant data changes)
            get activeSchedule() {
                const state = get();
                return state.schedules.find(s => s.id === state.activeScheduleId) || null;
            },

            get activeTimeTable() {
                const state = get();
                const schedule = state.schedules.find(s => s.id === state.activeScheduleId);
                if (!schedule) return null;

                // 如果启用了自动切换，根据日期选择时间表
                if (schedule.enableAutoTimeTableSwitch) {
                    const now = new Date();
                    const matchingTable = state.timeTables.find(tt => {
                        if (tt.startDate && tt.endDate) {
                            return now >= new Date(tt.startDate) && now <= new Date(tt.endDate);
                        }
                        return false;
                    });
                    if (matchingTable) return matchingTable;

                    // 返回默认时间表
                    return state.timeTables.find(tt => tt.isDefault) || state.timeTables[0] || null;
                }

                // 手动模式：返回指定的时间表
                return state.timeTables.find(tt => tt.id === schedule.activeTimeTableId) ||
                    state.timeTables[0] || null;
            },

            // Actions
            setSchedules: (schedules) => set({ schedules }),

            setActiveSchedule: (id) => set({ activeScheduleId: id }),

            setCourses: (courses) => set({ courses }),

            setTimeTables: (timeTables) => set({ timeTables }),

            setPeriods: (periods) => set({ periods }),

            addCourse: (course) => set((state) => ({
                courses: [...state.courses, course]
            })),

            updateCourse: (id, updates) => set((state) => ({
                courses: state.courses.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                )
            })),

            deleteCourse: (id) => set((state) => ({
                courses: state.courses.filter(c => c.id !== id)
            })),

            setCurrentWeek: (week) => set({ currentWeek: week }),

            nextWeek: () => set((state) => {
                const schedule = state.schedules.find(s => s.id === state.activeScheduleId);
                const maxWeek = schedule?.totalWeeks || 20;
                return { currentWeek: Math.min(state.currentWeek + 1, maxWeek) };
            }),

            prevWeek: () => set((state) => ({
                currentWeek: Math.max(1, state.currentWeek - 1)
            })),

            goToCurrentWeek: () => set((state) => {
                const schedule = state.schedules.find(s => s.id === state.activeScheduleId);
                if (!schedule) return { currentWeek: 1 };

                const firstWeek = new Date(schedule.firstWeekStart);
                const now = new Date();
                const diffTime = now.getTime() - firstWeek.getTime();
                const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

                return {
                    currentWeek: Math.max(1, Math.min(diffWeeks, schedule.totalWeeks))
                };
            }),

            initializeFromSchedule: (schedule, courses, timeTables) => {
                const activeTimeTable = timeTables[0];
                set({
                    activeScheduleId: schedule.id,
                    courses,
                    timeTables,
                    periods: activeTimeTable?.periods || [],
                });
                // 跳转到当前周
                get().goToCurrentWeek();
            },
        }),
        {
            name: 'schedule-storage',
            partialize: (state) => ({
                activeScheduleId: state.activeScheduleId,
                currentWeek: state.currentWeek,
            }),
        }
    )
);
