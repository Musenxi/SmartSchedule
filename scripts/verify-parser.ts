import fs from 'fs';
import path from 'path';
import { ExamParser } from '../src/lib/parsers/ExamParser';
import { utils, write } from 'xlsx';

async function test() {
    console.log('--- Starting ExamParser Verification ---');

    // 1. Test HTML
    const htmlPath = path.resolve('/root/projects/smartschedule/test.html');
    if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf-8');
        // Mock DOMParser for Node environment since ExamParser uses it
        // We can use jsdom or just basic regex for this test if we don't want to install jsdom.
        // But ExamParser uses standard DOMParser. 
        // In Node, DOMParser is not available by default.
        // Code is designed for Browser (TaskImportModal runs in browser).
        // Testing browser code in Node is tricky without JSDOM.

        console.log('[SKIP] HTML Parsing verification skipped in Node environment (requires DOMParser). relying on manual test.');
    }

    // 2. Test TXT
    const txtPath = path.resolve('/root/projects/smartschedule/文件1768121083897.txt');
    if (fs.existsSync(txtPath)) {
        console.log('\n--- Testing TXT Parsing ---');
        const txt = fs.readFileSync(txtPath, 'utf-8');
        const tasks = ExamParser.parseTxt(txt);
        console.log(`Parsed ${tasks.length} tasks from TXT.`);
        if (tasks.length > 0) {
            console.log('Sample Task:', tasks[0]);
        } else {
            console.error('FAILED: No tasks parsed from TXT.');
        }
    }

    // 3. Test XLSX
    console.log('\n--- Testing XLSX Parsing ---');
    // Create a mock XLSX
    const data = [
        ['学年', '学期', '课程名称', '考试时间', '考试地点', '座号', '考试名称'],
        ['2025-2026', '1', '高等数学', '2026-01-20(09:00-11:00)', '教1-101', '01', '期末考试']
    ];
    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet(data);
    utils.book_append_sheet(wb, ws, 'Sheet1');
    const buffer = write(wb, { type: 'array', bookType: 'xlsx' });

    // Parse it
    const xlsxTasks = ExamParser.parseExcel(buffer);
    console.log(`Parsed ${xlsxTasks.length} tasks from generated XLSX.`);
    if (xlsxTasks.length > 0) {
        console.log('Sample Task:', xlsxTasks[0]);
        if (xlsxTasks[0].title === '高等数学' && xlsxTasks[0].location.includes('教1-101')) {
            console.log('SUCCESS: XLSX parsing logic verified.');
        } else {
            console.error('FAILED: Data mismatch.');
        }
    } else {
        console.error('FAILED: No tasks parsed from XLSX.');
    }
}

test().catch(console.error);
