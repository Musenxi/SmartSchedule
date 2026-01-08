'use client';

import { create } from 'zustand';
import { ScheduleViewType } from '@/types';

interface UIState {
    // 视图状态
    scheduleView: ScheduleViewType;
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;

    // 弹窗状态
    courseModalOpen: boolean;
    editingCourseId: string | null;
    taskModalOpen: boolean;
    editingTaskId: string | null;
    uploadModalOpen: boolean;
    settingsModalOpen: boolean;

    // Actions
    setScheduleView: (view: ScheduleViewType) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (open: boolean) => void;

    // Course Modal
    openCourseModal: (courseId?: string) => void;
    closeCourseModal: () => void;

    // Task Modal
    openTaskModal: (taskId?: string) => void;
    closeTaskModal: () => void;

    // Upload Modal
    openUploadModal: () => void;
    closeUploadModal: () => void;

    // Settings Modal
    openSettingsModal: () => void;
    closeSettingsModal: () => void;

    // Close all modals
    closeAllModals: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
    // 初始状态
    scheduleView: 'week',
    sidebarOpen: true,
    mobileMenuOpen: false,

    courseModalOpen: false,
    editingCourseId: null,
    taskModalOpen: false,
    editingTaskId: null,
    uploadModalOpen: false,
    settingsModalOpen: false,

    // Actions
    setScheduleView: (view) => set({ scheduleView: view }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
    setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

    openCourseModal: (courseId) => set({
        courseModalOpen: true,
        editingCourseId: courseId || null
    }),
    closeCourseModal: () => set({
        courseModalOpen: false,
        editingCourseId: null
    }),

    openTaskModal: (taskId) => set({
        taskModalOpen: true,
        editingTaskId: taskId || null
    }),
    closeTaskModal: () => set({
        taskModalOpen: false,
        editingTaskId: null
    }),

    openUploadModal: () => set({ uploadModalOpen: true }),
    closeUploadModal: () => set({ uploadModalOpen: false }),

    openSettingsModal: () => set({ settingsModalOpen: true }),
    closeSettingsModal: () => set({ settingsModalOpen: false }),

    closeAllModals: () => set({
        courseModalOpen: false,
        editingCourseId: null,
        taskModalOpen: false,
        editingTaskId: null,
        uploadModalOpen: false,
        settingsModalOpen: false,
    }),
}));
