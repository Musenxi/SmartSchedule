import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTaskStore } from '@/stores/task-store';
import { Task, TaskInput } from '@/types/task';
import { useEffect } from 'react';

export function useTasks() {
    const queryClient = useQueryClient();
    const { setTasks, addTask, updateTask, deleteTask, toggleComplete } = useTaskStore();
    const storeTasks = useTaskStore((state) => state.tasks);

    // Fetch tasks
    const { data: serverTasks, isLoading, error, refetch } = useQuery({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await fetch('/api/tasks');
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json() as Promise<Task[]>;
        },
    });

    // Sync with store
    useEffect(() => {
        if (serverTasks) {
            setTasks(serverTasks);
        }
    }, [serverTasks, setTasks]);

    // Create task mutation
    const createMutation = useMutation({
        mutationFn: async (newTask: TaskInput) => {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask),
            });
            if (!res.ok) {
                const errorData = await res.text();
                console.error('Task creation failed:', errorData);
                throw new Error(errorData || 'Failed to create task');
            }
            return res.json() as Promise<Task>;
        },
        onSuccess: (newTask) => {
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
                old ? [...old, newTask] : [newTask]
            );
            addTask(newTask);
        },
    });

    // Update task mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskInput> }) => {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update task');
            return res.json() as Promise<Task>;
        },
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
                old ? old.map(t => t.id === updatedTask.id ? updatedTask : t) : []
            );
            updateTask(updatedTask.id, updatedTask);
        },
    });

    // Toggle complete mutation
    const toggleCompleteMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed }),
            });
            if (!res.ok) throw new Error('Failed to toggle task');
            return res.json() as Promise<Task>;
        },
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
                old ? old.map(t => t.id === updatedTask.id ? updatedTask : t) : []
            );
            // Store update is handled by the optimistic update or sync
        },
        onMutate: async ({ id, completed }) => {
            // Optimistic update for store
            toggleComplete(id);
        }
    });

    // Delete task mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete task');
            return id;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
                old ? old.filter(t => t.id !== deletedId) : []
            );
            deleteTask(deletedId);
        },
    });

    return {
        tasks: storeTasks,
        isLoading,
        error,
        createTask: createMutation.mutateAsync,
        updateTask: updateMutation.mutateAsync,
        deleteTask: deleteMutation.mutate,
        toggleTaskComplete: (id: string, completed: boolean) => toggleCompleteMutation.mutate({ id, completed }),
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        refetchTasks: refetch,
    };
}
