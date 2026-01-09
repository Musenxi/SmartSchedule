// 初始化种子数据脚本
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 开始创建种子数据...');

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('password', 10);

    const user = await prisma.user.upsert({
        where: { email: 'your@email.com' },
        update: {},
        create: {
            email: 'your@email.com',
            password: hashedPassword,
            name: '测试用户',
        },
    });

    console.log('✅ 用户创建成功:', user.email);

    // 创建默认课表
    const schedule = await prisma.schedule.upsert({
        where: { id: 'default-schedule' },
        update: {},
        create: {
            id: 'default-schedule',
            userId: user.id,
            name: '大二下',
            firstWeekStart: new Date('2025-09-08'),
            weekStartDay: 1,
            totalWeeks: 19,
            periodsPerDay: 12,
            isActive: true,
            enableAutoTimeTableSwitch: true,
        },
    });

    console.log('✅ 课表创建成功:', schedule.name);

    // 创建默认时间表（属于用户而非课表）
    const timeTable = await prisma.timeTable.upsert({
        where: { id: 'default-timetable' },
        update: {},
        create: {
            id: 'default-timetable',
            userId: user.id,
            name: '冬令时 10.1-4.30',
            sameDuration: false,
            isDefault: true,
            periods: {
                create: [
                    { number: 1, startTime: '08:00', endTime: '08:45' },
                    { number: 2, startTime: '08:50', endTime: '09:35' },
                    { number: 3, startTime: '09:50', endTime: '10:35' },
                    { number: 4, startTime: '10:40', endTime: '11:25' },
                    { number: 5, startTime: '11:30', endTime: '12:15' },
                    { number: 6, startTime: '13:30', endTime: '14:15' },
                    { number: 7, startTime: '14:20', endTime: '15:05' },
                    { number: 8, startTime: '15:20', endTime: '16:05' },
                    { number: 9, startTime: '16:10', endTime: '16:55' },
                    { number: 10, startTime: '18:30', endTime: '19:15' },
                    { number: 11, startTime: '19:20', endTime: '20:05' },
                    { number: 12, startTime: '20:10', endTime: '20:55' },
                ],
            },
        },
    });

    console.log('✅ 时间表创建成功:', timeTable.name);

    // 创建示例课程
    const courses = [
        {
            name: '大学英语AIII',
            color: '#F97316',
            credits: 3,
            times: [
                { dayOfWeek: 2, startPeriod: 2, endPeriod: 4, weekRange: '1-16', teacher: '张老师', location: '东湖校区 教1楼410' },
            ],
        },
        {
            name: '大学体育',
            color: '#3B82F6',
            credits: 1,
            times: [
                { dayOfWeek: 2, startPeriod: 6, endPeriod: 7, weekRange: '1-16', teacher: '李老师', location: '东湖校区 大体' },
            ],
        },
        {
            name: '毛泽东思想和中国...',
            color: '#EF4444',
            credits: 3,
            times: [
                { dayOfWeek: 2, startPeriod: 8, endPeriod: 9, weekRange: '1-16', teacher: '王老师', location: '东湖校区 教5楼...' },
            ],
        },
        {
            name: '地球科学概论',
            color: '#EAB308',
            credits: 2,
            times: [
                { dayOfWeek: 6, startPeriod: 8, endPeriod: 9, weekRange: '1-16', teacher: '赵老师', location: '东湖校区 教5楼308' },
            ],
        },
        {
            name: '汽车文化',
            color: '#A855F7',
            credits: 2,
            times: [
                { dayOfWeek: 3, startPeriod: 10, endPeriod: 11, weekRange: '1-16', teacher: '刘老师', location: '衣锦校区 教学主楼105' },
            ],
        },
    ];

    for (const courseData of courses) {
        const course = await prisma.course.create({
            data: {
                scheduleId: schedule.id,
                name: courseData.name,
                color: courseData.color,
                credits: courseData.credits,
                times: {
                    create: courseData.times,
                },
            },
        });
        console.log('✅ 课程创建成功:', course.name);
    }

    console.log('\n🎉 种子数据创建完成！');
    console.log('📧 测试账号: your@email.com');
    console.log('🔑 密码: password');
}

main()
    .catch((e) => {
        console.error('❌ 错误:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
