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
    HOMEWORK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    EXAM: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    EVENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    CUSTOM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const typeLabels: Record<TaskType, string> = {
    HOMEWORK: '作业',
    EXAM: '考试',
    EVENT: '活动',
    CUSTOM: '其他',
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.completed;

    const formatDateText = (date: Date) => {
        if (isToday(date)) return '今天';
        if (isTomorrow(date)) return '明天';
        return format(date, 'M月d日', { locale: zhCN });
    };

    return (
        <div className={cn(
            "group flex items-start gap-3 p-3 rounded-xl border border-border bg-card transition-all hover:shadow-sm",
            task.completed && "opacity-60 bg-muted/30"
        )}>
            <button
                onClick={() => onToggle(task.id, !task.completed)}
                className={cn(
                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                    task.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                )}
            >
                {task.completed && <Check className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md font-medium",
                        typeStyles[task.type]
                    )}>
                        {typeLabels[task.type]}
                    </span>
                    {dueDate && (
                        <span className={cn(
                            "text-xs",
                            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                            {formatDateText(dueDate)} {format(dueDate, 'HH:mm')}
                        </span>
                    )}
                </div>

                <h3 className={cn(
                    "font-medium truncate transition-all",
                    task.completed ? "text-muted-foreground line-through decoration-border" : "text-foreground"
                )}>
                    {task.title}
                </h3>

                {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
