import { signOut } from '@/auth';

export async function POST() {
    // Use NextAuth signOut to clear session
    // redirectTo ensures proper redirection after logout (though client might handle it via window.location)
    return await signOut({ redirectTo: '/login' });
}
