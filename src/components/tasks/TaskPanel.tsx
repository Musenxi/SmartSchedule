'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { TaskItem } from './TaskItem';
import { CreateTaskModal } from './CreateTaskModal';
import { Plus, Filter, CalendarCheck, CheckCircle2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TaskPanel() {
    const { tasks, toggleTaskComplete, deleteTask, createTask } = useTasks();
    const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // 简单的过滤逻辑 (这部分其实可以放在 useTasks 或 store selector 里，但为了简单这里先写)
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;

        // 假设 store 已经同步了 tasks
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (task.dueDate) {
            const due = new Date(task.dueDate);
            if (filter === 'today') {
                return due >= today && due < tomorrow;
            }
            if (filter === 'upcoming') {
                return due >= today;
            }
        }
        return false;
    }).sort((a, b) => {
        // 未完成在前
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // 按时间排序
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return 0;
    });

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        today: tasks.filter(t => {
            if (!t.dueDate) return false;
            const d = new Date(t.dueDate);
            const today = new Date();
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
        }).length
    };

    return (
        <div className="h-full flex flex-col bg-card/50">
            {/* Header */}
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-primary" />
                        待办任务
                    </h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        title="新建任务"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    {(['all', 'today', 'upcoming'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                                filter === f
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {f === 'all' ? '全部' : f === 'today' ? '今天' : '待办'}
                        </button>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>待办: {stats.total - stats.completed}</span>
                    <span>完成: {stats.completed}</span>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {filteredTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                        <CheckCircle2 className="w-12 h-12 stroke-1" />
                        <p className="text-sm">没有任务</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTaskComplete}
                            onDelete={deleteTask}
                        />
                    ))
                )}
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={createTask}
            />
        </div>
    );
}
