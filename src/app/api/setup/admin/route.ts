
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // SECURITY CHECK: Ensure no users exist
        const count = await prisma.user.count();
        if (count > 0) {
            return NextResponse.json(
                { error: 'System already initialized. Cannot create admin.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create Admin
        const hashedPassword = await hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        return NextResponse.json({
            success: true,
            userId: user.id
        });

    } catch (error) {
        console.error('Setup admin failed:', error);
        return NextResponse.json(
            { error: 'Failed to create admin user' },
            { status: 500 }
        );
    }
}
