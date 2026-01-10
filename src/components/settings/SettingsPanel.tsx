import { useState } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { X, LogOut, Clock, ChevronRight, LayoutTemplate, Calendar, Sparkles } from 'lucide-react';
import { Schedule, TimeTable } from '@/types';
import { TimeTableListModal } from '../schedule/TimeTableListModal';
import { AppearanceSettingsModal } from './AppearanceSettingsModal';
import { AISettingsModal } from './AISettingsModal';

interface SettingsPanelProps {
    currentSchedule?: Schedule;
    timeTables?: TimeTable[];
    onScheduleUpdate?: (id: string, data: any) => Promise<void>;
    onTimeTablesRefresh?: () => Promise<void>;
    onManageSchedule?: () => void;
    onClose?: () => void;
    isModal?: boolean;
}

export function SettingsPanel({
    currentSchedule,
    timeTables = [],
    onScheduleUpdate,
    onTimeTablesRefresh,
    onManageSchedule,
    onClose,
    isModal = false
}: SettingsPanelProps) {
    const { settings, updateSettings, isLoading } = useSettings();
    const [isTimeListOpen, setIsTimeListOpen] = useState(false);
    const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

    const activeTimeTable = timeTables.find(t => t.id === currentSchedule?.activeTimeTableId) || timeTables.find(t => t.isDefault) || timeTables[0];

    if (isLoading || !settings) {
        return (
            <div className={`flex items-center justify-center h-full w-full ${isModal ? 'h-[300px]' : ''}`}>
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-background h-full w-full ${isModal ? 'max-h-[90vh] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background z-10 shrink-0">
                <h2 className="text-xl font-semibold">设置</h2>
                {isModal && onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                {/* Class Time Settings */}
                {currentSchedule && (
                    <section className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground/80 pb-2 border-b border-border">
                            课表设置
                        </h3>
                        {/* Manage Schedule */}
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

                        {/* Config TimeTable */}
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

                        {/* Appearance Settings */}
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

                {/* General Settings */}
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

                    <div
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setIsAISettingsOpen(true)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-medium">AI 助手配置</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    配置 AI API 用于智能解析
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </section>

                {/* Account Settings */}
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

            {/* Footer for Modal Only */}
            {isModal && onClose && (
                <div className="px-6 py-4 border-t border-border bg-muted/10 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        完成
                    </button>
                </div>
            )}

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
                    hasBackdrop={true}
                    zIndex={60}
                />
            )}

            {/* Nested Appearance Settings Modal */}
            <AppearanceSettingsModal
                isOpen={isAppearanceOpen}
                onClose={() => setIsAppearanceOpen(false)}
            />

            {/* Nested AI Settings Modal */}
            <AISettingsModal
                isOpen={isAISettingsOpen}
                onClose={() => setIsAISettingsOpen(false)}
            />
        </div>
    );
}
