'use client';

import { useState, useEffect } from 'react';
import { Course, CourseTime } from '@/types';
import { X, Plus, Trash2, Copy, ChevronRight } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { cn } from '@/lib/utils';

interface EditCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
    totalWeeks?: number;
    onSave?: () => void;
    disableAnimation?: boolean;
    hasBackdrop?: boolean;
    startDate?: string;
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

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

import { TimeSlotEditor } from './TimeSlotEditor';
import { CourseForm } from './CourseForm';
import { Modal } from '@/components/ui/Modal';

export function EditCourseModal({ isOpen, onClose, course, totalWeeks = 20, onSave, disableAnimation, hasBackdrop = true, startDate }: EditCourseModalProps) {
    const { updateCourse } = useCourses();
    const [loading, setLoading] = useState(false);

    const handleSave = async (data: any) => {
        setLoading(true);
        try {
            await updateCourse({
                id: course.id,
                data: {
                    name: data.name,
                    color: data.color,
                    credits: data.credits,
                    note: data.note,
                    times: data.times.map((t: any) => ({
                        ...t,
                        teacher: t.teacher || null,
                        location: t.location || null,
                        startTime: t.startTime || null,
                        endTime: t.endTime || null,
                    })),
                },
            });
            onSave?.();
            onClose();
        } catch (error) {
            console.error('Failed to update course:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} zIndex={50} hasBackdrop={hasBackdrop} disableAnimation={disableAnimation}>
            <CourseForm
                initialData={{
                    name: course.name,
                    color: course.color,
                    credits: course.credits || 0,
                    note: course.note || '',
                    times: course.times || [],
                    teacher: '',
                }}
                onSubmit={handleSave}
                onCancel={onClose}
                loading={loading}
                totalWeeks={totalWeeks}
                startDate={startDate}
            />
        </Modal>
    );
}
