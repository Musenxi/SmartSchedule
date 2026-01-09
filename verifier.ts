import { parseWeekRange } from './src/lib/date-utils';

// Simulate the input from the HTML file
const rawTimeText = "(10-11节)1-6周,8-10周(双),11-13周,15-16周";

console.log('--- Testing Parsing Logic for Happiness Economics ---');
console.log('Raw text:', rawTimeText);

// Simulate the simplified HTML Parser extraction logic
let extractedWeekRange = '';
const weekMatch = rawTimeText.match(/\)(.+)$/);
if (weekMatch) {
    extractedWeekRange = weekMatch[1].trim();
} else {
    extractedWeekRange = rawTimeText.replace(/[\(\)0-9\-]+节/, '').trim();
}

console.log('Extracted Week Range:', extractedWeekRange);

// Now test parseWeekRange
const weeks = parseWeekRange(extractedWeekRange);
console.log('Parsed Weeks:', weeks.join(', '));

// Expected Result:
// 1-6: 1,2,3,4,5,6
// 8-10(双): 8, 10
// 11-13: 11,12,13
// 15-16: 15,16
const expected = [1, 2, 3, 4, 5, 6, 8, 10, 11, 12, 13, 15, 16];

const missing = expected.filter(w => !weeks.includes(w));
const extra = weeks.filter(w => !expected.includes(w));

if (missing.length === 0 && extra.length === 0) {
    console.log('✅ VERIFICATION PASSED');
    process.exit(0);
} else {
    console.log('❌ VERIFICATION FAILED');
    console.log('Missing weeks:', missing);
    console.log('Extra weeks:', extra);
    process.exit(1);
}
