import type { PrismaClient } from '../src/generated/prisma/client.js';
import { seedFeedbackResults } from './feedback-results.js';

it('upserts the same 50 distinct demo results on every run', async () => {
  const upsert = vi.fn();
  const prisma = { feedbackResult: { upsert } } as unknown as PrismaClient;
  await seedFeedbackResults(prisma);
  await seedFeedbackResults(prisma);
  expect(upsert).toHaveBeenCalledTimes(100);
  const firstRun = upsert.mock.calls.slice(0, 50);
  expect(upsert.mock.calls.slice(50)).toEqual(firstRun);
  expect(new Set(firstRun.map(([args]) => args.create.id)).size).toBe(50);
  expect(new Set(firstRun.map(([args]) => args.create.priority))).toEqual(
    new Set(['red', 'yellow', 'green']),
  );
});
