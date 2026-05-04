import { ChatConfig, Graph, McpPrompt, McpResource } from './graph.dto';

export class CreateWorkflowDto {
  name?: string;
  graph?: Graph;
  resources?: McpResource[];
  prompts?: McpPrompt[];
  chatConfig?: ChatConfig;
}

export class UpdateWorkflowDto {
  name?: string;
  graph?: Graph;
  resources?: McpResource[];
  prompts?: McpPrompt[];
  chatConfig?: ChatConfig;
}

export class ExecuteWorkflowDto {
  graph: Graph;
  input: Record<string, unknown>;
}

export class GenerateWorkflowDto {
  graph: Graph;
  resources?: McpResource[];
  prompts?: McpPrompt[];
}

export class ValidateWorkflowDto {
  graph: Graph;
}

export interface ChatMessageDto {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export class ChatWorkflowDto {
  graph: Graph;
  input?: Record<string, unknown>;
  resources?: McpResource[];
  prompts?: McpPrompt[];
  messages: ChatMessageDto[];
  model?: string;
  ollamaUrl?: string;
}
