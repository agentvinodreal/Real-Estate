import { prisma } from '../src/lib/prisma.js'

async function run() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  })
  console.log('Total Leads in DB:', leads.length)
  console.log(JSON.stringify(leads, null, 2))
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
