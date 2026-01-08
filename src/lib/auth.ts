import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartschedule-secret-key-2026';

export interface AuthUser {
    userId: string;
    email: string;
}

export function getAuthUser(request: NextRequest): AuthUser | null {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

export function requireAuth(request: NextRequest): AuthUser {
    const user = getAuthUser(request);
    if (!user) {
        throw new Error('Unauthorized');
    }
    return user;
}
