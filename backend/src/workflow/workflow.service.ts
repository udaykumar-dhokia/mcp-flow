import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { PrismaService } from '../prisma.service';

import {
  Graph,
  GraphNode,
  GraphEdge,
  NodeParameter,
  TransformMapping,
  WorkflowBundle,
  McpPrompt,
  McpResource,
} from './dto/graph.dto';
import { ChatMessageDto, ChatWorkflowDto } from './dto/workflow.dto';
import { GeneratorService } from './generator.service';
import { LiveService } from './live.service';

interface NodeExecutionResult {
  nodeId: string;
  type: string;
  status: 'success' | 'error' | 'skipped';
  duration: number;
  error?: string;
}

interface OllamaToolCall {
  id?: string;
  function?: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

interface OllamaChunk {
  message?: {
    content?: string;
    tool_calls?: OllamaToolCall[];
  };
}

interface OllamaMessage {
  role?: string;
  content?: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessage;
  [key: string]: unknown;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly liveService: LiveService,
    private readonly generatorService: GeneratorService,
  ) {}

  async listWorkflows() {
    const project = await this.ensureDefaultProject();
    const workflows = await this.prisma.workflow.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });

    return workflows.map((workflow) => {
      const bundle = this.parseBundle(workflow.graphJson);
      return {
        id: workflow.id,
        name: bundle.name,
        graph: bundle.graph,
        resources: bundle.resources,
        prompts: bundle.prompts,
        version: workflow.version,
        createdAt: workflow.createdAt,
      };
    });
  }

  async createWorkflow(bundle: Partial<WorkflowBundle>) {
    const project = await this.ensureDefaultProject();
    const stored = this.normalizeBundle(bundle);
    const workflow = await this.prisma.workflow.create({
      data: {
        projectId: project.id,
        graphJson: JSON.stringify(stored),
      },
    });

    return { id: workflow.id, version: workflow.version, ...stored };
  }

  async getWorkflow(id: string) {
    const workflow = await this.prisma.workflow.findUnique({ where: { id } });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return {
      id: workflow.id,
      version: workflow.version,
      createdAt: workflow.createdAt,
      ...this.parseBundle(workflow.graphJson),
    };
  }

  async updateWorkflow(id: string, bundle: Partial<WorkflowBundle>) {
    const current = await this.getWorkflow(id);
    const stored = this.normalizeBundle({
      name: bundle.name ?? current.name,
      graph: bundle.graph ?? current.graph,
      resources: bundle.resources ?? current.resources,
      prompts: bundle.prompts ?? current.prompts,
    });

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        graphJson: JSON.stringify(stored),
        version: { increment: 1 },
      },
    });

    return { id: workflow.id, version: workflow.version, ...stored };
  }

  async deleteWorkflow(id: string) {
    this.liveService.stopLive(id);
    await this.prisma.workflow.delete({ where: { id } });
    return { ok: true };
  }

  async toggleLive(id: string, enable: boolean) {
    const workflow = await this.getWorkflow(id);
    const code = this.generatorService.generate(
      workflow.graph,
      workflow.resources,
      workflow.prompts,
    );

    const port = await this.liveService.toggleLive(id, code, enable);

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        isLive: enable,
        livePort: port,
      },
    });

    return {
      isLive: updated.isLive,
      livePort: updated.livePort,
      url: enable ? `http://localhost:${port}/sse` : null,
    };
  }

  async getLiveStatus(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      select: { isLive: true, livePort: true },
    });

    if (!workflow) throw new NotFoundException('Workflow not found');

    // Sync in-memory state with DB if necessary (e.g. after server restart)
    const activePort = this.liveService.getLivePort(id);
    const isActuallyLive = workflow.isLive && activePort !== null;

    return {
      isLive: isActuallyLive,
      livePort: activePort,
      url: isActuallyLive ? `http://localhost:${activePort}/sse` : null,
    };
  }

  async execute(
    graph: Graph,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return this.executeFromInput(graph, input);
  }

  async chatWithOllamaStream(
    {
      graph,
      input = {},
      resources = [],
      prompts = [],
      messages,
      model = 'llama3.1',
      ollamaUrl = 'http://localhost:11434',
    }: ChatWorkflowDto,
    res: ExpressResponse,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const tools = graph.nodes
      .filter((node) => node.type === 'inputNode')
      .map((node) => this.toOllamaTool(node));

    if (resources.length > 0) {
      tools.push({
        type: 'function',
        function: {
          name: 'read_workflow_resource',
          description:
            'Read the content of a defined MCP resource by its URI or name.',
          parameters: {
            type: 'object',
            properties: {
              uri: {
                type: 'string',
                description: 'The URI or name of the resource to read.',
              },
            },
            required: ['uri'],
          },
        },
      });
    }

    const systemContext = this.buildMcpContext(resources, prompts);
    const requestMessages = systemContext
      ? [{ role: 'system', content: systemContext }, ...messages]
      : messages;

    const baseUrl = ollamaUrl.replace(/\/$/, '');

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: requestMessages,
          tools: tools.length > 0 ? tools : undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: `Ollama returned ${response.status}: ${text}` })}\n\n`,
        );
        return res.end();
      }

      const reader = response.body?.getReader();
      if (!reader) return res.end();

      let isToolCall = false;
      let accumulatedToolCalls: OllamaToolCall[] = [];
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as OllamaChunk;
            if (parsed.message?.tool_calls) {
              isToolCall = true;
              accumulatedToolCalls = parsed.message.tool_calls;
            } else if (parsed.message?.content && !isToolCall) {
              assistantContent += parsed.message.content;
              res.write(
                `data: ${JSON.stringify({ type: 'content', content: parsed.message.content })}\n\n`,
              );
            }
          } catch (e) {
            Logger.error('Failed to parse chunk', e);
          }
        }
      }

      if (!isToolCall) {
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const executedToolMessages: ChatMessageDto[] = [];
      const toolResults: Record<string, unknown>[] = [];
      const assistantMessage: {
        role: string;
        content: string;
        tool_calls: OllamaToolCall[];
      } = {
        role: 'assistant',
        content: assistantContent,
        tool_calls: accumulatedToolCalls,
      };

      for (const call of accumulatedToolCalls) {
        const name = call.function?.name;
        const args = this.parseToolArguments(call.function?.arguments);
        if (!name) continue;

        let result: Record<string, unknown>;

        if (name === 'read_workflow_resource') {
          const uri = typeof args.uri === 'string' ? args.uri : '';
          const resource = resources.find(
            (r) => r.uri === uri || r.name === uri,
          );
          if (resource) {
            result = {
              uri: resource.uri,
              name: resource.name,
              content: resource.content,
              mimeType: resource.mimeType,
            };
          } else {
            result = { error: `Resource "${uri}" not found.` };
          }
        } else {
          result = await this.executeFromInput(
            graph,
            { ...input, ...args },
            name,
          );
        }

        toolResults.push({ name: String(name), arguments: args, result });
        executedToolMessages.push({
          role: 'tool',
          tool_call_id: String(call.id || name),
          name: String(name),
          content: JSON.stringify(result),
        });
      }

      res.write(
        `data: ${JSON.stringify({ type: 'tool_calls', toolCalls: toolResults })}\n\n`,
      );

      const finalResponse = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            ...requestMessages,
            assistantMessage,
            ...executedToolMessages,
          ],
          stream: true,
        }),
      });

      if (!finalResponse.ok) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Ollama final chat failed' })}\n\n`,
        );
        return res.end();
      }

      const finalReader = finalResponse.body?.getReader();
      if (finalReader) {
        while (true) {
          const { done, value } = await finalReader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line) as OllamaChunk;
              if (parsed.message?.content) {
                res.write(
                  `data: ${JSON.stringify({ type: 'content', content: parsed.message.content })}\n\n`,
                );
              }
            } catch (e) {
              Logger.error('Failed to parse chunk', e);
            }
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'Unknown error' })}\n\n`,
      );
      res.end();
    }
  }

  private async executeFromInput(
    graph: Graph,
    input: Record<string, unknown>,
    toolName?: string,
  ): Promise<Record<string, unknown>> {
    const { nodes, edges } = graph;
    const nodeResults: NodeExecutionResult[] = [];

    const inputNode = nodes.find(
      (n) => n.type === 'inputNode' && (!toolName || n.data.name === toolName),
    );
    if (!inputNode) {
      throw new Error(
        toolName
          ? `Tool "${toolName}" not found in graph`
          : 'Input node not found in graph',
      );
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

  private async ensureDefaultProject() {
    const user = await this.prisma.user.upsert({
      where: { email: 'local@mcp-flow.dev' },
      update: {},
      create: {
        email: 'local@mcp-flow.dev',
        name: 'Local MCP-Flow User',
      },
    });

    return this.prisma.project.upsert({
      where: { slug: 'local-workspace' },
      update: {},
      create: {
        userId: user.id,
        name: 'Local Workspace',
        slug: 'local-workspace',
      },
    });
  }

  private normalizeBundle(bundle: Partial<WorkflowBundle>): WorkflowBundle {
    return {
      name: bundle.name?.trim() || 'Untitled Workflow',
      graph: bundle.graph || { nodes: [], edges: [] },
      resources: bundle.resources || [],
      prompts: bundle.prompts || [],
      chatConfig: bundle.chatConfig,
    };
  }

  private parseBundle(raw: string): WorkflowBundle {
    try {
      const parsed = JSON.parse(raw) as Partial<WorkflowBundle> | Graph;
      if ('nodes' in parsed && 'edges' in parsed) {
        return this.normalizeBundle({ graph: parsed });
      }
      return this.normalizeBundle(parsed);
    } catch {
      return this.normalizeBundle({});
    }
  }

  private toOllamaTool(node: GraphNode) {
    const parameters = node.data.parameters || [];
    const properties = Object.fromEntries(
      parameters.map((param: NodeParameter) => [
        param.name,
        {
          type:
            param.type === 'number' || param.type === 'boolean'
              ? param.type
              : 'string',
          description: param.description || '',
        },
      ]),
    );
    const required = parameters
      .filter((param: NodeParameter) => param.required !== false)
      .map((param: NodeParameter) => param.name);

    return {
      type: 'function',
      function: {
        name: node.data.name || node.id,
        description: node.data.description || 'Generated MCP-Flow tool',
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };
  }

  private buildMcpContext(resources: McpResource[], prompts: McpPrompt[]) {
    const lines: string[] = [];
    if (resources.length > 0) {
      lines.push('Available MCP resources:');
      resources.forEach((resource) => {
        lines.push(
          `- ${resource.name} (${resource.uri}, ${resource.mimeType || 'text/plain'}): ${
            resource.description || resource.title || 'No description'
          }`,
        );
      });
    }
    if (prompts.length > 0) {
      lines.push('Available MCP prompts:');
      prompts.forEach((prompt) => {
        lines.push(
          `- ${prompt.name}: ${prompt.description || prompt.template.slice(0, 80)}`,
        );
      });
    }
    return lines.join('\n');
  }

  private parseToolArguments(
    value: Record<string, unknown> | string | undefined,
  ): Record<string, unknown> {
    if (!value) return {};
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async callOllama(
    ollamaUrl: string,
    body: Record<string, unknown>,
  ): Promise<OllamaChatResponse> {
    const baseUrl = ollamaUrl.replace(/\/$/, '');
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(
        'Could not reach Ollama. Make sure Ollama is running and the URL is correct.',
      );
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Ollama returned ${response.status}: ${text || response.statusText}`,
      );
    }

    return (await response.json()) as OllamaChatResponse;
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
