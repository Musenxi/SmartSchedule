import { read, utils } from 'xlsx';

export interface ParsedTask {
    title: string;
    description: string;
    startTime: string; // ISO string or specific format
    endTime: string;   // ISO string or specific format
    location: string;
    type: 'EXAM';
}

export class ExamParser {
    /**
     * Parse HTML string from methods like document.documentElement.outerHTML
     * Specifically designed for the SmartSchedule test.html format (Zhengfang System)
     */
    static parseHtml(html: string): ParsedTask[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = Array.from(doc.querySelectorAll('#tabGrid tr.jqgrow'));

        return rows.map(row => {
            const cells = row.querySelectorAll('td');
            // Mapping based on test.html structure:
            // index 3: 课程名称 (title)
            // index 4: 考试日期 (time) e.g. "2026-01-17(13:30-15:30)"
            // index 5: 考试地点
            // index 7: 考试座号
            // index 10: 考试名称 (description prefix)

            const courseName = cells[3]?.textContent?.trim() || '';
            const timeStr = cells[4]?.textContent?.trim() || '';
            const location = cells[5]?.textContent?.trim() || '';
            const seatNumber = cells[7]?.textContent?.trim() || '';
            const examName = cells[10]?.textContent?.trim() || '';

            if (!courseName || !timeStr) return null;

            const { start, end } = this.parseTime(timeStr);
            const fullLocation = seatNumber ? `${location} (座号: ${seatNumber})` : location;

            return {
                title: courseName,
                description: examName,
                startTime: start,
                endTime: end,
                location: fullLocation,
                type: 'EXAM'
            };
        }).filter((item): item is ParsedTask => item !== null);
    }

    /**
     * Parse TXT content (Tab separated values)
     * Header line example: 学年	学期	课程名称	考试日期...
     */
    static parseTxt(content: string): ParsedTask[] {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split('\t').map(h => h.trim());
        const titleIdx = headers.indexOf('课程名称');
        const timeIdx = headers.indexOf('考试日期');
        const locIdx = headers.indexOf('考试地点');
        const seatIdx = headers.indexOf('考试座号');
        const descIdx = headers.indexOf('考试名称');

        if (titleIdx === -1 || timeIdx === -1) return [];

        return lines.slice(1).map(line => {
            const cols = line.split('\t').map(c => c.trim());
            if (cols.length <= Math.max(titleIdx, timeIdx)) return null;

            const title = cols[titleIdx];
            const timeStr = cols[timeIdx];
            if (!title || !timeStr) return null;

            const { start, end } = this.parseTime(timeStr);
            const loc = cols[locIdx] || '';
            const seat = cols[seatIdx] || '';
            const examName = cols[descIdx] || '';

            const fullLocation = seat ? `${loc} (座号: ${seat})` : loc;

            return {
                title,
                description: examName,
                startTime: start,
                endTime: end,
                location: fullLocation,
                type: 'EXAM'
            };
        }).filter((item): item is ParsedTask => item !== null);
    }

    /**
     * Parse Excel file buffer
     */
    static parseExcel(buffer: ArrayBuffer): ParsedTask[] {
        const workbook = read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays to handle headers easily
        const jsonData = utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (jsonData.length < 2) return [];

        const headers = jsonData[0].map((h: any) => String(h).trim());

        // Locate columns
        // Support flexible header names
        const findCol = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

        const titleIdx = findCol(['课程名称', '科目', 'Title', 'Course']);
        const timeIdx = findCol(['考试日期', '时间', 'Time', 'Date']);
        const locIdx = findCol(['考试地点', '教室', 'Location', 'Place']);
        const seatIdx = findCol(['座号', 'Seat']);
        const descIdx = findCol(['考试名称', '备注', 'Description']);

        if (titleIdx === -1 || timeIdx === -1) return [];

        return jsonData.slice(1).map(row => {
            if (!row || row.length === 0) return null;

            const title = row[titleIdx];
            const timeStr = row[timeIdx];

            if (!title || !timeStr) return null;

            const { start, end } = this.parseTime(String(timeStr));
            const loc = row[locIdx] || '';
            const seat = row[seatIdx] || '';
            const examName = row[descIdx] || '';

            const fullLocation = seat ? `${loc} (座号: ${seat})` : String(loc);

            return {
                title: String(title),
                description: String(examName),
                startTime: start,
                endTime: end,
                location: fullLocation,
                type: 'EXAM'
            };
        }).filter((item): item is ParsedTask => item !== null);
    }

    /**
     * Parse CSV string
     * Standard CSV format with comma separation
     * Handles quoted fields roughly
     */
    static parseCsv(content: string): ParsedTask[] {
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return [];

        // Simple CSV splitter that respects quotes is complex, 
        // but for this use case we can try simple split first or a regex
        // Let's use a regex that handles quotes
        const parseLine = (line: string) => {
            const result = [];
            let current = '';
            let inQuote = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
        };

        const headers = parseLine(lines[0]);

        const findCol = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

        const titleIdx = findCol(['课程名称', '科目', 'Title', 'Course']);
        const timeIdx = findCol(['考试日期', '时间', 'Time', 'Date']);
        const locIdx = findCol(['考试地点', '教室', 'Location', 'Place']);
        const seatIdx = findCol(['座号', 'Seat']);
        const descIdx = findCol(['考试名称', '备注', 'Description']);

        if (titleIdx === -1 || timeIdx === -1) return [];

        return lines.slice(1).map(line => {
            const cols = parseLine(line);
            if (cols.length <= Math.max(titleIdx, timeIdx)) return null;

            const title = cols[titleIdx];
            const timeStr = cols[timeIdx];
            if (!title || !timeStr) return null;

            const { start, end } = this.parseTime(timeStr);
            const loc = cols[locIdx] || '';
            const seat = cols[seatIdx] || '';
            const examName = cols[descIdx] || '';

            const fullLocation = seat ? `${loc} (座号: ${seat})` : loc;

            return {
                title,
                description: examName,
                startTime: start,
                endTime: end,
                location: fullLocation,
                type: 'EXAM'
            };
        }).filter((item): item is ParsedTask => item !== null);
    }

    /**
     * Helper to parse time string like "2026-01-17(13:30-15:30)"
     * Returns ISO strings or original string if parsing fails
     */
    private static parseTime(timeStr: string): { start: string, end: string } {
        try {
            // Regex to match "YYYY-MM-DD(HH:mm-HH:mm)"
            // Also supports space instead of parens if needed "2026-01-17 13:30-15:30"
            const match = timeStr.match(/(\d{4}-\d{2}-\d{2})[^\d]*(\d{1,2}:\d{2})[^\d]*(\d{1,2}:\d{2})/);

            if (match) {
                const [_, datePart, startTime, endTime] = match;
                const start = new Date(`${datePart}T${startTime}:00`).toISOString();
                const end = new Date(`${datePart}T${endTime}:00`).toISOString();
                return { start, end };
            }
        } catch (e) {
            console.error('Time parsing error', e);
        }

        // Fallback: return raw string as description or use current time? 
        // For now, return empty strings to indicate failure to parse strict date
        // But better to return partially valid date if possible.
        // Let's return empty and handle it in UI
        return { start: '', end: '' };
    }
}
