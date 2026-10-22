import { BadRequestException } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

vi.mock('../prisma/prisma.service.js', () => ({ PrismaService: class {} }));

describe('FeedbackService', () => {
  const create = vi.fn();
  const findMany = vi.fn();
  const service = new FeedbackService({
    client: { feedbackUser: { create }, feedbackResult: { findMany } },
  } as unknown as PrismaService);

  beforeEach(() => vi.clearAllMocks());

  it('reads analyzed results ordered by descending score', async () => {
    const results = [{ id: 'result-1', title: 'Dark mode', score: 21 }];
    findMany.mockResolvedValue(results);
    await expect(service.findAll()).resolves.toEqual(results);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        title: true,
        summary: true,
        score: true,
        priority: true,
        contradiction: true,
        createdAt: true,
      },
    });
  });

  it('stores trimmed text with the authenticated user rather than the supplied user', async () => {
    const saved = {
      id: 'feedback-1',
      text: 'Useful feature',
      userId: 'user-1',
    };
    create.mockResolvedValue(saved);
    await expect(
      service.create(
        { text: '  Useful feature  ', userId: 'other-user' },
        'user-1',
      ),
    ).resolves.toEqual(saved);
    expect(create).toHaveBeenCalledWith({
      data: { text: 'Useful feature', userId: 'user-1' },
    });
  });

  it.each([undefined, null, {}, { text: '' }, { text: '   ' }, { text: 42 }])(
    'rejects invalid feedback %j without writing to the database',
    (body) => {
      expect(() => service.create(body, 'user-1')).toThrow(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    },
  );
});
