export interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    credits?: number;
}

/**
 * A basic HTML parser for common academic management systems.
 * It searches for table structures and attempts to extract course information.
 */
export function parseAcademicHTML(html: string): RecognizedCourse[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const courses: RecognizedCourse[] = [];

    // Strategy 1: Specific "ZhengFang" / Kingosoft Style
    // Structure: <td id="day-startNode"> <div class="timetable_con"> ... </div> </td>
    const zfCells = doc.querySelectorAll('td.td_wrap');
    if (zfCells.length > 0) {
        zfCells.forEach((cell) => {
            const id = cell.getAttribute('id') || '';
            const matchId = id.match(/^(\d+)-(\d+)$/);
            if (!matchId) return;

            const dayOfWeek = parseInt(matchId[1], 10);
            const startPeriodInitial = parseInt(matchId[2], 10);

            const contentDivs = cell.querySelectorAll('.timetable_con');
            contentDivs.forEach((div) => {
                const htmlDiv = div as HTMLElement;
                const titleSpan = div.querySelector('.title');
                if (!titleSpan) return;

                const name = (titleSpan as HTMLElement).innerText.trim();
                let teacher = "";
                let location = "";
                let weekRange = "";
                let credits: number | undefined;
                let startPeriod = startPeriodInitial;
                let endPeriod = startPeriodInitial + 1; // Default duration of 2

                // Extract details from paragraphs
                const ps = div.querySelectorAll('p');
                ps.forEach((p) => {
                    const text = (p as HTMLElement).innerText.trim();
                    const iconSpan = p.querySelector('span[title]');
                    const titleType = iconSpan?.getAttribute('title') || "";

                    // Try to extract credits from any text line if not already found
                    if (!credits) {
                        const creditMatch = text.match(/(?:学分[:：]?\s*(\d+(\.\d+)?)|(\d+(\.\d+)?)\s*学分)/);
                        if (creditMatch) {
                            // match[1] is for "学分: 2.0", match[3] is for "2.0 学分"
                            const val = parseFloat(creditMatch[1] || creditMatch[3]);
                            if (!isNaN(val)) credits = val;
                        }
                    }

                    if (titleType.includes('教师')) {
                        teacher = text.replace('教师', '').trim();
                    } else if (titleType.includes('地点')) {
                        location = text.replace('上课地点', '').trim();
                    } else if (titleType.includes('学分')) {
                        const val = parseFloat(text);
                        if (!isNaN(val)) credits = val;
                    } else if (titleType.includes('节/周')) {
                        // Example: "(10-12节)7周,14周" or "(10-11节)1-16周"
                        const timeText = text;

                        // Parse Period Range
                        const periodMatch = timeText.match(/\((\d+)-(\d+)节\)/);
                        if (periodMatch) {
                            startPeriod = parseInt(periodMatch[1], 10);
                            endPeriod = parseInt(periodMatch[2], 10);
                        }

                        // Parse Week Range (heuristic)
                        const weekMatch = timeText.match(/\)(.+)$/);
                        if (weekMatch) {
                            weekRange = weekMatch[1].replace(/周/g, '').trim();
                        } else {
                            // Fallback: Remove the section part (e.g. (1-2节)) and trim
                            weekRange = timeText.replace(/[\(\)0-9\-]+节/, '').replace(/周/g, '').trim();
                        }
                    }
                });

                if (name) {
                    courses.push({
                        name,
                        teacher,
                        location,
                        dayOfWeek,
                        startPeriod,
                        endPeriod,
                        weekRange,
                        credits
                    });
                }
            });
        });

        if (courses.length > 0) {
            return deduplicateCourses(courses);
        }
    }

    // Strategy 2: Generic Fallback (Existing Logic)
    // Look for <td> elements that seem to contain course info
    const cells = doc.querySelectorAll('td, div[class*="course"], div[class*="item"]');

    cells.forEach((cell) => {
        // Cast to HTMLElement to access innerText which might not exist on Element in strict TS lib
        const htmlCell = cell as HTMLElement;
        const text = htmlCell.innerText || htmlCell.textContent || "";
        if (text.length < 5) return;

        // Skip cells that were processed by Strategy 1 if they have the specific class
        if (htmlCell.classList.contains('timetable_con') || htmlCell.classList.contains('td_wrap')) return;

        const lines = text.split(/\n|<br\/?>/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);

        if (lines.length >= 2) {
            const name = lines[0];
            let teacher = "";
            let location = "";
            let weekRange = "1-16";

            lines.slice(1).forEach((line: string) => {
                if (line.includes('周')) {
                    const match = line.match(/\d+-\d+/);
                    if (match) weekRange = match[0];
                } else if (line.match(/[\u4e00-\u9fa5]{2,4}/) && !teacher) {
                    teacher = line;
                } else if (!location) {
                    location = line;
                }
            });

            // If we found something that looks like a course name
            if (name.length > 1 && !name.includes('星期') && !name.includes('节') && !name.match(/^\d/)) {
                courses.push({
                    name,
                    teacher,
                    location,
                    dayOfWeek: 1, // Generic fallback cannot determine day easily
                    startPeriod: 1,
                    endPeriod: 2,
                    weekRange
                });
            }
        }
    });

    return deduplicateCourses(courses);
}

function deduplicateCourses(courses: RecognizedCourse[]): RecognizedCourse[] {
    return Array.from(new Set(courses.map(s => JSON.stringify(s)))).map(s => JSON.parse(s));
}
