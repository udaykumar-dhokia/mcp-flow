import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { GeneratorService } from './generator.service';

@Module({
  controllers: [WorkflowController],
  providers: [WorkflowService, GeneratorService],
  exports: [WorkflowService, GeneratorService],
})
export class WorkflowModule {}
