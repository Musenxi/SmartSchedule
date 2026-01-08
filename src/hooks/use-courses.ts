import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Course } from '@/types';

export function useCourses() {
    const queryClient = useQueryClient();

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
        onSuccess: (updatedCourse) => {
            // Update schedules cache where this course might exist
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            // Also invalidate tasks if needed, but courses are mainly in schedules
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
        },
    });

    return {
        updateCourse: updateMutation.mutateAsync,
        deleteCourse: deleteMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
