import type { PrismaClient } from '../src/generated/prisma/client.js';
import { seedFeedbackResults } from './feedback-results.js';

it('upserts the same three demo results on every run', async () => {
  const upsert = vi.fn();
  const prisma = { feedbackResult: { upsert } } as unknown as PrismaClient;
  await seedFeedbackResults(prisma);
  await seedFeedbackResults(prisma);
  expect(upsert).toHaveBeenCalledTimes(6);
  const firstRun = upsert.mock.calls.slice(0, 3);
  expect(upsert.mock.calls.slice(3)).toEqual(firstRun);
  expect(firstRun.map(([args]) => args.create.priority)).toEqual([
    'red',
    'yellow',
    'green',
  ]);
});
