import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { verifyTurnstileToken } from "@/lib/turnstile"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    providers: [
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                turnstileToken: { label: "Turnstile Token", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // Verify Turnstile
                const isHuman = await verifyTurnstileToken(credentials.turnstileToken as string || '');
                if (!isHuman) {
                    throw new Error("TurnstileVerificationFailed");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                if (!user || !user.password) return null;

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (isValid) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.avatar,
                        role: user.role
                    }
                }
                return null;
            }
        })
    ],
    events: {
        async createUser({ user }) {
            if (!user.id) return;

            // Initialize default time table
            await prisma.timeTable.create({
                data: {
                    userId: user.id,
                    name: '默认时间表',
                    sameDuration: true,
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
                    }
                }
            });

            // Initialize default schedule
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            monday.setHours(0, 0, 0, 0);

            await prisma.schedule.create({
                data: {
                    userId: user.id,
                    name: "默认课表",
                    firstWeekStart: monday,
                    isActive: true,
                },
            });
        },
        async signIn({ user }) {
            if (!user.id) return;

            // Check if user has any timetables
            const timeTableCount = await prisma.timeTable.count({
                where: { userId: user.id }
            });

            // If no timetables, initialize default data (same logic as createUser)
            if (timeTableCount === 0) {
                // Initialize default time table
                await prisma.timeTable.create({
                    data: {
                        userId: user.id,
                        name: '默认时间表',
                        sameDuration: true,
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
                        }
                    }
                });

                // Initialize default schedule if none exists
                const scheduleCount = await prisma.schedule.count({
                    where: { userId: user.id }
                });

                if (scheduleCount === 0) {
                    const today = new Date();
                    const day = today.getDay();
                    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(today.setDate(diff));
                    monday.setHours(0, 0, 0, 0);

                    await prisma.schedule.create({
                        data: {
                            userId: user.id,
                            name: "默认课表",
                            firstWeekStart: monday,
                            isActive: true,
                        },
                    });
                }
            }
        }
    }
})
