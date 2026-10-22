import type { PrismaClient } from '../src/generated/prisma/client.js';

export async function seedFeedbackResults(prisma: PrismaClient) {
  const results = [
    {
      id: 'demo-result-performance',
      title: 'Slow dashboard with large datasets',
      summary:
        'The dashboard takes over 12 seconds to load with more than 50,000 records.',
      score: 78,
      priority: 'red' as const,
      contradiction: null,
    },
    {
      id: 'demo-result-csv',
      title: 'CSV export for reporting',
      summary:
        'A customer needs CSV exports for their monthly reporting workflow.',
      score: 52,
      priority: 'yellow' as const,
      contradiction: null,
    },
    {
      id: 'demo-result-dark-mode',
      title: 'Dark mode',
      summary: 'Users request a dark theme for more comfortable use at night.',
      score: 21,
      priority: 'green' as const,
      contradiction: null,
    },
  ];
  for (const result of results) {
    await prisma.feedbackResult.upsert({
      where: { id: result.id },
      create: result,
      update: result,
    });
  }
}
