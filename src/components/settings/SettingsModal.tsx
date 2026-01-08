'use client';

import { useSettings } from '@/hooks/use-settings';
import { useUIStore } from '@/stores/ui-store';
import { X, LogOut } from 'lucide-react';

export function SettingsModal() {
    const { settings, updateSettings, isUpdating } = useSettings();
    const { settingsModalOpen, closeSettingsModal } = useUIStore();

    if (!settingsModalOpen || !settings) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            closeSettingsModal();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
        >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-background rounded-2xl shadow-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
                    <h2 className="text-xl font-semibold">设置</h2>
                    <button
                        onClick={closeSettingsModal}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* 外观设置 */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground/80 pb-2 border-b border-border">
                            外观显示
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        <div className="space-y-4 pt-2">
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
                    </section>

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
        </div>
    );
}
