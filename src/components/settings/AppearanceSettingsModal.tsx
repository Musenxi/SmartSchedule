'use client';

import { X, LayoutTemplate } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

interface AppearanceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AppearanceSettingsModal({
    isOpen,
    onClose,
}: AppearanceSettingsModalProps) {
    const { settings, updateSettings } = useSettings();

    if (!isOpen || !settings) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        外观显示设置
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">显示网格辅助线</div>
                                <div className="text-xs text-muted-foreground mt-1">显示课程格子的分隔线</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.showGridLines}
                                onChange={(e) => updateSettings({ showGridLines: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">显示节次时间</div>
                                <div className="text-xs text-muted-foreground mt-1">在左侧显示每节课的具体时间</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.showPeriodTime}
                                onChange={(e) => updateSettings({ showPeriodTime: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">显示周六</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.showSaturday}
                                onChange={(e) => updateSettings({ showSaturday: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">显示周日</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.showSunday}
                                onChange={(e) => updateSettings({ showSunday: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">显示非本周课程</div>
                                <div className="text-xs text-muted-foreground mt-1">非当前周的课程将以灰色显示</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.showNonCurrentWeek}
                                onChange={(e) => updateSettings({ showNonCurrentWeek: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <div>
                                <div className="font-medium">使用纯色背景</div>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle"
                                checked={settings.useSolidBackground}
                                onChange={(e) => updateSettings({ useSolidBackground: e.target.checked })}
                            />
                        </div>
                    </div>

                    <div className="space-y-6 pt-2 border-t border-border">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium">课程卡片圆角 ({settings.courseCornerRadius}px)</label>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={settings.courseCornerRadius}
                                onChange={(e) => updateSettings({ courseCornerRadius: parseInt(e.target.value) })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium">每节课高度 ({settings.periodHeight}px)</label>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="80"
                                value={settings.periodHeight}
                                onChange={(e) => updateSettings({ periodHeight: parseInt(e.target.value) })}
                                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border bg-muted/10 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
}
