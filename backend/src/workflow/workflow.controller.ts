import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WorkflowService } from './workflow.service';
import { GeneratorService } from './generator.service';
import {
  ChatWorkflowDto,
  CreateWorkflowDto,
  ExecuteWorkflowDto,
  GenerateWorkflowDto,
  UpdateWorkflowDto,
  ValidateWorkflowDto,
} from './dto/workflow.dto';

@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly generatorService: GeneratorService,
  ) {}

  @Get()
  list() {
    return this.workflowService.listWorkflows();
  }

  @Post()
  create(@Body() body: CreateWorkflowDto) {
    return this.workflowService.createWorkflow(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.workflowService.getWorkflow(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateWorkflowDto) {
    return this.workflowService.updateWorkflow(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.workflowService.deleteWorkflow(id);
  }

  @Post('execute')
  async execute(@Body() body: ExecuteWorkflowDto) {
    return this.workflowService.execute(body.graph, body.input);
  }

  @Post('generate')
  generate(@Body() body: GenerateWorkflowDto) {
    return {
      code: this.generatorService.generate(
        body.graph,
        body.resources,
        body.prompts,
      ),
    };
  }

  @Post('validate')
  validate(@Body() body: ValidateWorkflowDto) {
    return this.generatorService.validate(body.graph);
  }

  @Post('chat')
  async chat(@Body() body: ChatWorkflowDto, @Res() res: Response) {
    await this.workflowService.chatWithOllamaStream(body, res);
  }
}
