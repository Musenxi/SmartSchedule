import { Modal } from '@/components/ui/Modal';
import { Course, CourseTime } from '@/types';
import { Clock, MapPin, X } from 'lucide-react';

interface CourseConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: { course: Course; time: CourseTime }[];
    onSelect: (course: Course, time: CourseTime) => void;
}

export function CourseConflictModal({ isOpen, onClose, items, onSelect }: CourseConflictModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="w-full max-w-sm bg-card overflow-hidden flex flex-col"
        >
            <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-lg">选择课程查看</h3>
                <button onClick={onClose} className="text-muted-foreground hover:bg-muted p-1 rounded-full">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map(({ course, time }, index) => (
                    <button
                        key={`${course.id}-${time.id}-${index}`}
                        onClick={() => {
                            onSelect(course, time);
                            onClose();
                        }}
                        className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group relative"
                    >
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                            style={{ backgroundColor: course.color }}
                        />
                        <div className="pl-3">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {course.name}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {time.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {time.location}
                                    </span>
                                )}
                                {time.teacher && (
                                    <span>{time.teacher}</span>
                                )}
                                <span className="flex items-center gap-1 text-xs opacity-70">
                                    <Clock className="w-3 h-3" />
                                    {time.startPeriod}-{time.endPeriod}节
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </Modal>
    );
}
