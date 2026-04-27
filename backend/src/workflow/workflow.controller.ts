import { Controller, Post, Body } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { GeneratorService } from './generator.service';
import {
  ExecuteWorkflowDto,
  GenerateWorkflowDto,
  ValidateWorkflowDto,
} from './dto/workflow.dto';

@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly generatorService: GeneratorService,
  ) {}

  @Post('execute')
  async execute(@Body() body: ExecuteWorkflowDto) {
    return this.workflowService.execute(body.graph, body.input);
  }

  @Post('generate')
  generate(@Body() body: GenerateWorkflowDto) {
    return { code: this.generatorService.generate(body.graph) };
  }

  @Post('validate')
  validate(@Body() body: ValidateWorkflowDto) {
    return this.generatorService.validate(body.graph);
  }
}
