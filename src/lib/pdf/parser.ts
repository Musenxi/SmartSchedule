// 直接导入 pdf-parse 核心模块，绕过 index.js 中的测试代码
// @ts-ignore
// const pdfParse = require('pdf-parse/lib/pdf-parse.js');

export interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    originalText?: string;
    confidence?: number;
}

export interface ParseResult {
    courses: RecognizedCourse[];
    rawText: string;
    parseInfo: {
        totalLines: number;
        matchedLines: number;
    };
}

// 星期映射
const DAY_MAP: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7,
    '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7,
    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 7,
    'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7,
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7,
};

export async function parsePDFSchedule(buffer: Buffer): Promise<ParseResult> {
    try {
        // 延迟加载 pdf-parse，只在实际需要时加载
        // @ts-ignore
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');

        // 使用 pdf-parse 提取文本
        const data = await pdfParse(buffer);
        const fullText = data.text;

        const result = extractCoursesFromText(fullText);

        return {
            courses: result.courses,
            rawText: fullText,
            parseInfo: result.parseInfo,
        };
    } catch (error: any) {
        throw new Error(`Failed to parse PDF: ${error?.message || 'Unknown error'}`);
    }
}

function extractCoursesFromText(text: string): {
    courses: RecognizedCourse[],
    parseInfo: { totalLines: number, matchedLines: number }
} {
    const courses: RecognizedCourse[] = [];
    const lines = text.split('\n');

    // 匹配模式：(节次)周次 / 地点 
    // 例如：(1-2)1-11 ()/ : : 5 210/
    const courseRegex = /\((\d+-\d+)\)\s*([\d\-\,]+)\s*.*?(\d{3,4}[\/;])/g;

    let match;
    let matchedLines = 0;

    // 尝试提取星期信息
    const dayContext: Record<number, number> = {};
    let currentDay = 0;

    // 先扫描一遍找出星期标记
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const [key, value] of Object.entries(DAY_MAP)) {
            if (line.includes(key)) {
                currentDay = value;
                break;
            }
        }
    }

    // 如果没找到星期标记，使用默认值
    if (currentDay === 0) {
        currentDay = 1; // 默认星期一
    }

    while ((match = courseRegex.exec(text)) !== null) {
        matchedLines++;

        const sectionMatch = match[1]; // 节次，如 "1-2"
        const weeksMatch = match[2];   // 周次，如 "1-11"
        const locationMatch = match[3]; // 教室，如 "210/"

        // 解析节次
        const [startPeriod, endPeriod] = sectionMatch.split('-').map(Number);

        // 清理周次和地点
        const weekRange = weeksMatch + '周';
        const location = locationMatch.replace(/[\/;]/g, '');

        // 尝试在匹配位置附近查找课程名称
        const matchIndex = match.index;
        const contextBefore = text.substring(Math.max(0, matchIndex - 100), matchIndex);
        const contextAfter = text.substring(matchIndex, Math.min(text.length, matchIndex + match[0].length + 50));

        // 提取课程名称（在匹配之前的中文词组）
        const courseNameMatches = contextBefore.match(/([^\s\(\)\d]{2,20})[^\(]*$/);
        let courseName = courseNameMatches ? courseNameMatches[1].trim() : '未识别课程';

        // 清理课程名称
        courseName = courseName.replace(/[\/\(\)\s]+$/, '').trim();
        if (!courseName || courseName.length < 2) {
            courseName = '未识别课程';
        }

        courses.push({
            name: courseName,
            dayOfWeek: currentDay,
            startPeriod,
            endPeriod,
            weekRange,
            location,
            originalText: match[0],
            confidence: 0.7,
        });
    }

    // 特殊处理 Web 课程
    if (text.includes("Web")) {
        const webMatches = text.match(/Web[^\n\(]*/gi);
    }

    return {
        courses,
        parseInfo: {
            totalLines: lines.length,
            matchedLines,
        }
    };
}
