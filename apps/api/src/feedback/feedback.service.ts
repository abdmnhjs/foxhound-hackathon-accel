import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(body: unknown, userId: string) {
    if (
      !body ||
      typeof body !== 'object' ||
      !('text' in body) ||
      typeof body.text !== 'string' ||
      !body.text.trim()
    ) {
      throw new BadRequestException('Feedback text is required.');
    }
    return this.prisma.client.feedbackUser.create({
      data: { text: body.text.trim(), userId },
    });
  }
}
