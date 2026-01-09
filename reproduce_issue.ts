
import { getCurrentWeek } from './src/lib/date-utils';
import { differenceInCalendarWeeks, startOfWeek } from 'date-fns';

const testFn = (firstWeekStart: Date, targetDate: Date) => {
    const start = startOfWeek(new Date(firstWeekStart), { weekStartsOn: 1 });
    const diffWeeks = differenceInCalendarWeeks(targetDate, start, { weekStartsOn: 1 });
    return Math.max(1, diffWeeks + 1);
}

const runTests = () => {
    const start1 = new Date('2024-01-01T00:00:00'); // Monday
    const start2 = new Date('2024-01-03T00:00:00'); // Wednesday

    console.log('--- Test 1: Calendar Weeks ---');
    console.log('Target Jan 1 (Mon) vs Jan 1 Start:', testFn(start1, new Date('2024-01-01T00:00:00')));
    console.log('Target Jan 7 (Sun) vs Jan 1 Start:', testFn(start1, new Date('2024-01-07T23:59:59')));
    console.log('Target Jan 8 (Mon) vs Jan 1 Start:', testFn(start1, new Date('2024-01-08T00:00:00')));

    console.log('\n--- Test 2: Calendar Weeks (Wed Start) ---');
    console.log('Target Jan 3 vs Wed Start:', testFn(start2, new Date('2024-01-03T00:00:00')));
    console.log('Target Jan 8 vs Wed Start:', testFn(start2, new Date('2024-01-08T00:00:00')));
}

runTests();
