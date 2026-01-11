'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskImportModal } from './TaskImportModal';
import { Plus, ListTodo, ChevronDown, ChevronRight, CheckCircle2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameDay, isPast } from 'date-fns';
import { useUIStore } from '@/stores/ui-store';

export function TaskPanel() {
    const { tasks, toggleTaskComplete, deleteTask, createTask, updateTask, refetchTasks } = useTasks();
    const [filter, setFilter] = useState<'all' | 'today' | 'todo'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
    const { openSettingsModal } = useUIStore();

    const today = new Date();

    const isTaskCompleted = (task: Task) => {
        if (task.completed) return true;
        if (task.type === 'EXAM' && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            // 考试只要过了截止时间就算完成
            return isPast(dueDate) && !isSameDay(dueDate, today);
        }
        return false;
    };

    const isCompletedEx = (t: Task) => {
        if (t.completed) return true;
        if (t.type === 'EXAM' && t.dueDate) {
            return new Date(t.dueDate) < new Date();
        }
        return false;
    };

    // 基础分类
    const allActiveTasks = tasks.filter(t => !isCompletedEx(t));
    const allCompletedTasks = tasks.filter(t => isCompletedEx(t));

    // 排序函数 (日期越早越前, 无日期的最后)
    const sortTasks = (a: any, b: any) => {
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    };

    // 根据 Filter 获取展示数据
    let displayActive: Task[] = [];
    let displayCompleted: Task[] = [];

    if (filter === 'all') {
        displayActive = [...allActiveTasks].sort(sortTasks);
        displayCompleted = [...allCompletedTasks].sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            }
            return 0;
        });
    } else if (filter === 'today') {
        displayActive = allActiveTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).sort(sortTasks);
        displayCompleted = allCompletedTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).sort(sortTasks);
    } else if (filter === 'todo') {
        displayActive = [...allActiveTasks].sort(sortTasks);
        displayCompleted = [];
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setEditingTask(null);
    };

    return (
        <div className="h-full flex flex-col bg-card/50">
            {/* Header */}
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-primary" />
                        任务列表
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openSettingsModal}
                            className="hidden md:flex p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            title="设置"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            title="批量导入"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        </button>
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                            title="新建任务"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'all'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setFilter('today')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'today'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        今天
                    </button>
                    <button
                        onClick={() => setFilter('todo')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                            filter === 'todo'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        待办
                    </button>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>待办: {displayActive.length}</span>
                    <span>完成: {displayCompleted.length}</span>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {displayActive.length === 0 && displayCompleted.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                        <CheckCircle2 className="w-12 h-12 stroke-1" />
                        <p className="text-sm">没有任务</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {displayActive.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={toggleTaskComplete}
                                    onDelete={deleteTask}
                                    onClick={handleEditTask}
                                />
                            ))}
                        </div>

                        {filter !== 'todo' && displayCompleted.length > 0 && (
                            <div className="mt-6">
                                <button
                                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 w-full"
                                >
                                    {isCompletedExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    已完成 ({displayCompleted.length})
                                </button>

                                {isCompletedExpanded && (
                                    <div className="space-y-3 pl-2 border-l-2 border-muted/50">
                                        {displayCompleted.map((task) => (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                onToggle={toggleTaskComplete}
                                                onDelete={deleteTask}
                                                onClick={handleEditTask}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseModal}
                initialData={editingTask || undefined}
                onSubmit={async (taskInput) => {
                    if (editingTask) {
                        await updateTask({ id: editingTask.id, updates: taskInput });
                    } else {
                        await createTask(taskInput);
                    }
                }}
                onImport={() => {
                    setIsCreateModalOpen(false);
                    setIsImportModalOpen(true);
                }}
            />

            <TaskImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImported={() => refetchTasks?.()}
                existingTasks={tasks}
            />
        </div>
    );
}
