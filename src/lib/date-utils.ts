import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    differenceInWeeks,
    differenceInCalendarWeeks,
    isWithinInterval,
    isSameDay,
    parseISO,
    addWeeks,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 获取指定周的日期数组
export function getWeekDates(
    firstWeekStart: Date,
    weekNumber: number,
    weekStartDay: number = 1 // 1=周一
): Date[] {
    // 强制以该周的周一为基准计算，确保WeekHeader的[0]对应周一
    const anchorDate = startOfWeek(new Date(firstWeekStart), { weekStartsOn: weekStartDay as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
    const weekStart = addWeeks(anchorDate, weekNumber - 1);
    const dates: Date[] = [];

    for (let i = 0; i < 7; i++) {
        dates.push(addDays(weekStart, i));
    }

    return dates;
}

// 计算当前周次
export function getCurrentWeek(firstWeekStart: Date, targetDate: Date = new Date()): number {
    const start = startOfWeek(new Date(firstWeekStart), { weekStartsOn: 1 });
    const diffWeeks = differenceInCalendarWeeks(targetDate, start, { weekStartsOn: 1 });
    return Math.max(1, diffWeeks + 1);
}

// 格式化日期为显示格式
export function formatDate(date: Date | string, formatStr: string = 'yyyy/M/d'): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: zhCN });
}

// 格式化星期
export function formatWeekday(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'EEEE', { locale: zhCN });
}

// 格式化星期简写
export function formatWeekdayShort(dayOfWeek: number): string {
    const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
    return weekdays[dayOfWeek - 1] || '';
}

// 解析周次范围字符串
// 支持格式: "1-16", "1-17周(单)", "1-17(双)", "1,3,5,7-10", "1-6周,8-10周(双)"
export function parseWeekRange(weekRange: string): number[] {
    const weeks: Set<number> = new Set();
    // User request: Cancel support for commas, use slash only.
    // We replace slash with comma (internal separator) but do NOT normalize Chinese/English commas.
    // If input has commas, they will remain and break number parsing, effectively "cancelling" support.
    const normalized = weekRange.replace(/\//g, ',').trim();

    // Split by comma FIRST to handle separate segments
    const parts = normalized.split(',').map(p => p.trim()).filter(p => p);

    for (const part of parts) {
        // Determine modifiers for THIS part only
        const isOdd = part.includes('单');
        const isEven = part.includes('双');

        // Clean up the part content for number parsing
        // Remove '周', '单', '双', and surrounding parentheses/brackets
        let content = part.replace(/周/g, '')
            .replace(/[\(\[\{（]单[\)\]\}）]/g, '')
            .replace(/[\(\[\{（]双[\)\]\}）]/g, '')
            .replace(/[单双]/g, ''); // Just in case loose characters exist

        if (content.includes('-')) {
            const [start, end] = content.split('-').map(n => parseInt(n.trim(), 10));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    // Apply filtering specific to this part
                    if (isOdd && i % 2 === 0) continue;
                    if (isEven && i % 2 !== 0) continue;
                    weeks.add(i);
                }
            }
        } else {
            const num = parseInt(content, 10);
            if (!isNaN(num)) {
                // Apply filtering specific to this part (though less common for single numbers)
                if (isOdd && num % 2 === 0) continue;
                if (isEven && num % 2 !== 0) continue;
                weeks.add(num);
            }
        }
    }

    return Array.from(weeks).sort((a, b) => a - b);
}

// 检查某周是否在周次范围内
export function isWeekInRange(currentWeek: number, weekRange: string): boolean {
    const weeks = parseWeekRange(weekRange);
    return weeks.includes(currentWeek);
}

// 检查课程是否已经结课（所有周次都在当前周之前）
export function isCourseFinished(currentWeek: number, weekRange: string): boolean {
    const weeks = parseWeekRange(weekRange);
    if (weeks.length === 0) return false;
    const maxWeek = Math.max(...weeks);
    return maxWeek < currentWeek;
}

// 格式化周次范围为友好字符串
export function formatWeekRange(weeks: number[]): string {
    if (weeks.length === 0) return '';

    const sorted = [...weeks].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
        if (sorted[i] === end + 1) {
            end = sorted[i];
        } else {
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            if (i < sorted.length) {
                start = sorted[i];
                end = sorted[i];
            }
        }
    }

    return ranges.join(',');
}

// 判断是否是今天
export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

// 格式化时间 (08:00)
export function formatTime(time: string): string {
    return time;
}

// 计算节次跨度
export function getPeriodSpan(startPeriod: number, endPeriod: number): number {
    return endPeriod - startPeriod + 1;
}
