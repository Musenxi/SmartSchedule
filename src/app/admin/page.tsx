
'use client';

import { Users, Calendar, LayoutDashboard, Clock } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold">仪表盘</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">总用户数</h3>
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold">--</div>
                    <div className="text-xs text-muted-foreground mt-1">系统注册用户</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">活跃课表</h3>
                        <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold">--</div>
                    <div className="text-xs text-muted-foreground mt-1">本学期激活课表</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">今日任务</h3>
                        <LayoutDashboard className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold">--</div>
                    <div className="text-xs text-muted-foreground mt-1">全站今日待办</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">系统运行</h3>
                        <Clock className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold">正常</div>
                    <div className="text-xs text-muted-foreground mt-1">服务状态良好</div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-semibold mb-4">最近活动</h3>
                <div className="text-sm text-muted-foreground text-center py-8">
                    暂无最近活动记录
                </div>
            </div>
        </div>
    );
}
