'use client';

import { useState } from 'react';
import { X, User, MapPin, BookOpen } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Course, Period } from '@/types';
import { CourseDetailModal } from './CourseDetailModal';
import { EditCourseModal } from './EditCourseModal';

interface CourseListModalProps {
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    scheduleName: string;
    periods?: Period[];
    onRefresh?: () => void;
    zIndex?: number;
    hasBackdrop?: boolean;
    totalWeeks?: number;
    startDate?: string;
}

export function CourseListModal({
    isOpen,
    onClose,
    courses,
    scheduleName,
    periods = [], // Default to empty if not provided
    onRefresh,
    zIndex = 70,
    hasBackdrop = true,
    totalWeeks,
    startDate,
}: CourseListModalProps) {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // If main modal is closed, ensure detail modal is also effectively closed/reset
    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                zIndex={zIndex}
                hasBackdrop={hasBackdrop}
                className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
            >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold">已添课程列表</h3>
                        <p className="text-xs text-muted-foreground">{scheduleName} • 共 {courses.length} 门课程</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <div
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
                                className="p-3 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors flex flex-col gap-2 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{course.name}</span>
                                </div>

                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {course.times?.[0]?.teacher && (
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                            <User className="w-3.5 h-3.5" />
                                            <span>{course.times[0].teacher}</span>
                                        </div>
                                    )}
                                    {course.times?.[0]?.location && (
                                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{course.times[0].location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>{course.times?.length || 0} 个时间段</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p>暂无课程</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </Modal>

            {/* Course Detail Modal */}
            {selectedCourse && (
                <CourseDetailModal
                    isOpen={!!selectedCourse && !isEditOpen}
                    onClose={() => setSelectedCourse(null)}
                    course={selectedCourse}
                    periods={periods}
                    onEdit={() => {
                        setIsEditOpen(true);
                    }}
                    onRefresh={onRefresh}
                    zIndex={80}
                    hasBackdrop={false}
                    fromList={true}
                />
            )}

            {/* Edit Course Modal */}
            {selectedCourse && (
                <EditCourseModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    course={selectedCourse}
                    totalWeeks={totalWeeks}
                    startDate={startDate}
                    onSave={() => {
                        onRefresh?.();
                        setIsEditOpen(false);
                        setSelectedCourse(null);
                    }}
                    zIndex={90}
                    hasBackdrop={false}
                />
            )}
        </>
    );
}
