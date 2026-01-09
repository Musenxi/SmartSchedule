import { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { useUIStore } from '@/stores/ui-store';
import { X, LogOut, Clock, ChevronRight, LayoutTemplate, Calendar } from 'lucide-react';
import { Schedule, TimeTable } from '@/types';
import { TimeTableListModal } from '../schedule/TimeTableListModal';
import { AppearanceSettingsModal } from './AppearanceSettingsModal';

interface SettingsModalProps {
    currentSchedule?: Schedule;
    timeTables?: TimeTable[];
    onScheduleUpdate?: (id: string, data: any) => Promise<void>;
    onTimeTablesRefresh?: () => Promise<void>;
    onManageSchedule?: () => void;
}

export function SettingsModal({ currentSchedule, timeTables = [], onScheduleUpdate, onTimeTablesRefresh, onManageSchedule }: SettingsModalProps) {
    const { settings, updateSettings, isUpdating } = useSettings();
    const { settingsModalOpen, closeSettingsModal } = useUIStore();
    const [isTimeListOpen, setIsTimeListOpen] = useState(false);
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);

    if (!settingsModalOpen || !settings) return null;

    const activeTimeTable = timeTables.find(t => t.id === currentSchedule?.activeTimeTableId) || timeTables.find(t => t.isDefault) || timeTables[0];

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeSettingsModal();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleOverlayClick}
        >
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-background rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                    <h2 className="text-xl font-semibold">设置</h2>
                    <button
                        onClick={closeSettingsModal}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Class Time Settings */}
                    {currentSchedule && (
                        <section className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground/80 pb-2 border-b border-border">
                                课表设置
                            </h3>
                            <div
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={onManageSchedule}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">课表管理</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {currentSchedule.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-primary font-medium">详情</div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setIsTimeListOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">上课时间设置</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {activeTimeTable ? activeTimeTable.name : '未设置时间表'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-primary font-medium">管理</div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>

                            <div
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setIsAppearanceOpen(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <LayoutTemplate className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium">外观显示设置</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            自定义课表样式和布局
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-primary font-medium">设置</div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                        </section>
                    )}



                    {/* 通用设置 */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground/80 pb-2 border-b border-border">
                            通用
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <div>
                                    <div className="font-medium">深色模式</div>
                                </div>
                                <select
                                    value={settings.theme}
                                    onChange={(e) => updateSettings({ theme: e.target.value as any })}
                                    className="bg-transparent border border-border rounded-lg px-2 py-1"
                                >
                                    <option value="system">跟随系统</option>
                                    <option value="light">浅色</option>
                                    <option value="dark">深色</option>
                                </select>
                            </div>
                        </div>
                    </section>
                    {/* 账户设置 */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground/80 pb-2 border-b border-border">
                            账户
                        </h3>
                        <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-xl cursor-pointer hover:bg-destructive/20 transition-colors" onClick={() => {
                            // 处理退出逻辑
                            fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                                window.location.href = '/login';
                            });
                        }}>
                            <div className="flex items-center gap-2 text-destructive">
                                <span className="font-medium">退出登录</span>
                            </div>
                            <div className="text-destructive">
                                <LogOut className="w-5 h-5" />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="px-6 py-4 border-t border-border bg-muted/10 text-right">
                    <button
                        onClick={closeSettingsModal}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        完成
                    </button>
                </div>
            </div>

            {/* Nested TimeTable List Modal */}
            {currentSchedule && (
                <TimeTableListModal
                    isOpen={isTimeListOpen}
                    schedule={currentSchedule}
                    timeTables={timeTables}
                    onClose={() => setIsTimeListOpen(false)}
                    onScheduleUpdate={async (id, data) => {
                        if (onScheduleUpdate) await onScheduleUpdate(id, data);
                    }}
                    onTimeTablesRefresh={async () => {
                        if (onTimeTablesRefresh) await onTimeTablesRefresh();
                    }}
                />
            )}

            {/* Nested Appearance Settings Modal */}
            <AppearanceSettingsModal
                isOpen={isAppearanceOpen}
                onClose={() => setIsAppearanceOpen(false)}
            />
        </div>
    );
}
