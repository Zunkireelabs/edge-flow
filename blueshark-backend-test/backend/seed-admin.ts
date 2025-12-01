import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('admin', 10);

  // Create admin user with hashed password
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: hashedPassword }, // Update password if user exists
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created/updated:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
