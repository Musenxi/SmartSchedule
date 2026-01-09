'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WeekView, ScheduleToolbar } from '@/components/schedule';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { TaskPanel } from '@/components/tasks/TaskPanel';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditCourseModal } from '@/components/schedule/EditCourseModal';
import { CourseDetailModal } from '@/components/schedule/CourseDetailModal';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import { Course, Period, Schedule, CourseTime } from '@/types';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/use-tasks';
import { getCurrentWeek, getWeekDates, isWeekInRange } from '@/lib/date-utils';
import { LogOut, Settings, GripVertical, CalendarDays, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDay, getHours, getMinutes, parseISO } from 'date-fns';
import { ScheduleManagerModal } from '@/components/schedule/ScheduleManagerModal';

interface ScheduleData extends Schedule {
  courses: Course[];
}

export default function SchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [allSchedules, setAllSchedules] = useState<ScheduleData[]>([]);
  const [globalTimeTables, setGlobalTimeTables] = useState<import('@/types').TimeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);

  // 移动端视图状态 ('schedule' | 'tasks')
  const [mobileView, setMobileView] = useState<'schedule' | 'tasks'>('schedule');

  // 侧边栏宽度状态
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Schedule Management State
  const [isScheduleManagerOpen, setIsScheduleManagerOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 检测触屏设备
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };
    checkTouchDevice();
  }, []);

  const settings = useSettingsStore();
  const { openSettingsModal } = useUIStore();

  const { tasks, updateTask } = useTasks();

  // 任务编辑相关
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 课程编辑相关
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);

  // Derive selectedCourse from schedule.courses for fresh data
  const selectedCourse = useMemo(() => {
    if (!selectedCourseId || !schedule?.courses) return null;
    return schedule.courses.find(c => c.id === selectedCourseId) || null;
  }, [selectedCourseId, schedule?.courses]);

  const handleCourseClick = (course: Course, time?: CourseTime) => {
    if (course.id.startsWith('task-')) {
      // 是任务（考试/活动）：打开任务编辑
      const taskId = course.id.replace('task-', '');
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setEditingTask(task);
        setIsTaskModalOpen(true);
      }
    } else {
      // 是普通课程：打开课程详情
      setSelectedCourseId(course.id);
      // Find the index of the clicked time slot
      if (time) {
        const timeIndex = course.times.findIndex(t => t.id === time.id);
        setSelectedTimeIndex(timeIndex >= 0 ? timeIndex : 0);
      } else {
        setSelectedTimeIndex(0);
      }
      setIsCourseDetailOpen(true);
    }
  };

  const handleEditFromDetail = () => {
    if (selectedCourse) {
      setEditingCourse(selectedCourse);
      setIsCourseModalOpen(true);
      setIsCourseDetailOpen(false);
    }
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false);
    setEditingCourse(null);
  };

  const handleCloseDetailModal = () => {
    setIsCourseDetailOpen(false);
    setSelectedCourseId(null);
  };

  // 处理拖拽
  const [isSnapped, setIsSnapped] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    setIsSnapped(false);
  }, []);

  const resize = useCallback((clientX: number) => {
    if (isResizing) {
      const totalWidth = window.innerWidth;
      const minWidth = totalWidth * 0.3;
      const maxWidth = totalWidth * 0.7;
      const centerWidth = totalWidth * 0.5;
      const snapThreshold = 40; // pixels within which to snap to center

      let newWidth = totalWidth - clientX;

      // Snap to center when within threshold
      const nearCenter = Math.abs(newWidth - centerWidth) < snapThreshold;
      if (nearCenter) {
        newWidth = centerWidth;
        if (!isSnapped) {
          setIsSnapped(true);
          // Haptic feedback for browsers that support it
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
        }
      } else {
        if (isSnapped) {
          setIsSnapped(false);
        }
      }

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    }
  }, [isResizing, isSnapped]);

  // Mouse event handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    resize(e.clientX);
  }, [resize]);

  // Touch event handler  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      resize(e.touches[0].clientX);
    }
  }, [resize]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", stopResizing);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopResizing);
    };
  }, [handleMouseMove, handleTouchMove, stopResizing]);

  // 加载保存的布局
  useEffect(() => {
    const savedWidth = localStorage.getItem('layout-panel-width');
    if (savedWidth) {
      const width = parseInt(savedWidth);
      if (!isNaN(width)) {
        const totalWidth = window.innerWidth;
        const minWidth = totalWidth * 0.3;
        const maxWidth = totalWidth * 0.7;
        // 确保在 30% - 70% 范围内
        const clampedWidth = Math.max(minWidth, Math.min(width, maxWidth));
        setPanelWidth(clampedWidth);
      }
    }
  }, []);

  // 保存布局
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('layout-panel-width', panelWidth.toString());
    }
  }, [isResizing, panelWidth]);

  // 计算真实的当前周
  const realCurrentWeek = useMemo(() => {
    if (!schedule) return 1;
    const week = getCurrentWeek(new Date(schedule.firstWeekStart));
    return Math.min(Math.max(1, week), schedule.totalWeeks);
  }, [schedule]);

  // 将任务转换为课程对象
  const taskCourses = useMemo(() => {
    if (!tasks || !schedule || globalTimeTables.length === 0) return [];

    const activeTimeTable = globalTimeTables.find(t => t.id === schedule.activeTimeTableId)
      || globalTimeTables.find(t => t.isDefault)
      || globalTimeTables[0];
    const timeTablePeriods = activeTimeTable?.periods || [];

    const findPeriodByTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const timeValue = h * 60 + m;

      for (const p of timeTablePeriods) {
        const [sh, sm] = p.startTime.split(':').map(Number);
        const [eh, em] = p.endTime.split(':').map(Number);
        const startVal = sh * 60 + sm;
        const endVal = eh * 60 + em;

        if (timeValue >= startVal && timeValue < endVal) {
          return p.number;
        }
      }

      for (const p of timeTablePeriods) {
        const [sh, sm] = p.startTime.split(':').map(Number);
        const startVal = sh * 60 + sm;
        if (timeValue <= startVal) return p.number;
      }

      return timeTablePeriods[timeTablePeriods.length - 1].number;
    };

    return tasks
      .filter(t => t.showInSchedule && (t.type === 'EXAM' || t.type === 'EVENT') && t.startTime && t.dueDate)
      .map(t => {
        const start = typeof t.startTime === 'string' ? parseISO(t.startTime) : t.startTime!;
        const end = typeof t.dueDate === 'string' ? parseISO(t.dueDate) : t.dueDate!;
        const week = getCurrentWeek(new Date(schedule.firstWeekStart), start);
        let dayOfWeek = getDay(start);
        if (dayOfWeek === 0) dayOfWeek = 7;

        const startStr = `${String(getHours(start)).padStart(2, '0')}:${String(getMinutes(start)).padStart(2, '0')}`;
        const endStr = `${String(getHours(end)).padStart(2, '0')}:${String(getMinutes(end)).padStart(2, '0')}`;
        const startPeriod = findPeriodByTime(startStr);
        const endPeriod = findPeriodByTime(endStr);

        return {
          id: `task-${t.id}`,
          scheduleId: schedule.id,
          name: t.title,
          color: t.type === 'EXAM' ? '#ef4444' : '#f59e0b',
          times: [{
            id: `task-time-${t.id}`,
            courseId: `task-${t.id}`,
            dayOfWeek,
            startPeriod,
            endPeriod: Math.max(startPeriod, endPeriod),
            weekRange: String(week),
            location: t.location || '',
            teacher: t.type === 'EXAM' ? '考试' : '活动'
          }] as any[],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Course;
      });
  }, [tasks, schedule]);

  const allCourses = useMemo(() => {
    if (!schedule) return [];
    return [...schedule.courses, ...taskCourses];
  }, [schedule, taskCourses]);

  // 获取课表数据
  const fetchSchedule = useCallback(async (preserveWeek = false, targetScheduleId?: string) => {
    try {
      const res = await fetch('/api/schedules', { cache: 'no-store' });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error('获取课表失败');
      }

      const schedules = await res.json();
      setAllSchedules(schedules);

      if (schedules.length > 0) {
        let targetSchedule;
        if (targetScheduleId) {
          targetSchedule = schedules.find((s: ScheduleData) => s.id === targetScheduleId);
        }
        if (!targetSchedule) {
          targetSchedule = schedules.find((s: ScheduleData) => s.isActive) || schedules[0];
        }

        setSchedule(targetSchedule);
        if (!preserveWeek) {
          const week = getCurrentWeek(new Date(targetSchedule.firstWeekStart));
          setCurrentWeek(Math.min(Math.max(1, week), targetSchedule.totalWeeks));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 获取全局时间表
  const fetchTimeTables = useCallback(async () => {
    try {
      const res = await fetch('/api/timetables', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setGlobalTimeTables(data);
      }
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
    }
  }, []);

  const handleScheduleChange = useCallback(async (scheduleId: string) => {
    try {
      // 1. Optimistic update (optional, but fetchSchedule will handle UI)

      // 2. Persist active state to backend
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!res.ok) throw new Error('Failed to switch schedule');

      // 3. Refresh all data to reflect the new active state (server handles deactivating others)
      fetchSchedule(false, scheduleId);
    } catch (error) {
      console.error('Switch schedule error:', error);
      // Fallback: just try to load it anyway for viewing
      fetchSchedule(false, scheduleId);
    }
  }, [fetchSchedule]);

  const handleEditSchedule = (scheduleId: string) => {
    const target = allSchedules.find(s => s.id === scheduleId);
    if (target) {
      setEditingSchedule(target);
      setIsScheduleManagerOpen(true);
    }
  };

  const handleUpdateSchedule = async (id: string, data: Partial<Schedule>) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Update failed');

      await fetchSchedule(true, id); // Refresh data with correct schedule ID
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error; // Re-throw for modal to handle
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      await fetchSchedule();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchTimeTables();
  }, [fetchSchedule, fetchTimeTables]);

  const periods = useMemo(() => {
    if (globalTimeTables.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        id: `default-${i + 1}`,
        timeTableId: 'default',
        number: i + 1,
        startTime: `${8 + Math.floor(i * 0.75)}:${(i % 2) * 30 || '00'}`,
        endTime: `${8 + Math.floor((i + 1) * 0.75)}:${((i + 1) % 2) * 30 || '00'}`,
      }));
    }

    // Find active time table for current schedule
    const activeTimeTable = globalTimeTables.find(t => t.id === schedule?.activeTimeTableId)
      || globalTimeTables.find(t => t.isDefault)
      || globalTimeTables[0];

    return activeTimeTable?.periods || [];
  }, [globalTimeTables, schedule?.activeTimeTableId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDateSelect = (date: Date) => {
    if (!schedule) return;
    const week = getCurrentWeek(new Date(schedule.firstWeekStart), date);
    const boundedWeek = Math.min(Math.max(1, week), schedule.totalWeeks);
    setCurrentWeek(boundedWeek);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-destructive mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">重试</button>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">欢迎使用 SmartSchedule</h2>
          <p className="text-muted-foreground">还没有课表，立即创建或导入一个吧</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/import')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            导入课表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden select-none overscroll-none">
      {/* 主体内容区域 - 移动端增加底部 padding 防止被导航栏遮挡 */}
      <div className="flex flex-1 overflow-hidden relative md:pb-0 pb-[60px]">
        {/* 左侧：课程表 */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-transform duration-300 md:transform-none bg-background",
          mobileView === 'schedule' ? 'flex' : 'hidden md:flex'
        )}>
          <ScheduleToolbar
            currentWeek={currentWeek}
            realCurrentWeek={realCurrentWeek}
            totalWeeks={schedule.totalWeeks}
            scheduleName={schedule.name}
            schedules={allSchedules.map(s => ({ id: s.id, name: s.name, isActive: s.isActive }))}
            currentScheduleId={schedule.id}
            onPrevWeek={() => setCurrentWeek(w => Math.max(1, w - 1))}
            onNextWeek={() => setCurrentWeek(w => Math.min(schedule.totalWeeks, w + 1))}
            onGoToWeek={(week) => setCurrentWeek(week)}
            onDateSelect={handleDateSelect}
            onScheduleChange={handleScheduleChange}
            onEditSchedule={handleEditSchedule}
          />
          <div className="flex-1 overflow-hidden relative bg-card/30">
            <WeekView
              courses={allCourses}
              periods={periods}
              currentWeek={currentWeek}
              firstWeekStart={new Date(schedule.firstWeekStart)}
              showGridLines={settings.showGridLines}
              showPeriodTime={settings.showPeriodTime}
              showSaturday={settings.showSaturday}
              showSunday={settings.showSunday}
              showNonCurrentWeek={settings.showNonCurrentWeek}
              periodHeight={settings.periodHeight}
              courseCornerRadius={settings.courseCornerRadius}
              onCourseClick={handleCourseClick}
              onSwipeLeft={() => setCurrentWeek(w => Math.min(schedule.totalWeeks, w + 1))}
              onSwipeRight={() => setCurrentWeek(w => Math.max(1, w - 1))}
            />
          </div>
        </div>

        {/* 拖拽手柄 (仅桌面端显示) */}
        <div
          ref={resizeRef}
          className={cn(
            "hidden md:flex cursor-col-resize flex-col items-center justify-center z-20 transition-all duration-150 touch-none",
            isTouchDevice ? "w-4" : "w-1.5",
            isSnapped
              ? "bg-primary shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-x-150"
              : isResizing
                ? "bg-primary/80"
                : "bg-border hover:bg-primary/50"
          )}
          onMouseDown={startResizing}
          onTouchStart={startResizing}
        >
          <div className={cn(
            "h-10 w-1 rounded-full flex items-center justify-center transition-all duration-150",
            isSnapped ? "bg-primary-foreground/50 scale-110" : "bg-muted-foreground/30"
          )}>
            <GripVertical className={cn(
              "w-3 h-3 transition-opacity duration-150",
              isSnapped ? "text-primary-foreground opacity-80" : "text-muted-foreground opacity-50"
            )} />
          </div>
        </div>

        {/* 右侧：任务面板 */}
        <div
          className={cn(
            "border-l border-border bg-card/30 flex-shrink-0 relative overflow-hidden",
            mobileView === 'tasks' ? 'flex w-full' : 'hidden md:flex' // md:flex 恢复侧边栏
          )}
          style={{
            ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { width: panelWidth } : {})
          }}
        >
          {/* 遮罩层 */}
          {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
          <div className="w-full h-full flex flex-col">
            <TaskPanel />
          </div>
        </div>
      </div>

      {/* 底部导航栏 (仅移动端显示) - 固定到底部 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm pb-safe h-[60px]">
        <button
          onClick={() => setMobileView('schedule')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 hover:bg-muted/50 transition-colors",
            mobileView === 'schedule' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-medium">课程表</span>
        </button>

        <button
          onClick={() => setMobileView('tasks')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 hover:bg-muted/50 transition-colors",
            mobileView === 'tasks' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px] font-medium">任务</span>
        </button>

        <button
          onClick={openSettingsModal}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 hover:bg-muted/50 text-muted-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </div>

      <SettingsModal
        currentSchedule={schedule || undefined}
        timeTables={globalTimeTables}
        onScheduleUpdate={handleUpdateSchedule}
        onTimeTablesRefresh={fetchTimeTables}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        initialData={editingTask || undefined}
        onSubmit={async (taskInput) => {
          if (editingTask) {
            await updateTask({ id: editingTask.id, updates: taskInput });
          }
        }}
      />

      {selectedCourse && (
        <CourseDetailModal
          isOpen={isCourseDetailOpen}
          onClose={handleCloseDetailModal}
          course={selectedCourse}
          onEdit={handleEditFromDetail}
          periods={periods}
          currentWeek={currentWeek}
          selectedTimeIndex={selectedTimeIndex}
          onRefresh={() => fetchSchedule(true)}
        />
      )}

      {editingCourse && (
        <EditCourseModal
          isOpen={isCourseModalOpen}
          onClose={handleCloseCourseModal}
          course={editingCourse}
          totalWeeks={schedule.totalWeeks}
          onSave={() => fetchSchedule(true)}
        />
      )}

      {editingSchedule && (
        <ScheduleManagerModal
          isOpen={isScheduleManagerOpen}
          schedule={editingSchedule}
          timeTables={globalTimeTables}
          onClose={() => {
            setIsScheduleManagerOpen(false);
            setEditingSchedule(null);
          }}
          onUpdate={handleUpdateSchedule}
          onDelete={handleDeleteSchedule}
          onTimeTablesRefresh={fetchTimeTables}
        />
      )}
    </div>
  );
}