import './config/env.js';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth.js';
import { trustedOrigins } from './config/env.js';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    instrument: ObserveInstrument,
  });
  app.enableCors({ origin: trustedOrigins, credentials: true });
  app
    .getHttpAdapter()
    .getInstance()
    .all('/api/auth/{*path}', toNodeHandler(auth));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
