'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Task } from '@/types/task';
import { TaskItem } from './TaskItem';
import { CreateTaskModal } from './CreateTaskModal';
import { Plus, ListTodo, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameDay, isPast } from 'date-fns';

export function TaskPanel() {
    const { tasks, toggleTaskComplete, deleteTask, createTask } = useTasks();
    const [filter, setFilter] = useState<'all' | 'today' | 'todo'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

    const today = new Date();

    const isTaskCompleted = (task: Task) => {
        if (task.completed) return true;
        if (task.type === 'EXAM' && task.dueDate) {
            const dueDate = new Date(task.dueDate);
            // 考试只要过了截止时间就算完成
            return isPast(dueDate) && !isSameDay(dueDate, today);
            // 修正: 实际上用户说"到时间之后就完成". 
            // 如果在今天且时间过了, 也算完成?
            // 让我们使用简单的 isPast(dueDate)
            // return new Date(task.dueDate) < new Date();
        }
        return false;
    };

    // 我们需要一个更精确的判定
    // 为了保持跟 TaskItem 一致: 
    // const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed;
    // TaskItem 里: const isExamExpired = task.type === 'EXAM' && isOverdue;
    // 所以过期才算完成? 
    // 用户说: "考试的完成逻辑是到时间之后就完成"
    // 这意味着哪怕是今天, 只要时间过了, 就算完成.
    // 所以 TaskItem 的 isOverdue 逻辑可能需要调整?
    // TaskItem 原逻辑: isPast && !isToday. 意味着今天过期的不算 overdue.
    // 让我们先用 isPast(dueDate) 作为标准.

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
            // 完成的任务通常按完成时间或原始日期倒序？这里暂且按日期
            if (a.dueDate && b.dueDate) {
                return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            }
            return 0;
        });
    } else if (filter === 'today') {
        displayActive = allActiveTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).sort(sortTasks);
        displayCompleted = allCompletedTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).sort(sortTasks);
    } else if (filter === 'todo') {
        // 待办：显示所有未完成 (包括过期、今天、未来、无日期)
        displayActive = [...allActiveTasks].sort(sortTasks);
        displayCompleted = []; // 不显示已完成
    }

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
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
                    <span>待办: {allActiveTasks.length}</span>
                    <span>完成: {allCompletedTasks.length}</span>
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
                        {/* 未完成任务 */}
                        <div className="space-y-3">
                            {displayActive.map((task) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={toggleTaskComplete}
                                    onDelete={deleteTask}
                                />
                            ))}
                        </div>

                        {/* 已完成任务 - 可折叠 (仅在 all 和 today 模式下且有数据时显示) */}
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
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={async (task) => {
                    await createTask(task);
                }}
            />
        </div>
    );
}
