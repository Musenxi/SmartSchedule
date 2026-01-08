'use client';

import { Task, TaskType } from '@/types/task';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Check, Trash2 } from 'lucide-react';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
}

const typeStyles: Record<TaskType, string> = {
    HOMEWORK: '!bg-transparent text-blue-700 border border-blue-400 dark:bg-blue-900/30 dark:border-transparent dark:text-blue-300',
    EXAM: '!bg-transparent text-red-700 border border-red-400 dark:bg-red-900/30 dark:border-transparent dark:text-red-300',
    EVENT: '!bg-transparent text-green-700 border border-green-400 dark:bg-green-900/30 dark:border-transparent dark:text-green-300',
    CUSTOM: '!bg-transparent text-gray-700 border border-gray-400 dark:bg-gray-800 dark:border-transparent dark:text-gray-300',
};

const typeLabels: Record<TaskType, string> = {
    HOMEWORK: '作业',
    EXAM: '考试',
    EVENT: '活动',
    CUSTOM: '其他',
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    // 判断是否过期（不考虑完成状态）- 对于普通任务，今天的不算过期
    const isPastDue = dueDate && isPast(dueDate) && !isToday(dueDate);
    // 对于非考试任务，已完成就不显示为过期
    const isOverdue = isPastDue && !task.completed;

    // 考试：只要结束时间过了就算过期（包括今天的考试）
    const isExamExpired = task.type === 'EXAM' && dueDate && isPast(dueDate);
    const isCompleted = task.completed || isExamExpired;

    const formatDateText = (date: Date) => {
        if (isToday(date)) return '今天';
        if (isTomorrow(date)) return '明天';
        return format(date, 'M月d日', { locale: zhCN });
    };

    return (
        <div className={cn(
            "group flex items-start gap-3 p-3 rounded-xl border border-border bg-card transition-all hover:shadow-sm",
            isCompleted && "opacity-50"
        )}>
            {task.type !== 'EXAM' && (
                <button
                    onClick={() => onToggle(task.id, !task.completed)}
                    className={cn(
                        "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        task.completed
                            ? "bg-gray-400 border-gray-400 text-white dark:bg-gray-600 dark:border-gray-600"
                            : "border-muted-foreground/30 hover:border-primary"
                    )}
                >
                    {task.completed && <Check className="w-3 h-3" />}
                </button>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        "text-xs px-1 py-0.5 rounded-md font-bold",
                        isCompleted ? "!bg-gray-200 !text-gray-500 !border-gray-300 dark:!bg-gray-700 dark:!text-gray-400 dark:!border-gray-600" : typeStyles[task.type]
                    )}>
                        {typeLabels[task.type]}
                    </span>
                    {dueDate && (
                        <span className={cn(
                            "text-xs",
                            isCompleted ? "text-gray-400 dark:text-gray-500" : (isOverdue && !isExamExpired) ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                            {task.startTime ? (
                                <>
                                    {formatDateText(new Date(task.startTime))} {format(new Date(task.startTime), 'HH:mm')} - {format(dueDate, 'HH:mm')}
                                </>
                            ) : (
                                <>
                                    {formatDateText(dueDate)} {format(dueDate, 'HH:mm')}
                                </>
                            )}
                        </span>
                    )}
                </div>

                <h3 className={cn(
                    "font-medium truncate transition-all",
                    isCompleted ? "text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600" : "text-foreground"
                )}>
                    {task.title}
                </h3>

                {task.description && (
                    <p className={cn(
                        "text-xs mt-1 line-clamp-2",
                        isCompleted ? "text-gray-400 dark:text-gray-500" : "text-muted-foreground"
                    )}>
                        {task.description}
                    </p>
                )}

                {task.courseId && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        关联课程
                    </div>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
