import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { FeedbackController } from './feedback.controller.js';
import type { FeedbackService } from './feedback.service.js';

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../../lib/auth.js', () => ({ auth: { api: { getSession } } }));
vi.mock('./feedback.service.js', () => ({ FeedbackService: class {} }));

describe('FeedbackController', () => {
  const create = vi.fn();
  const controller = new FeedbackController({
    create,
  } as unknown as FeedbackService);
  const request = { headers: { cookie: 'session=test' } } as Request;

  beforeEach(() => vi.clearAllMocks());

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
    await expect(
      controller.create(request, { text: 'Feedback' }),
    ).resolves.toEqual({ id: 'feedback-1' });
    expect(create).toHaveBeenCalledWith({ text: 'Feedback' }, 'user-1');
  });
});
