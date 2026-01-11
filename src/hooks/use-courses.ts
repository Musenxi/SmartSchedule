import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Course, Schedule } from '@/types';

export function useCourses() {
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async (data: { scheduleId: string; name: string; color: string; credits?: number; note?: string; times: any[] }) => {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create course');
            return res.json() as Promise<Course>;
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
            const res = await fetch(`/api/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update course');
            return res.json() as Promise<Course>;
        },
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['schedules'] });

            // Snapshot previous value
            const previousSchedules = queryClient.getQueryData(['schedules']);

            // Optimistically update the cache
            queryClient.setQueryData(['schedules'], (old: Schedule[] | undefined) => {
                if (!old) return old;
                return old.map(schedule => ({
                    ...schedule,
                    courses: schedule.courses?.map((course: Course) =>
                        course.id === id ? { ...course, ...data } : course
                    )
                }));
            });

            return { previousSchedules };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousSchedules) {
                queryClient.setQueryData(['schedules'], context.previousSchedules);
            }
        },
        onSettled: () => {
            // Always refetch after mutation settles
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/courses/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete course');
            return id;
        },
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['schedules'] });

            // Snapshot previous value
            const previousSchedules = queryClient.getQueryData(['schedules']);

            // Optimistically remove from cache
            queryClient.setQueryData(['schedules'], (old: Schedule[] | undefined) => {
                if (!old) return old;
                return old.map(schedule => ({
                    ...schedule,
                    courses: schedule.courses?.filter((course: Course) => course.id !== id)
                }));
            });

            return { previousSchedules };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousSchedules) {
                queryClient.setQueryData(['schedules'], context.previousSchedules);
            }
        },
        onSettled: () => {
            // Always refetch after mutation settles
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });

    return {
        createCourse: createMutation.mutateAsync,
        updateCourse: updateMutation.mutateAsync,
        deleteCourse: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
