import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TaskType } from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';

export async function POST(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tasks } = body;

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });
        }

        // Validate and prepare data
        const tasksToCreate: Prisma.TaskCreateManyInput[] = tasks.map((task: any) => ({
            userId: user.userId,
            title: task.title,
            description: task.description || '',
            type: TaskType.EXAM, // Default to EXAM
            startTime: task.startTime ? new Date(task.startTime) : null,
            dueDate: task.endTime ? new Date(task.endTime) : null, // Using dueDate as endTime for exams usually
            location: task.location || '',
            priority: 1, // Default priority for exams
            showInSchedule: true
        }));

        // Create tasks in transaction
        const result = await prisma.task.createMany({
            data: tasksToCreate
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `Successfully imported ${result.count} tasks`
        });

    } catch (error: any) {
        console.error('Batch create tasks error:', error);
        return NextResponse.json(
            { error: 'Failed to import tasks' },
            { status: 500 }
        );
    }
}
