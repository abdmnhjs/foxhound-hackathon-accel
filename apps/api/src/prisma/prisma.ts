import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { requiredEnv } from '../config/env.js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requiredEnv('DATABASE_URL') }),
});
