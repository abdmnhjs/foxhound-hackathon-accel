import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { requiredEnv, trustedOrigins } from '../src/config/env.js';
import { prisma } from '../src/prisma/prisma.js';

const secret = requiredEnv('BETTER_AUTH_SECRET');
if (secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
}

export const auth = betterAuth({
  secret,
  baseURL: requiredEnv('BETTER_AUTH_URL'),
  basePath: '/api/auth',
  trustedOrigins,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, disableSignUp: true },
});
