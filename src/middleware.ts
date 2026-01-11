import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const hostname = req.headers.get('host') || '';
    const url = req.nextUrl;
    const isAdminSubdomain = hostname.startsWith('admin.');

    // Admin subdomain rewrite logic from previous middleware
    if (isAdminSubdomain) {
        if (!url.pathname.startsWith('/admin')) {
            url.pathname = `/admin${url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    // Auth logic is handled by authConfig.callbacks.authorized
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
