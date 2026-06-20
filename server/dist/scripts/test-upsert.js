import prisma from '../src/config/prisma.js';
async function run() {
    try {
        const user = await prisma.user.upsert({
            where: { githubId: 'TEST_UPSERT' },
            update: { username: 'test', avatarUrl: null, bio: 'test-bio' },
            create: { githubId: 'TEST_UPSERT', username: 'test', avatarUrl: null, bio: 'test-bio' },
        });
        console.log('Upsert result:', user);
    }
    catch (err) {
        console.error('Upsert error:');
        console.error(err);
    }
    finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}
run();
//# sourceMappingURL=test-upsert.js.map