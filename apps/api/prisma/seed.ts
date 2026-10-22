import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { prisma } from '../src/prisma/prisma.js';
import { seedFeedbackResults } from './feedback-results.js';

try {
  await seedFeedbackResults(prisma);
  for (const name of ['user', 'founder']) {
    const password = await hashPassword(name);
    await prisma.$transaction(async (transaction) => {
      // Prisma 7's generated interactive transaction type currently loses the
      // model delegates under TypeScript 6, although the runtime client keeps
      // them. Keep the transaction while restoring the generated client type.
      const tx = transaction as unknown as PrismaClient;
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
