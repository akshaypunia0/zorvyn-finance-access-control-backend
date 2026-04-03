import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma, disconnectDB } from '../src/config/db.js';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName: 'System Admin',
      password: hash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: {
      fullName: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      password: hash,
    },
  });

  console.log(`Seed OK — admin user: ${email} (set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to override)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
