import { Injectable, Logger } from '@nestjs/common';

import {
  Graph,
  GraphNode,
  GraphEdge,
  NodeParameter,
  TransformMapping,
} from './dto/graph.dto';

interface NodeExecutionResult {
  nodeId: string;
  type: string;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  error?: string;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  async execute(
    graph: Graph,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { nodes, edges } = graph;
    const nodeResults: NodeExecutionResult[] = [];

    const inputNode = nodes.find((n) => n.type === 'inputNode');
    if (!inputNode) {
      throw new Error('Input node not found in graph');
    }

    let currentState = { ...input };

    const parameters = inputNode.data.parameters || [];
    parameters.forEach((p: NodeParameter) => {
      if (currentState[p.name] !== undefined) {
        if (p.type === 'number')
          currentState[p.name] = Number(currentState[p.name]);
        if (p.type === 'boolean')
          currentState[p.name] =
            currentState[p.name] === 'true' || currentState[p.name] === true;
      }
    });

    const secretNodes = nodes.filter((n) => n.type === 'secretNode');
    const secrets: Record<string, string> = {};
    secretNodes.forEach((s) => {
      if (s.data.secretKey && s.data.secretValue) {
        secrets[s.data.secretKey] = s.data.secretValue;
      }
    });

    const sorted = this.topologicalSort(inputNode.id, nodes, edges);

    for (const node of sorted) {
      const start = Date.now();
      this.logger.log(`Executing node: ${node.id} (${node.type})`);

      try {
        switch (node.type) {
          case 'httpNode':
            currentState = await this.executeHttpNode(
              node,
              currentState,
              secrets,
            );
            break;
          case 'transformNode':
            currentState = this.executeTransformNode(node, currentState);
            break;
          case 'conditionNode': {
            const branch = this.evaluateCondition(node, currentState);
            const branchEdges = edges.filter(
              (e) =>
                e.source === node.id &&
                e.sourceHandle === (branch ? 'true' : 'false'),
            );
            if (branchEdges.length === 0) {
              nodeResults.push({
                nodeId: node.id,
                type: node.type,
                status: 'success',
                duration: Date.now() - start,
              });
              continue;
            }
            break;
          }
          case 'outputNode':
            nodeResults.push({
              nodeId: node.id,
              type: node.type,
              status: 'success',
              duration: Date.now() - start,
            });
            return {
              ...this.executeOutputNode(node, currentState),
              _execution: { nodes: nodeResults },
            };
        }

        nodeResults.push({
          nodeId: node.id,
          type: node.type,
          status: 'success',
          duration: Date.now() - start,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        nodeResults.push({
          nodeId: node.id,
          type: node.type,
          status: 'error',
          duration: Date.now() - start,
          error: errorMessage,
        });
        return {
          error: `Node ${node.type} (${node.id}) failed: ${errorMessage}`,
          _execution: { nodes: nodeResults },
        };
      }
    }

    return { data: currentState, _execution: { nodes: nodeResults } };
  }

  private topologicalSort(
    startId: string,
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): GraphNode[] {
    const reachableIds = new Set<string>([startId]);
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      edges
        .filter((e) => e.source === curr)
        .forEach((e) => {
          if (!reachableIds.has(e.target)) {
            reachableIds.add(e.target);
            queue.push(e.target);
          }
        });
    }

    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const id of reachableIds) {
      inDegree.set(id, 0);
      adj.set(id, []);
    }
    for (const edge of edges) {
      if (reachableIds.has(edge.source) && reachableIds.has(edge.target)) {
        adj.get(edge.source)!.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    }

    const sorted: string[] = [];
    const q: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) q.push(id);
    }
    while (q.length > 0) {
      const curr = q.shift()!;
      sorted.push(curr);
      for (const neighbor of adj.get(curr) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) q.push(neighbor);
      }
    }

    return sorted
      .filter((id) => id !== startId)
      .map((id) => nodes.find((n) => n.id === id)!)
      .filter(Boolean);
  }

  private async executeHttpNode(
    node: GraphNode,
    state: Record<string, unknown>,
    secrets: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    const { method = 'GET', url, headers = {}, body = '' } = node.data;

    const processedUrl = this.substituteVariables(
      url as string,
      state,
      secrets,
    );
    const processedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    Object.entries(headers).forEach(([k, v]) => {
      processedHeaders[k] = this.substituteVariables(String(v), state, secrets);
    });

    this.logger.log(`Making ${method} request to ${processedUrl}`);

    const fetchOptions: RequestInit = {
      method,
      headers: processedHeaders,
    };

    if (method !== 'GET' && body) {
      const processedBody = this.substituteVariables(body, state, secrets);
      fetchOptions.body = processedBody;
    }

    const response = await fetch(processedUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  private executeTransformNode(
    node: GraphNode,
    state: Record<string, unknown>,
  ): Record<string, unknown> {
    const { mappings = [], expression = '' } = node.data;
    let result = { ...state };

    if (mappings.length > 0) {
      const mapped: Record<string, unknown> = {};
      mappings.forEach((m: TransformMapping) => {
        if (m.from && m.to) {
          mapped[m.to] = this.getNestedValue(state, m.from);
        }
      });
      result = { ...result, ...mapped };
    }

    if (expression) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function('data', expression) as (
          data: Record<string, unknown>,
        ) => Record<string, unknown>;
        const transformed = fn(result);
        if (transformed !== undefined) result = transformed;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Transform expression failed: ${errorMessage}`);
      }
    }

    return result;
  }

  private evaluateCondition(
    node: GraphNode,
    state: Record<string, unknown>,
  ): boolean {
    const { field = '', operator = 'equals', value = '' } = node.data;
    const fieldValue = this.getNestedValue(state, field);

    switch (operator) {
      case 'equals':
        return String(fieldValue) === String(value);
      case 'not_equals':
        return String(fieldValue) !== String(value);
      case 'contains':
        return String(fieldValue).includes(value as string);
      case 'gt':
        return Number(fieldValue) > Number(value);
      case 'lt':
        return Number(fieldValue) < Number(value);
      case 'gte':
        return Number(fieldValue) >= Number(value);
      case 'lte':
        return Number(fieldValue) <= Number(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return true;
    }
  }

  private executeOutputNode(
    node: GraphNode,
    state: Record<string, unknown>,
  ): Record<string, unknown> {
    const { outputType = 'text', widgetTitle, widgetDescription } = node.data;

    if (outputType === 'widget') {
      const fieldCount =
        typeof state === 'object' ? Object.keys(state).length : 1;
      return {
        data: state,
        widget: {
          type: 'generic',
          title: widgetTitle || 'Execution Result',
          description: widgetDescription || `Returned ${fieldCount} field(s).`,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return state;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    if (!path) return obj;
    return path.split('.').reduce((acc: unknown, key) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  private substituteVariables(
    text: string,
    state: Record<string, unknown>,
    secrets: Record<string, string>,
  ): string {
    if (!text) return text;
    return text
      .replace(/\{\{secret\.(.*?)\}\}/g, (match: string, key: string) => {
        return secrets[key.trim()] || match;
      })
      .replace(/\{\{input\.(.*?)\}\}/g, (match: string, path: string) => {
        const val = state[path.trim()];
        return val !== undefined
          ? typeof val === 'object'
            ? JSON.stringify(val)
            : // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(val)
          : match;
      })
      .replace(/\{\{(.*?)\}\}/g, (match: string, path: string) => {
        const cleanPath = path.trim().replace(/^input\./, '');
        const val = this.getNestedValue(state, cleanPath);
        return val !== undefined
          ? typeof val === 'object'
            ? JSON.stringify(val)
            : // eslint-disable-next-line @typescript-eslint/no-base-to-string
              String(val)
          : match;
      });
  }
}
