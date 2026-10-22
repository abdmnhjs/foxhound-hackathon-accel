import {
  Body,
  Controller,
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
