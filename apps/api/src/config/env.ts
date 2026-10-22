import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Find the API package from either src/config or dist/src/config.
let apiRoot = dirname(fileURLToPath(import.meta.url));
while (!existsSync(join(apiRoot, 'package.json'))) {
  const parent = dirname(apiRoot);
  if (parent === apiRoot) throw new Error('Cannot locate the API package root');
  apiRoot = parent;
}

config({
  path: process.env.DOTENV_CONFIG_PATH ?? resolve(apiRoot, '../../.env'),
  quiet: true,
});

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const trustedOrigins = (
  process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? 'http://localhost:3001'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function serviceUrl(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).replace(/\/$/, '');
}

export const dataServiceUrl = serviceUrl(
  'DATA_SERVICE_URL',
  'http://127.0.0.1:8001',
);

export const aiServiceUrl = serviceUrl(
  'AI_SERVICE_URL',
  'http://127.0.0.1:8002',
);

const configuredTimeout = Number(
  process.env.PIPELINE_REQUEST_TIMEOUT_MS ?? 120000,
);
export const pipelineRequestTimeoutMs =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 120000;
