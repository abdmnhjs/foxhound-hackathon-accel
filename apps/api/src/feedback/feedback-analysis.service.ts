import { BadGatewayException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  FeedbackPipelineClient,
  type AnalysisGroup,
} from './feedback-pipeline.client.js';

const MAX_ANALYZED_FEEDBACKS = 100;

type StoredFeedback = {
  id: string;
  text: string;
  createdAt: Date;
  userId: string | null;
  plan: string | null;
};

@Injectable()
export class FeedbackAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipeline: FeedbackPipelineClient,
  ) {}

  health() {
    return this.pipeline.health();
  }

  async synchronize() {
    const feedbacks = await this.prisma.client.feedbackUser.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MAX_ANALYZED_FEEDBACKS,
      select: {
        id: true,
        text: true,
        createdAt: true,
        userId: true,
        plan: true,
      },
    });

    if (feedbacks.length === 0) {
      await this.prisma.client.feedbackResult.deleteMany();
      return { processedFeedbacks: 0, groups: 0 };
    }

    const prepared = await this.pipeline.prepare({
      feedbacks: (feedbacks as StoredFeedback[]).map((feedback) => ({
        id: feedback.id,
        text: feedback.text,
        createdAt: feedback.createdAt.toISOString(),
        ...(feedback.userId === null ? {} : { userId: feedback.userId }),
        ...(feedback.plan === null ? {} : { plan: feedback.plan }),
      })),
    });
    const analysis = await this.pipeline.analyze(prepared);
    this.assertFeedbackCoverage(
      prepared.feedbacks.map((feedback) => feedback.id),
      analysis.groups,
    );

    await this.prisma.client.$transaction([
      this.prisma.client.feedbackResult.deleteMany(),
      ...analysis.groups.map((group) =>
        this.prisma.client.feedbackResult.create({
          data: {
            id: randomUUID(),
            title: group.title,
            summary: group.summary,
            score: group.score,
            priority: group.priority,
            contradiction: group.contradiction,
            feedbacks: {
              connect: group.feedbackIds.map((id) => ({ id })),
            },
          },
        }),
      ),
    ]);

    return {
      processedFeedbacks: prepared.feedbacks.length,
      groups: analysis.groups.length,
    };
  }

  private assertFeedbackCoverage(
    feedbackIds: string[],
    groups: AnalysisGroup[],
  ) {
    const expected = new Set(feedbackIds);
    const received = groups.flatMap((group) => group.feedbackIds);
    const receivedSet = new Set(received);

    if (
      received.length !== receivedSet.size ||
      expected.size !== receivedSet.size ||
      [...expected].some((id) => !receivedSet.has(id))
    ) {
      throw new BadGatewayException(
        'AI service returned incomplete or duplicated feedback references.',
      );
    }
  }
}
