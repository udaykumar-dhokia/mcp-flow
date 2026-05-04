import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { GeneratorService } from './generator.service';

import { LiveService } from './live.service';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, GeneratorService, PrismaService, LiveService],
  exports: [WorkflowService, GeneratorService, LiveService],
})
export class WorkflowModule {}
