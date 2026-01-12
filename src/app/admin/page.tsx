
'use client';

import { Users, Calendar, LayoutDashboard, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        activeSchedules: 0,
        todayTasks: 0,
        systemStatus: 'Checking...'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(async res => {
                if (!res.ok) {
                    if (res.status === 401) {
                        // Redirect to login or handle unauth
                        window.location.href = '/login';
                        throw new Error('Unauthorized');
                    }
                    throw new Error('Failed to fetch stats');
                }
                return res.json();
            })
            .then(data => {
                setStats(data);
            })
            .catch(err => {
                console.error(err);
                // toast.error('无法获取数据');
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold">仪表盘</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">总用户数</h3>
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-3xl font-bold">
                        {loading ? <span className="text-muted-foreground animate-pulse">--</span> : stats.users}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">系统注册用户</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">总课表数</h3>
                        <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold">
                        {loading ? <span className="text-muted-foreground animate-pulse">--</span> : stats.activeSchedules}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">系统全量课表</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">今日任务</h3>
                        <LayoutDashboard className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="text-3xl font-bold">
                        {loading ? <span className="text-muted-foreground animate-pulse">--</span> : stats.todayTasks}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">全站今日待办</div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">系统运行</h3>
                        <Clock className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-500">
                        {loading ? <span className="text-muted-foreground animate-pulse">...</span> : '正常'}
                    </div>
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
