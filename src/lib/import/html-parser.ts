export interface RecognizedCourse {
    name: string;
    teacher?: string;
    location?: string;
    dayOfWeek: number;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
}

/**
 * A basic HTML parser for common academic management systems.
 * It searches for table structures and attempts to extract course information.
 */
export function parseAcademicHTML(html: string): RecognizedCourse[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const courses: RecognizedCourse[] = [];

    // Strategy 1: Look for <td> elements that seem to contain course info
    // Often course info in academic systems is inside a grid <td> with specific patterns
    // e.g., "课程名<br/>教师<br/>地点<br/>1-16周"

    const cells = doc.querySelectorAll('td, div[class*="course"], div[class*="item"]');

    cells.forEach((cell) => {
        // Cast to HTMLElement to access innerText which might not exist on Element in strict TS lib
        const htmlCell = cell as HTMLElement;
        const text = htmlCell.innerText || htmlCell.textContent || "";
        if (text.length < 5) return;

        // Common patterns:
        // Course Name
        // [Teacher]
        // [Location]
        // [Week Range] (e.g. 1-16周 or 1-16(周))

        const lines = text.split(/\n|<br\/?>/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);

        if (lines.length >= 2) {
            // Very heuristic extraction
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
            if (name.length > 1 && !name.includes('星期') && !name.includes('节')) {
                // Determine day and periods if possible from parent/context
                // For now, we'll just extract what we can and let the user verify
                // Mapping day/period from HTML table is hard without knowing schema
                // so we prioritize extracting the raw metadata.

                courses.push({
                    name,
                    teacher,
                    location,
                    dayOfWeek: 1, // Default, user will adjust in Verifier
                    startPeriod: 1,
                    endPeriod: 2,
                    weekRange
                });
            }
        }
    });

    // Remove duplicates
    return Array.from(new Set(courses.map(s => JSON.stringify(s)))).map(s => JSON.parse(s));
}
