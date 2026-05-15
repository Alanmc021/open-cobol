import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@opencobol.local'
  const password = process.env['SEED_ADMIN_PASSWORD'] ?? 'changeme123!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`User ${email} already exists — skipping seed.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, role: 'ADMIN' },
  })

  console.log(`Admin user created: ${user.email} (id: ${user.id})`)
  console.log(`Password: ${password}`)
  console.log(`\nLogin: POST /api/auth/login  { "email": "${email}", "password": "${password}" }`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
