// 预定义的课程颜色列表 - 现代、饱和度适中、视觉舒适
const COURSE_COLORS = [
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F97316', // Orange
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#84CC16', // Lime
    '#14B8A6', // Teal
    '#A855F7', // Purple
];

let colorIndex = 0;

/**
 * 获取一个随机课程颜色
 * 按顺序循环使用预定义颜色，确保相邻课程颜色不同
 */
export function getRandomColor(): string {
    const color = COURSE_COLORS[colorIndex % COURSE_COLORS.length];
    colorIndex++;
    return color;
}

/**
 * 判断颜色是否为浅色
 * 用于决定文字应该用黑色还是白色
 */
export function isLightColor(hexColor: string): boolean {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 使用相对亮度公式
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

/**
 * 根据背景色获取合适的文字颜色
 */
export function getContrastTextColor(backgroundColor: string): string {
    return isLightColor(backgroundColor) ? '#1f2937' : '#ffffff';
}
