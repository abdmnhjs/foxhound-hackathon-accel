import { BadGatewayException } from '@nestjs/common';
import { FeedbackPipelineClient } from './feedback-pipeline.client.js';

describe('FeedbackPipelineClient', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('checks both Python service health endpoints', async () => {
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json({ status: 'ok' }))
      .mockResolvedValueOnce(Response.json({ status: 'ok' }));

    await expect(new FeedbackPipelineClient().health()).resolves.toEqual({
      status: 'ok',
      services: { data: { status: 'ok' }, ai: { status: 'ok' } },
    });
    expect(request.mock.calls.map(([url]) => url)).toEqual([
      'http://127.0.0.1:8001/health',
      'http://127.0.0.1:8002/health',
    ]);
  });

  it('sends Data output unchanged to the AI service', async () => {
    const prepared = {
      feedbacks: [
        {
          id: 'feedback-1',
          text: 'Synthetic feedback.',
          createdAt: '2026-10-22T12:00:00Z',
          userId: 'user-1',
          plan: 'Pro',
        },
      ],
    };
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json(prepared))
      .mockResolvedValueOnce(
        Response.json({
          groups: [
            {
              title: 'Synthetic theme',
              summary: 'A synthetic summary.',
              score: 80,
              priority: 'red',
              contradiction: null,
              feedbackIds: ['feedback-1'],
            },
          ],
        }),
      );
    const client = new FeedbackPipelineClient();

    const normalized = await client.prepare(prepared);
    const analyzed = await client.analyze(normalized);

    expect(analyzed.groups).toHaveLength(1);
    expect(request.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(prepared),
    });
  });

  it('rejects an invalid downstream response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      Response.json({ feedbacks: [{ id: 'feedback-1' }] }),
    );
    await expect(
      new FeedbackPipelineClient().prepare({ feedbacks: [] }),
    ).rejects.toThrow(BadGatewayException);
  });
});
