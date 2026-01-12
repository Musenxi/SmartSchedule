'use client';

import React from 'react';

export function WidgetPreview() {
    return (
        <div className="relative group cursor-default select-none">
            {/* Widget Container */}
            <div className="w-[338px] h-[158px] bg-black rounded-[22px] overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1 border border-white/10 p-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center h-[20px] mb-[20px]">
                    <span className="text-[13px] font-bold text-white">1月12日 </span>
                    <span className="text-[13px] font-bold text-[#ef4444] ml-1">周一</span>
                    <span className="text-[13px] text-[#cccccc] truncate max-w-[80px] ml-2">我的课表</span>
                    <div className="flex-grow"></div>
                    <div className="bg-[#ef4444]/10 rounded-[4px] px-[6px] py-[2px]">
                        <span className="text-[11px] text-[#ef4444] leading-none">第 3 周</span>
                    </div>
                </div>

                {/* Content: Dual View Mock */}
                <div className="flex flex-row items-center flex-1">
                    {/* Left Column */}
                    <div className="flex flex-col w-[126px] h-full justify-start">
                        <span className="text-[11px] text-white/60 mb-[4px]">当前</span>
                        <div className="flex flex-row items-center">
                            <div className="w-[4px] h-[40px] bg-[#facc15] rounded-[2px] shrink-0"></div>
                            <div className="ml-2.5 flex flex-col">
                                <span className="text-[14px] font-bold text-white leading-tight truncate w-[90px]">高等数学A</span>
                                <span className="text-[11px] font-medium text-white/90 mt-0.5 truncate w-[90px]">08:00-09:35</span>
                                <span className="text-[10px] text-[#cccccc] mt-0.5 truncate w-[90px]">@A-101</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-[12px]"></div>

                    {/* Separator */}
                    <div className="w-[0.5px] h-[70px] bg-white/15"></div>

                    <div className="w-[12px]"></div>

                    {/* Right Column */}
                    <div className="flex flex-col w-[138px] h-full justify-start">
                        <span className="text-[11px] text-white/60 mb-[4px]">接下来</span>
                        <div className="flex flex-row items-center">
                            <div className="w-[4px] h-[40px] bg-[#3b82f6] rounded-[2px] shrink-0"></div>
                            <div className="ml-2.5 flex flex-col">
                                <span className="text-[14px] font-bold text-white leading-tight truncate w-[100px]">大学英语</span>
                                <span className="text-[11px] font-medium text-white/90 mt-0.5 truncate w-[100px]">09:55-11:30</span>
                                <span className="text-[10px] text-[#cccccc] mt-0.5 truncate w-[100px]">@B-205</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
        </div>
    );
}
