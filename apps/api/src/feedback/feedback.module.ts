import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FeedbackAnalysisService } from './feedback-analysis.service.js';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackPipelineClient } from './feedback-pipeline.client.js';
import { FeedbackService } from './feedback.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackAnalysisService, FeedbackPipelineClient],
})
export class FeedbackModule {}
