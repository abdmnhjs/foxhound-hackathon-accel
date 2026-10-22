import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from '../../lib/auth.js';
import { FeedbackService } from './feedback.service.js';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

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

  @Post()
  async create(@Req() request: Request, @Body() body: unknown) {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session)
      throw new UnauthorizedException('Please sign in to send feedback.');
    return this.feedbackService.create(body, session.user.id);
  }
}
