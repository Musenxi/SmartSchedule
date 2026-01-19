import React from 'react';

interface WidgetCardProps {
    variant: 'dual' | 'single' | 'tomorrow' | 'empty';
}

export function WidgetCard({ variant }: WidgetCardProps) {
    return (
        <div className="widget-container flex flex-col p-4" style={{
            width: '338px',
            height: '158px',
            backgroundColor: '#000000',
            borderRadius: '22px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}>
            {/* Header */}
            <div className="flex flex-row items-center h-5 mb-5">
                <span className="text-[13px] font-bold text-white">1月12日 </span>
                <span className="text-[13px] font-bold text-[#ef4444]">周一</span>
                <div className="w-2"></div>
                <span className="text-[13px] text-[#cccccc] truncate max-w-[80px]">我的课表</span>
                <div className="flex-grow"></div>
                <div className="bg-[#ef4444]/10 rounded px-1.5 py-0.5">
                    <span className="text-[11px] text-[#ef4444] block leading-none">第 3 周</span>
                </div>
            </div>

            {/* Content based on variant */}
            {variant === 'dual' && <DualViewContent />}
            {variant === 'single' && <SingleViewContent />}
            {variant === 'tomorrow' && <TomorrowViewContent />}
            {variant === 'empty' && <EmptyViewContent />}
        </div>
    );
}

function DualViewContent() {
    return (
        <div className="flex flex-row items-center h-full">
            {/* Left Column */}
            <div className="flex flex-col w-[126px] h-full justify-start">
                <span className="text-[12px] text-white mb-1.5">当前</span>
                <div className="flex flex-row items-center">
                    <div className="w-1 h-11 bg-[#facc15] rounded-sm flex-shrink-0"></div>
                    <div className="w-2.5"></div>
                    <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-white leading-tight truncate w-[100px]">高等数学A</span>
                        <div className="h-0.5"></div>
                        <span className="text-[13px] font-medium text-white leading-none truncate w-[100px]">08:00 - 09:35</span>
                        <div className="h-0.5"></div>
                        <span className="text-[12px] text-[#cccccc] leading-none truncate w-[100px]">@A-101</span>
                    </div>
                </div>
            </div>

            <div className="w-4"></div>

            {/* Separator */}
            <div className="w-[0.5px] h-[85px] bg-white/15"></div>

            <div className="w-4"></div>

            {/* Right Column */}
            <div className="flex flex-col w-[138px] h-full justify-start">
                <span className="text-[12px] text-white mb-1.5">接下来</span>
                <div className="flex flex-row items-center">
                    <div className="w-1 h-11 bg-[#3b82f6] rounded-sm flex-shrink-0"></div>
                    <div className="w-2.5"></div>
                    <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-white leading-tight truncate w-[110px]">大学英语</span>
                        <div className="h-0.5"></div>
                        <span className="text-[13px] font-medium text-white leading-none truncate w-[110px]">09:55 - 11:30</span>
                        <div className="h-0.5"></div>
                        <span className="text-[12px] text-[#cccccc] leading-none truncate w-[110px]">@B-205</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SingleViewContent() {
    return (
        <div className="flex flex-col justify-center h-full pb-5">
            <span className="text-[12px] text-white mb-1.5">接下来</span>
            <div className="flex flex-row items-center">
                <div className="w-[5px] h-12 bg-[#a855f7] rounded-sm flex-shrink-0"></div>
                <div className="w-2.5"></div>
                <div className="flex flex-col w-full">
                    <span className="text-[16px] font-bold text-white leading-tight truncate">线性代数</span>
                    <div className="h-0.5"></div>
                    <span className="text-[13px] font-medium text-white leading-none truncate">14:00 - 16:00</span>
                    <div className="h-0.5"></div>
                    <span className="text-[12px] text-[#cccccc] leading-none truncate">@C-302</span>
                </div>
            </div>
        </div>
    );
}

function TomorrowViewContent() {
    return (
        <div className="flex flex-col justify-center h-full pb-5">
            <span className="text-[12px] text-white mb-1.5">明天</span>
            <div className="flex flex-row items-center">
                <div className="w-[5px] h-12 bg-[#22c55e] rounded-sm flex-shrink-0"></div>
                <div className="w-2.5"></div>
                <div className="flex flex-col w-full">
                    <span className="text-[16px] font-bold text-white leading-tight truncate">计算机网络</span>
                    <div className="h-0.5"></div>
                    <span className="text-[13px] font-medium text-white leading-none truncate">08:00 - 09:35</span>
                    <div className="h-0.5"></div>
                    <span className="text-[12px] text-[#cccccc] leading-none truncate">@D-405</span>
                </div>
            </div>
        </div>
    );
}

function EmptyViewContent() {
    return (
        <div className="flex flex-col flex-grow items-center justify-center pb-5">
            <span className="text-[30px]">🎉</span>
            <div className="h-2"></div>
            <span className="text-[15px] text-[#cccccc] text-center">今日课程已结束，明天也没有课</span>
        </div>
    );
}
