'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WeekView, ScheduleToolbar } from '@/components/schedule';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { TaskPanel } from '@/components/tasks/TaskPanel';
import { useSettingsStore } from '@/stores/settings-store';
import { useUIStore } from '@/stores/ui-store';
import { Course, Period, Schedule } from '@/types';
import { getCurrentWeek } from '@/lib/date-utils';
import { LogOut, Settings, GripVertical, CalendarDays, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleData extends Schedule {
  courses: Course[];
  timeTables: Array<{
    id: string;
    name: string;
    periods: Period[];
  }>;
}

const MIN_PANEL_WIDTH = 300;
const MAX_PANEL_WIDTH = 600;

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

  // 处理拖拽
  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth >= MIN_PANEL_WIDTH && newWidth <= MAX_PANEL_WIDTH) {
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
      if (!isNaN(width) && width >= MIN_PANEL_WIDTH && width <= MAX_PANEL_WIDTH) {
        setPanelWidth(width);
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
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden select-none">
      {/* 主体内容区域 */}
      <div className="flex flex-1 overflow-hidden relative">
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
              courses={schedule.courses}
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
              onCourseClick={(course) => console.log('点击课程:', course.name)}
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

      {/* 底部导航栏 (仅移动端显示) */}
      <div className="md:hidden flex items-center justify-around border-t border-border bg-card pb-safe">
        <button
          onClick={() => setMobileView('schedule')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-3 gap-1 hover:bg-muted/50 transition-colors",
            mobileView === 'schedule' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] font-medium">课程表</span>
        </button>

        <button
          onClick={() => setMobileView('tasks')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-3 gap-1 hover:bg-muted/50 transition-colors",
            mobileView === 'tasks' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[10px] font-medium">任务</span>
        </button>

        <button
          onClick={openSettingsModal}
          className="flex flex-col items-center justify-center flex-1 py-3 gap-1 hover:bg-muted/50 text-muted-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">设置</span>
        </button>
      </div>

      <SettingsModal />
    </div>
  );
}