import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    console.log('Checking DB...');
    const userCount = await prisma.user.count();
    console.log('Total Users:', userCount);

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    console.log('Admins:', admins.length);
    admins.forEach(a => console.log(`- ${a.name} (${a.email})`));

    try {
        const settingCount = await (prisma as any).systemSetting.count();
        console.log('SystemSettings table accessible. Count:', settingCount);

        await (prisma as any).systemSetting.upsert({
            where: { key: 'test_key' },
            update: {},
            create: { key: 'test_key', value: 'test_value' }
        });
        console.log('Upsert successful.');

        // Cleanup test key
        await (prisma as any).systemSetting.delete({ where: { key: 'test_key' } });
    } catch (e) {
        console.error('SystemSetting Access Failed:', e);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
