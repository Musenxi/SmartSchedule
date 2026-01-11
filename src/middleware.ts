
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const url = request.nextUrl;

    const isAdminSubdomain = hostname.startsWith('admin.');

    // Exclude API routes and static files from rewriting
    if (
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/_next') ||
        url.pathname.includes('.') // Exclude files with extensions (images, etc.)
    ) {
        return NextResponse.next();
    }

    if (isAdminSubdomain) {
        // Rewrite all requests from admin.domain.com/* to domain.com/admin/*
        // But avoid rewriting if it's already /admin (internal processing)
        if (!url.pathname.startsWith('/admin')) {
            url.pathname = `/admin${url.pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
