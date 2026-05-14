const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('Logs:', JSON.stringify(logs, null, 2));

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Orders:', JSON.stringify(orders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
