import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../src/prisma/prisma.js';

try {
  for (const name of ['user', 'founder']) {
    const password = await hashPassword(name);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: `${name}@foxhound.test` },
        create: {
          id: randomUUID(),
          name,
          email: `${name}@foxhound.test`,
          emailVerified: true,
        },
        update: { name, emailVerified: true },
      });
      const account = await tx.account.findFirst({
        where: { userId: user.id, providerId: 'credential' },
      });
      if (account)
        await tx.account.update({
          where: { id: account.id },
          data: { password },
        });
      else
        await tx.account.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            accountId: user.id,
            providerId: 'credential',
            password,
          },
        });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    console.log(`Account ${name} is ready.`);
  }
} finally {
  await prisma.$disconnect();
}
