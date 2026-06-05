import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRaw`SELECT DATABASE()`
  console.log(result)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })