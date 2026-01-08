import { NextRequest, NextResponse } from 'next/server';
import { parsePDFSchedule } from '@/lib/pdf/parser';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (file.size === 0) {
            return NextResponse.json({ error: 'File is empty (0 bytes)' }, { status: 400 });
        }

        if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: 'File is not a PDF' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await parsePDFSchedule(buffer);

        return NextResponse.json({
            success: true,
            courses: result.courses,
            rawText: result.rawText,
            parseInfo: result.parseInfo,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Process failed' }, { status: 500 });
    }
}
