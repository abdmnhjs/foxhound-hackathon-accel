import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import {
  aiServiceUrl,
  dataServiceUrl,
  pipelineRequestTimeoutMs,
} from '../config/env.js';

export type PreparedFeedback = {
  id: string;
  text: string;
  createdAt: string;
  userId?: string;
  plan?: string;
};

export type FeedbackPayload = {
  feedbacks: PreparedFeedback[];
};

export type AnalysisGroup = {
  title: string;
  summary: string;
  score: number;
  priority: 'red' | 'yellow' | 'green';
  contradiction: string | null;
  feedbackIds: string[];
};

export type AnalysisPayload = {
  groups: AnalysisGroup[];
};

type ServiceHealth = {
  status: 'ok';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length > 0);
}

function parseHealth(value: unknown, serviceName: string): ServiceHealth {
  if (!isRecord(value) || value.status !== 'ok') {
    throw new BadGatewayException(
      `${serviceName} returned an invalid health response.`,
    );
  }
  return { status: 'ok' };
}

function parseFeedbackPayload(value: unknown): FeedbackPayload {
  if (!isRecord(value) || !Array.isArray(value.feedbacks)) {
    throw new BadGatewayException('Data service returned an invalid response.');
  }

  const feedbacks = value.feedbacks.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      !item.id ||
      typeof item.text !== 'string' ||
      !item.text ||
      typeof item.createdAt !== 'string' ||
      !item.createdAt ||
      !isOptionalString(item.userId) ||
      !isOptionalString(item.plan)
    ) {
      throw new BadGatewayException(
        'Data service returned an invalid feedback.',
      );
    }

    return {
      id: item.id,
      text: item.text,
      createdAt: item.createdAt,
      ...(item.userId === undefined ? {} : { userId: item.userId }),
      ...(item.plan === undefined ? {} : { plan: item.plan }),
    };
  });

  return { feedbacks };
}

function parseAnalysisPayload(value: unknown): AnalysisPayload {
  if (!isRecord(value) || !Array.isArray(value.groups)) {
    throw new BadGatewayException('AI service returned an invalid response.');
  }

  const groups = value.groups.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.title !== 'string' ||
      !item.title ||
      typeof item.summary !== 'string' ||
      !item.summary ||
      typeof item.score !== 'number' ||
      !Number.isInteger(item.score) ||
      item.score < 0 ||
      item.score > 100 ||
      !['red', 'yellow', 'green'].includes(String(item.priority)) ||
      !(
        item.contradiction === null || typeof item.contradiction === 'string'
      ) ||
      !Array.isArray(item.feedbackIds) ||
      !item.feedbackIds.every((id) => typeof id === 'string' && id.length > 0)
    ) {
      throw new BadGatewayException('AI service returned an invalid group.');
    }

    return {
      title: item.title,
      summary: item.summary,
      score: item.score,
      priority: item.priority as AnalysisGroup['priority'],
      contradiction: item.contradiction,
      feedbackIds: item.feedbackIds,
    };
  });

  return { groups };
}

@Injectable()
export class FeedbackPipelineClient {
  async health() {
    const [data, ai] = await Promise.all([
      this.request(`${dataServiceUrl}/health`, 'Data service'),
      this.request(`${aiServiceUrl}/health`, 'AI service'),
    ]);

    return {
      status: 'ok' as const,
      services: {
        data: parseHealth(data, 'Data service'),
        ai: parseHealth(ai, 'AI service'),
      },
    };
  }

  async prepare(payload: FeedbackPayload): Promise<FeedbackPayload> {
    const response = await this.request(
      `${dataServiceUrl}/feedbacks/process`,
      'Data service',
      payload,
    );
    return parseFeedbackPayload(response);
  }

  async analyze(payload: FeedbackPayload): Promise<AnalysisPayload> {
    const response = await this.request(
      `${aiServiceUrl}/analyze`,
      'AI service',
      payload,
    );
    return parseAnalysisPayload(response);
  }

  private async request(url: string, serviceName: string, body?: unknown) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers:
          body === undefined
            ? undefined
            : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(pipelineRequestTimeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException(`${serviceName} request timed out.`);
      }
      throw new BadGatewayException(`${serviceName} is unavailable.`);
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `${serviceName} request failed with status ${response.status}.`,
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new BadGatewayException(`${serviceName} returned invalid JSON.`);
    }
  }
}
