import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 课程颜色预设
export const COURSE_COLORS = [
  '#3B82F6', // blue
  '#F97316', // orange
  '#EF4444', // red
  '#EAB308', // yellow
  '#22C55E', // green
  '#A855F7', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#84CC16', // lime
];

// 获取随机课程颜色
export function getRandomCourseColor(): string {
  return COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)];
}

// 根据课程名生成稳定的颜色
export function getCourseColorByName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

// 调整颜色透明度
export function adjustColorOpacity(color: string, opacity: number): string {
  // 处理hex颜色
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

// 判断颜色是否为浅色
export function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 使用感知亮度公式
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
