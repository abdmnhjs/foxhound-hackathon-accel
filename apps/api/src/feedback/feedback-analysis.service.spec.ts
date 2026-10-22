import { BadGatewayException } from '@nestjs/common';
import { FeedbackAnalysisService } from './feedback-analysis.service.js';
import type { FeedbackPipelineClient } from './feedback-pipeline.client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

vi.mock('../prisma/prisma.service.js', () => ({ PrismaService: class {} }));

describe('FeedbackAnalysisService', () => {
  const findMany = vi.fn();
  const deleteMany = vi.fn();
  const create = vi.fn();
  const transaction = vi.fn();
  const prepare = vi.fn();
  const analyze = vi.fn();
  const service = new FeedbackAnalysisService(
    {
      client: {
        feedbackUser: { findMany },
        feedbackResult: { deleteMany, create },
        $transaction: transaction,
      },
    } as unknown as PrismaService,
    { prepare, analyze } as unknown as FeedbackPipelineClient,
  );

  beforeEach(() => vi.clearAllMocks());

  it('normalizes, analyzes, and stores complete analysis groups', async () => {
    const feedback = {
      id: 'feedback-1',
      text: 'Synthetic feedback.',
      createdAt: new Date('2026-10-22T12:00:00Z'),
      userId: 'user-1',
      plan: 'Pro',
    };
    const payload = {
      feedbacks: [
        {
          ...feedback,
          createdAt: '2026-10-22T12:00:00.000Z',
        },
      ],
    };
    const groups = [
      {
        title: 'Synthetic theme',
        summary: 'A synthetic summary.',
        score: 80,
        priority: 'red' as const,
        contradiction: null,
        feedbackIds: ['feedback-1'],
      },
    ];
    findMany.mockResolvedValue([feedback]);
    prepare.mockResolvedValue(payload);
    analyze.mockResolvedValue({ groups });
    deleteMany.mockReturnValue({ operation: 'delete' });
    create.mockReturnValue({ operation: 'create' });
    transaction.mockResolvedValue([]);

    await expect(service.synchronize()).resolves.toEqual({
      processedFeedbacks: 1,
      groups: 1,
    });
    expect(prepare).toHaveBeenCalledWith(payload);
    expect(analyze).toHaveBeenCalledWith(payload);
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Synthetic theme',
        feedbacks: { connect: [{ id: 'feedback-1' }] },
      }),
    });
    expect(transaction).toHaveBeenCalledOnce();
  });

  it('rejects missing or duplicated AI feedback references', async () => {
    findMany.mockResolvedValue([
      {
        id: 'feedback-1',
        text: 'Synthetic feedback.',
        createdAt: new Date('2026-10-22T12:00:00Z'),
        userId: null,
        plan: null,
      },
    ]);
    prepare.mockResolvedValue({
      feedbacks: [
        {
          id: 'feedback-1',
          text: 'Synthetic feedback.',
          createdAt: '2026-10-22T12:00:00Z',
        },
      ],
    });
    analyze.mockResolvedValue({ groups: [] });

    await expect(service.synchronize()).rejects.toThrow(BadGatewayException);
    expect(transaction).not.toHaveBeenCalled();
  });
});
