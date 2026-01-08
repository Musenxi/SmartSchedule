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
import { Course, Period, Schedule } from '@/types';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/use-tasks';
import { getCurrentWeek, getWeekDates, isWeekInRange } from '@/lib/date-utils';
import { LogOut, Settings, GripVertical, CalendarDays, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDay, getHours, getMinutes, parseISO } from 'date-fns';

interface ScheduleData extends Schedule {
  courses: Course[];
  timeTables: Array<{
    id: string;
    name: string;
    periods: Period[];
  }>;
}



export default function SchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);

  // 移动端视图状态 ('schedule' | 'tasks')
  const [mobileView, setMobileView] = useState<'schedule' | 'tasks'>('schedule');

  // 侧边栏宽度状态
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

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
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleCourseClick = (course: Course) => {
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
      setSelectedCourse(course);
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
    setSelectedCourse(null);
  };

  // 处理拖拽
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const totalWidth = window.innerWidth;
      const minWidth = totalWidth * 0.3;
      const maxWidth = totalWidth * 0.7;

      const newWidth = totalWidth - mouseMoveEvent.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

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
    if (!tasks || !schedule || !schedule.timeTables[0]) return [];

    const timeTablePeriods = schedule.timeTables[0].periods;

    // 辅助函数：根据时间字符串(HH:mm)找到对应的节次
    const findPeriodByTime = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const timeValue = h * 60 + m;

      // 找到包含该时间的节次，或者最接近的节次
      // 这里简化逻辑：找到第一个开始时间晚于等于它的节次，或者最后一个节次
      // 更好的逻辑：找到时间段重叠的节次

      for (const p of timeTablePeriods) {
        const [sh, sm] = p.startTime.split(':').map(Number);
        const [eh, em] = p.endTime.split(':').map(Number);
        const startVal = sh * 60 + sm;
        const endVal = eh * 60 + em;

        if (timeValue >= startVal && timeValue < endVal) {
          return p.number;
        }
      }

      // 如果没找到，尝试找到最接近的开始时间
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

        // 计算周次
        const week = getCurrentWeek(new Date(schedule.firstWeekStart), start);

        // 计算星期 (0=周日, 1=周一)
        let dayOfWeek = getDay(start);
        if (dayOfWeek === 0) dayOfWeek = 7; // 转换为 1-7

        // 计算节次
        const startStr = `${String(getHours(start)).padStart(2, '0')}:${String(getMinutes(start)).padStart(2, '0')}`;
        const endStr = `${String(getHours(end)).padStart(2, '0')}:${String(getMinutes(end)).padStart(2, '0')}`;

        const startPeriod = findPeriodByTime(startStr);
        const endPeriod = findPeriodByTime(endStr); // 简单的结束节次映射，可能需要更精确的持续时间计算

        return {
          id: `task-${t.id}`,
          scheduleId: schedule.id,
          name: t.title,
          color: t.type === 'EXAM' ? '#ef4444' : '#f59e0b', // 考试红色，活动琥珀色
          times: [{
            id: `task-time-${t.id}`,
            courseId: `task-${t.id}`,
            dayOfWeek,
            startPeriod,
            endPeriod: Math.max(startPeriod, endPeriod), // 确保结束 >= 开始
            weekRange: String(week), // 仅在这一周显示
            location: t.location || '',
            teacher: t.type === 'EXAM' ? '考试' : '活动'
          }] as any[], // Casting to any[] to avoid strict type checks on missing relations if meaningful
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Course;
      });
  }, [tasks, schedule]);

  const allCourses = useMemo(() => {
    if (!schedule) return [];
    return [...schedule.courses, ...taskCourses];
  }, [schedule, taskCourses]);

  // 获取课表数据 (Mocked for brevity if file is overwritten, but I will keep the logic)
  useEffect(() => {
    async function fetchSchedule() {
      try {
        const res = await fetch('/api/schedules');

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('获取课表失败');
        }

        const schedules = await res.json();

        if (schedules.length > 0) {
          const activeSchedule = schedules.find((s: ScheduleData) => s.isActive) || schedules[0];
          setSchedule(activeSchedule);
          const week = getCurrentWeek(new Date(activeSchedule.firstWeekStart));
          setCurrentWeek(Math.min(Math.max(1, week), activeSchedule.totalWeeks));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [router]);

  const periods = useMemo(() => {
    if (!schedule || schedule.timeTables.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        id: `default-${i + 1}`,
        timeTableId: 'default',
        number: i + 1,
        startTime: `${8 + Math.floor(i * 0.75)}:${(i % 2) * 30 || '00'}`,
        endTime: `${8 + Math.floor((i + 1) * 0.75)}:${((i + 1) % 2) * 30 || '00'}`,
      }));
    }
    return schedule.timeTables[0].periods;
  }, [schedule]);

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">还没有课表</div>
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
          // 移动端逻辑：根据视图显隐
          mobileView === 'schedule' ? 'flex' : 'hidden md:flex'
        )}>
          <ScheduleToolbar
            currentWeek={currentWeek}
            realCurrentWeek={realCurrentWeek}
            totalWeeks={schedule.totalWeeks}
            scheduleName={schedule.name}
            onPrevWeek={() => setCurrentWeek(w => Math.max(1, w - 1))}
            onNextWeek={() => setCurrentWeek(w => Math.min(schedule.totalWeeks, w + 1))}
            onGoToWeek={(week) => setCurrentWeek(week)}
            onDateSelect={handleDateSelect}
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
          className={`hidden md:flex w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors flex-col items-center justify-center z-20 hover:shadow-glow
                ${isResizing ? 'bg-primary shadow-glow' : 'bg-border'}`}
          onMouseDown={startResizing}
        >
          <div className="h-8 w-1 bg-muted-foreground/30 rounded-full flex items-center justify-center">
            <GripVertical className="w-3 h-3 text-muted-foreground opacity-50" />
          </div>
        </div>

        {/* 右侧：任务面板 */}
        <div
          className={cn(
            "border-l border-border bg-card/30 flex-shrink-0 relative overflow-hidden",
            // 移动端：全屏显示
            mobileView === 'tasks' ? 'flex w-full' : 'hidden md:flex' // md:flex 恢复侧边栏
          )}
          style={{
            // 移动端不应用固定宽度，使用 w-full
            // 桌面端应用 panelWidth
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

      <SettingsModal />

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
        />
      )}

      {editingCourse && (
        <EditCourseModal
          isOpen={isCourseModalOpen}
          onClose={handleCloseCourseModal}
          course={editingCourse}
          totalWeeks={schedule.totalWeeks}
        />
      )}
    </div>
  );
}