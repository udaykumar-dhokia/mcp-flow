export interface NodeParameter {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface TransformMapping {
  from: string;
  to: string;
}

export interface McpResource {
  id?: string;
  name: string;
  uri: string;
  title?: string;
  description?: string;
  mimeType?: string;
  content: string;
}

export interface McpPromptArgument {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
}

export interface McpPrompt {
  id?: string;
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
  template: string;
  role?: 'system' | 'user' | 'assistant';
}

export interface GraphNodeData {
  [key: string]: unknown;

  name?: string;
  description?: string;
  parameters?: NodeParameter[];

  outputType?: string;
  widgetTitle?: string;
  widgetDescription?: string;

  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: string;

  mappings?: TransformMapping[];
  expression?: string;

  field?: string;
  operator?: string;
  value?: string | number | boolean;

  secretKey?: string;
  secretValue?: string;
}

export interface GraphNode {
  id: string;
  type: string;
  data: GraphNodeData;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ChatConfig {
  provider: string;
  baseUrl: string;
  model: string;
}

export interface WorkflowBundle {
  name: string;
  graph: Graph;
  resources: McpResource[];
  prompts: McpPrompt[];
  chatConfig?: ChatConfig;
}
