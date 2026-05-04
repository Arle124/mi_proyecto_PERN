// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { correo: 'admin@novapalma.com' },
    update: {},
    create: {
      primerNombre: 'Admin',
      primerApellido: 'Sistema',
      correo: 'admin@novapalma.com',
      password: 'hash_de_prueba', // Aquí usarías bcrypt después
      rol: 'ADMIN'
    },
  })
  console.log({ admin })
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())