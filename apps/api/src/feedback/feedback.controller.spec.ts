import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { FeedbackController } from './feedback.controller.js';
import type { FeedbackService } from './feedback.service.js';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../../lib/auth.js', () => ({ auth: { api: { getSession } } }));
vi.mock('./feedback.service.js', () => ({ FeedbackService: class {} }));
vi.mock('./feedback-analysis.service.js', () => ({
  FeedbackAnalysisService: class {},
}));

describe('FeedbackController', () => {
  const create = vi.fn();
  const findAll = vi.fn();
  const synchronize = vi.fn();
  const health = vi.fn();
  const controller = new FeedbackController(
    {
      create,
      findAll,
    } as unknown as FeedbackService,
    {
      synchronize,
      health,
    } as never,
  );
  const request = { headers: { cookie: 'session=test' } } as Request;

  beforeEach(() => vi.clearAllMocks());

  it('rejects anonymous readers', async () => {
    getSession.mockResolvedValue(null);
    await expect(controller.findAll(request)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(findAll).not.toHaveBeenCalled();
  });

  it('rejects non-founder readers', async () => {
    getSession.mockResolvedValue({ user: { email: 'user@foxhound.test' } });
    await expect(controller.findAll(request)).rejects.toThrow(
      ForbiddenException,
    );
    expect(findAll).not.toHaveBeenCalled();
  });

  it('returns feedback for the founder', async () => {
    getSession.mockResolvedValue({ user: { email: 'founder@foxhound.test' } });
    findAll.mockResolvedValue([{ id: 'feedback-1' }]);
    await expect(controller.findAll(request)).resolves.toEqual([
      { id: 'feedback-1' },
    ]);
    expect(findAll).toHaveBeenCalledOnce();
  });

  it('rejects unauthenticated submissions', async () => {
    getSession.mockResolvedValue(null);
    await expect(
      controller.create(request, { text: 'Feedback' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(create).not.toHaveBeenCalled();
  });

  it('passes the authenticated user and feedback to the service', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } });
    create.mockResolvedValue({ id: 'feedback-1' });
    synchronize.mockResolvedValue({ processedFeedbacks: 1, groups: 1 });
    await expect(
      controller.create(request, { text: 'Feedback' }),
    ).resolves.toEqual({
      feedback: { id: 'feedback-1' },
      analysis: {
        status: 'completed',
        processedFeedbacks: 1,
        groups: 1,
      },
    });
    expect(create).toHaveBeenCalledWith({ text: 'Feedback' }, 'user-1');
    expect(synchronize).toHaveBeenCalledOnce();
  });

  it('keeps a stored feedback pending when automatic analysis fails', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1' } });
    create.mockResolvedValue({ id: 'feedback-1' });
    synchronize.mockRejectedValue(new Error('Data service unavailable'));
    await expect(
      controller.create(request, { text: 'Feedback' }),
    ).resolves.toEqual({
      feedback: { id: 'feedback-1' },
      analysis: { status: 'pending' },
    });
  });

  it('lets the founder trigger analysis manually', async () => {
    getSession.mockResolvedValue({
      user: { id: 'founder-1', email: 'founder@foxhound.test' },
    });
    synchronize.mockResolvedValue({ processedFeedbacks: 2, groups: 1 });
    await expect(controller.analyze(request)).resolves.toEqual({
      processedFeedbacks: 2,
      groups: 1,
    });
  });

  it('reports the health of both Python services to the founder', async () => {
    getSession.mockResolvedValue({
      user: { id: 'founder-1', email: 'founder@foxhound.test' },
    });
    health.mockResolvedValue({ status: 'ok' });
    await expect(controller.health(request)).resolves.toEqual({ status: 'ok' });
  });
});
