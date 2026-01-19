export const WIDGET_SCRIPT_TEMPLATE = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: calendar-alt;

/**
 * SmartSchedule Widget
 * 智能课表小组件
 * 
 * 1. 复制 Profile -> 桌面小组件 中的 API 链接
 * 2. 粘贴到下方的 api_url 变量中
 */

const API_URL = "__API_URL__";

// File manager for caching
const fm = FileManager.local();
const cachePath = fm.joinPath(fm.documentsDirectory(), "smartschedule-cache.json");

// Main Logic
if (config.runsInWidget) {
    const widget = await createWidget();
    Script.setWidget(widget);
} else {
    // Preview
    const widget = await createWidget();
    await widget.presentMedium();
}

Script.complete();

async function createWidget() {
    const list = new ListWidget();
    list.setPadding(16, 16, 16, 16); // Strict Padding from Preview

    // Refresh Policy
    let data;
    try {
        data = await fetchData();
    } catch (e) {
        if (fm.fileExists(cachePath)) {
            data = JSON.parse(fm.readString(cachePath));
        }
    }

    if (!data) {
        list.addText("请连接网络初始化");
        return list;
    }

    // --- Data Prep ---
    const { scheduleName, week, day, date, todayCourses = [], tomorrowCourses = [] } = data;

    // Format Date using local time
    const dateObj = new Date(); // Use local time instead of server date
    const dateStr = (dateObj.getMonth() + 1) + "月" + dateObj.getDate() + "日 ";
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const dayStr = weekDays[dateObj.getDay()]; // Use local day instead of server day

    // Time Calc
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const getMinutes = (str) => {
        const [h, m] = str.split(':').map(Number);
        return h * 60 + m;
    };

    // Calculate State
    let currentCourse = null;
    let nextCourse = null;

    for (const c of todayCourses) {
        const start = getMinutes(c.startTime);
        const end = getMinutes(c.endTime);
        if (nowMinutes >= start && nowMinutes <= end) {
            currentCourse = c;
        } else if (nowMinutes < start) {
            if (!nextCourse) nextCourse = c;
        }
    }

    // --- Colors ---
    const textWhite = Color.dynamic(Color.black(), Color.white());
    const textGray = Color.dynamic(new Color("#666666"), new Color("#cccccc"));
    const accentRed = new Color("#ef4444");
    const sepColor = Color.dynamic(new Color("#000000", 0.15), new Color("#ffffff", 0.15));

    // --- Header ---
    const headerStack = list.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();
    headerStack.size = new Size(0, 20); // Fixed Height roughly

    // Date
    const dateT = headerStack.addText(dateStr);
    dateT.font = Font.boldSystemFont(13);
    dateT.textColor = textWhite;

    // Day
    const dayT = headerStack.addText(dayStr);
    dayT.font = Font.boldSystemFont(13);
    dayT.textColor = accentRed;

    headerStack.addSpacer(8);

    // Schedule Name
    const nameT = headerStack.addText(scheduleName);
    nameT.font = Font.systemFont(13);
    nameT.textColor = textGray;
    nameT.lineLimit = 1;

    headerStack.addSpacer();

    // Week Bubble
    const weekStack = headerStack.addStack();
    weekStack.backgroundColor = new Color("#ef4444", 0.1);
    weekStack.cornerRadius = 4;
    weekStack.setPadding(2, 6, 2, 6);

    const weekT = weekStack.addText("第 " + week + " 周");
    weekT.font = Font.systemFont(11);
    weekT.textColor = accentRed;

    list.addSpacer(20); // Header Bottom Margin

    // --- Renderers ---

    const drawContent = (stack, course, isCompact) => {
        const s = stack.addStack();
        s.layoutHorizontally();
        s.centerAlignContent(); // Vertically center within the row

        // Bar
        const bar = s.addStack();
        bar.size = new Size(isCompact ? 4 : 5, isCompact ? 44 : 48); // 44vs48 height
        bar.cornerRadius = 2;
        bar.backgroundColor = new Color(course.color || "#facc15");

        s.addSpacer(10);

        // Text Stack
        const txt = s.addStack();
        txt.layoutVertically();

        const cName = course.type === 'exam' ? '[考试] ' + course.name : course.name;
        const t1 = txt.addText(cName);
        t1.font = Font.boldSystemFont(16);
        t1.textColor = textWhite;
        t1.lineLimit = 1;

        txt.addSpacer(2);

        const t2 = txt.addText(course.startTime + " - " + course.endTime);
        t2.font = Font.mediumSystemFont(13);
        t2.textColor = textWhite;

        txt.addSpacer(2);

        // Location
        const locStr = course.location ? "@" + course.location : "";
        if (locStr) {
            const t3 = txt.addText(locStr);
            t3.font = Font.systemFont(12);
            t3.textColor = textGray;
            t3.lineLimit = 1;
        }
    };

    const drawDualView = (c1, c2) => {
        const wrapper = list.addStack();
        wrapper.layoutHorizontally();
        // wrapper.size = new Size(0, 158 - 32 - 40); // Fill remaining height? Scriptable handles auto.

        // Left Column 126px
        const left = wrapper.addStack();
        left.layoutVertically();
        left.size = new Size(126, 0);

        const lLabel = left.addText("当前");
        lLabel.font = Font.systemFont(12);
        lLabel.textColor = textWhite;
        left.addSpacer(6);
        drawContent(left, c1, true);

        wrapper.addSpacer(16);

        // Separator
        const sep = wrapper.addStack();
        sep.size = new Size(0.5, 85);
        sep.backgroundColor = sepColor;

        wrapper.addSpacer(16);

        // Right Column 138px
        const right = wrapper.addStack();
        right.layoutVertically();
        right.size = new Size(138, 0);

        const rLabel = right.addText("接下来");
        rLabel.font = Font.systemFont(12);
        rLabel.textColor = textWhite;
        right.addSpacer(6);
        drawContent(right, c2, true);
    };

    const drawSingleView = (label, course) => {
        // Vertical Center
        list.addSpacer();

        const wrapper = list.addStack();
        wrapper.layoutVertically();
        // wrapper.centerAlignContent(); // Horizontal center? 
        // Based on preview, text is Left Aligned, but the BLOCK might be centered?
        // Preview: "Content: Single Centered". 
        // HTML: flex-col justify-center.

        const lLabel = wrapper.addText(label);
        lLabel.font = Font.systemFont(12);
        lLabel.textColor = textWhite;

        wrapper.addSpacer(6);
        drawContent(wrapper, course, false);

        list.addSpacer();
    };

    const drawEmptyView = () => {
        list.addSpacer();

        const hStack = list.addStack();
        hStack.layoutHorizontally(); // Enforce horizontal layout
        hStack.addSpacer(); // Left push

        const stack = hStack.addStack();
        stack.layoutVertically();
        stack.centerAlignContent(); // Align children horizontally center

        const emojiStack = stack.addStack();
        emojiStack.layoutHorizontally();
        emojiStack.addSpacer();
        const emoji = emojiStack.addText("🎉");
        emoji.font = Font.systemFont(30);
        emojiStack.addSpacer();

        stack.addSpacer(8);

        const textStack = stack.addStack();
        textStack.layoutHorizontally();
        textStack.addSpacer();
        const t = textStack.addText("今日课程已结束，明天也没有课");
        t.font = Font.systemFont(15);
        t.textColor = textGray;
        textStack.addSpacer();

        hStack.addSpacer(); // Right push

        list.addSpacer();
    };

    // Logic
    if (currentCourse && nextCourse) {
        drawDualView(currentCourse, nextCourse);
    } else if (currentCourse && !nextCourse) {
        drawSingleView("当前", currentCourse);
    } else if (!currentCourse && nextCourse) {
        drawSingleView("接下来", nextCourse);
    } else {
        if (tomorrowCourses.length > 0) {
            drawSingleView("明天", tomorrowCourses[0]);
        } else {
            drawEmptyView();
        }
    }

    return list;
}

async function fetchData() {
    if (!API_URL || API_URL.includes("YOUR_TOKEN")) {
        console.log("Please set API_URL");
        return null;
    }
    
    // Get device local date and format as YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDate = \`\${year}-\${month}-\${day}\`;
    
    // Add date parameter to URL
    const separator = API_URL.includes('?') ? '&' : '?';
    const urlWithDate = API_URL + separator + 'date=' + encodeURIComponent(localDate);
    
    const req = new Request(urlWithDate);
    const json = await req.loadJSON();
    // Cache it
    fm.writeString(cachePath, JSON.stringify(json));
    return json;
}
`;
