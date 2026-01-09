export interface CSVCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number; // 1-7
    startPeriod: number;
    endPeriod: number;
    weekRange: string; // e.g., "1-16"
}

export function parseCSV(text: string): CSVCourse[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Assuming first line is header: 课程名称, 教师, 地点, 星期, 开始节次, 结束节次, 周次范围
    const courses: CSVCourse[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map(p => p.trim());

        if (parts.length >= 7) {
            courses.push({
                name: parts[0],
                teacher: parts[1] || undefined,
                location: parts[2] || undefined,
                dayOfWeek: parseInt(parts[3]) || 1,
                startPeriod: parseInt(parts[4]) || 1,
                endPeriod: parseInt(parts[5]) || 1,
                weekRange: parts[6] || "1-16"
            });
        }
    }

    return courses;
}
