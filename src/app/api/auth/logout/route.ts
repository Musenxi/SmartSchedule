import { signOut } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST() {
    // Use NextAuth signOut to clear session
    // redirects: false prevents server-side redirect which causes CORS issues with fetch
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
}
