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
  position?: { x: number; y: number };
  positionAbsolute?: { x: number; y: number };
  selected?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  selected?: boolean;
  animated?: boolean;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
