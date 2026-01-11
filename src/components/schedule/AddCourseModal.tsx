'use client';

import { useState } from 'react';
import { CourseForm, CourseFormData } from './CourseForm';
import { Modal } from '@/components/ui/Modal';
import { useCourses } from '@/hooks/use-courses';

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    scheduleId: string;
    totalWeeks?: number;
    startDate?: string;
    onSuccess?: () => void;
    // Pre-filled time data from grid selection
    initialTimeSlot?: {
        dayOfWeek: number;
        startPeriod: number;
        endPeriod: number;
        weekRange: string;
        specificDate?: string;
    };
}

const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
];

// Fallback for crypto.randomUUID which is only available in secure contexts (HTTPS/localhost)
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function AddCourseModal({
    isOpen,
    onClose,
    scheduleId,
    totalWeeks = 20,
    startDate,
    onSuccess,
    initialTimeSlot
}: AddCourseModalProps) {
    const { createCourse } = useCourses();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: CourseFormData) => {
        setLoading(true);
        try {
            const payload = {
                scheduleId,
                name: data.name,
                color: data.color,
                credits: data.credits,
                note: data.note,
                times: data.times.map((t) => ({
                    dayOfWeek: t.dayOfWeek,
                    startPeriod: t.startPeriod,
                    endPeriod: t.endPeriod,
                    weekRange: t.weekRange,
                    ...(t.teacher ? { teacher: t.teacher } : {}),
                    ...(t.location ? { location: t.location } : {}),
                })),
            };
            console.log('Submitting course data:', payload);
            await createCourse(payload);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Failed to create course:', error);
        } finally {
            setLoading(false);
        }
    };

    // Generate initial data with time slot if provided
    const initialData: Partial<CourseFormData> = {
        name: '',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        credits: 0,
        note: '',
        teacher: '',
        times: initialTimeSlot ? [{
            id: generateId(),
            courseId: '',
            dayOfWeek: initialTimeSlot.dayOfWeek,
            startPeriod: initialTimeSlot.startPeriod,
            endPeriod: initialTimeSlot.endPeriod,
            weekRange: initialTimeSlot.weekRange,
            teacher: null,
            location: null,
            specificDate: initialTimeSlot.specificDate,
            specificDates: initialTimeSlot.specificDate ? [initialTimeSlot.specificDate] : undefined,
        }] : [],
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <CourseForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={loading}
                submitLabel="添加"
                totalWeeks={totalWeeks}
                startDate={startDate}
            />
        </Modal>
    );
}
