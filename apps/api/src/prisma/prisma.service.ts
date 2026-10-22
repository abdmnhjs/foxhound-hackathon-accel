import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { prisma } from './prisma.js';

@Injectable()
export class PrismaService implements OnApplicationShutdown {
  readonly client = prisma;

  async onApplicationShutdown() {
    await this.client.$disconnect();
  }
}
