const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { kycStatus: 'PENDING' },
    select: { id: true, username: true, kycPhotoUrl: true, kycSelfieUrl: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
