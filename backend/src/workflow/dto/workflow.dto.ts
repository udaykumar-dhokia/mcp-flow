import { Graph } from './graph.dto';

export class ExecuteWorkflowDto {
  graph: Graph;
  input: Record<string, unknown>;
}

export class GenerateWorkflowDto {
  graph: Graph;
}

export class ValidateWorkflowDto {
  graph: Graph;
}
