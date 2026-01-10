export interface CSVCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number; // 1-7
    startPeriod: number;
    endPeriod: number;
    weekRange: string; // e.g., "1-16", "1-8单", "1-8,10-16双"
    specificDate?: string; // YYYY-MM-DD format, optional
}

export function parseCSV(text: string): CSVCourse[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    // Header: 课程名称,教师,地点,星期,开始节次,结束节次,周次,日期(可选)
    const courses: CSVCourse[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map(p => p.trim());

        if (parts.length >= 7) {
            const weekRangeRaw = parts[6]?.trim() || "";
            const dateRaw = parts.length >= 8 ? (parts[7]?.trim() || "") : "";

            // Skip row if both week and date columns are empty
            if (!weekRangeRaw && !dateRaw) {
                continue;
            }

            // 1. Regular Slot: Only create if week column has content
            if (weekRangeRaw) {
                const regularCourse: CSVCourse = {
                    name: parts[0],
                    teacher: parts[1] || undefined,
                    location: parts[2] || undefined,
                    dayOfWeek: parseInt(parts[3]) || 1,
                    startPeriod: parseInt(parts[4]) || 1,
                    endPeriod: parseInt(parts[5]) || 1,
                    weekRange: weekRangeRaw.replace(/\//g, ',')
                };
                courses.push(regularCourse);
            }

            // 2. Specific Date Slot: Only create if date column has content
            if (dateRaw) {
                // User requirement: Dates use / internally (YYYY/MM/DD), separated by -
                const dateMatches = dateRaw.match(/\d{4}\/\d{2}\/\d{2}/g) || [];

                for (const dateStrRaw of dateMatches) {
                    // Normalize YYYY/MM/DD to YYYY-MM-DD
                    const dateStr = dateStrRaw.replace(/\//g, '-');

                    // Validate YYYY-MM-DD format
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            const day = date.getDay();
                            const dateDayOfWeek = day === 0 ? 7 : day;

                            const dateCourse: CSVCourse = {
                                name: parts[0],
                                teacher: parts[1] || undefined,
                                location: parts[2] || undefined,
                                dayOfWeek: dateDayOfWeek, // Use the date's actual day
                                startPeriod: parseInt(parts[4]) || 1,
                                endPeriod: parseInt(parts[5]) || 1,
                                weekRange: "", // No recurring week range for specific date slot
                                specificDate: dateStr
                            };
                            courses.push(dateCourse);
                        }
                    }
                }
            }
        }
    }

    return courses;
}
