import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from '../../lib/auth.js';
import { FeedbackAnalysisService } from './feedback-analysis.service.js';
import { FeedbackService } from './feedback.service.js';

@Controller('api/feedback')
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly feedbackAnalysis: FeedbackAnalysisService,
  ) {}

  @Get('results')
  async findAll(@Req() request: Request) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) throw new UnauthorizedException('Please sign in.');
    if (session.user.email !== 'founder@foxhound.test') {
      throw new ForbiddenException('Only founders can view feedback results.');
    }
    return this.feedbackService.findAll();
  }

  @Get('services/health')
  async health(@Req() request: Request) {
    await this.requireFounder(request);
    return this.feedbackAnalysis.health();
  }

  @Post('analyze')
  async analyze(@Req() request: Request) {
    await this.requireFounder(request);
    return this.feedbackAnalysis.synchronize();
  }

  @Post()
  async create(@Req() request: Request, @Body() body: unknown) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session)
      throw new UnauthorizedException('Please sign in to send feedback.');
    const feedback = await this.feedbackService.create(body, session.user.id);
    try {
      const result = await this.feedbackAnalysis.synchronize();
      return { feedback, analysis: { status: 'completed', ...result } };
    } catch (error) {
      this.logger.error(
        `Feedback ${feedback.id} was stored but automatic analysis failed.`,
        error instanceof Error ? error.stack : undefined,
      );
      return { feedback, analysis: { status: 'pending' } };
    }
  }

  private async requireFounder(request: Request) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) throw new UnauthorizedException('Please sign in.');
    if (session.user.email !== 'founder@foxhound.test') {
      throw new ForbiddenException(
        'Only founders can manage feedback analysis.',
      );
    }
    return session;
  }
}
