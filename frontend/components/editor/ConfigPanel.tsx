'use client';

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
  Globe02Icon,
  Layout01Icon,
  RepeatIcon,
  GitBranchIcon,
  SquareLockPasswordIcon,
  Delete02Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFlowStore } from '@/lib/useFlowStore';
import { GraphNodeData, NodeParameter, TransformMapping } from '../../types/workflow';

interface ConfigPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_META: Record<string, { icon: any; label: string; color: string }> = {
  inputNode: { icon: Settings01Icon, label: 'Input', color: 'text-blue-500' },
  httpNode: {
    icon: Globe02Icon,
    label: 'HTTP Request',
    color: 'text-emerald-500',
  },
  outputNode: {
    icon: Layout01Icon,
    label: 'Output',
    color: 'text-purple-500',
  },
  transformNode: {
    icon: RepeatIcon,
    label: 'Transform',
    color: 'text-amber-500',
  },
  conditionNode: {
    icon: GitBranchIcon,
    label: 'Condition',
    color: 'text-orange-500',
  },
  secretNode: {
    icon: SquareLockPasswordIcon,
    label: 'Secret',
    color: 'text-red-500',
  },
};

export default function ConfigPanel({ selectedNode, onUpdateNode }: ConfigPanelProps) {
  const deleteNode = useFlowStore((s) => s.deleteNode);
  const edges = useFlowStore((s) => s.edges);
  const nodes = useFlowStore((s) => s.nodes);

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
        <p className="text-sm">Select a node to configure</p>
      </div>
    );
  }

  const { id, type } = selectedNode;
  const data = selectedNode.data as GraphNodeData;
  const meta = NODE_META[type || ''] || NODE_META.inputNode;

  const handleValueChange = (name: string, value: unknown) => {
    onUpdateNode(id, { ...data, [name]: value });
  };

  const incomingEdges = edges.filter((e) => e.target === id);
  const outgoingEdges = edges.filter((e) => e.source === id);
  const connectedInNodes = incomingEdges.map(
    (e) => nodes.find((n) => n.id === e.source)?.type || 'unknown',
  );
  const connectedOutNodes = outgoingEdges.map(
    (e) => nodes.find((n) => n.id === e.target)?.type || 'unknown',
  );

  return (
    <div className="flex h-full flex-col dark:text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={meta.icon} size={16} className={meta.color} />
          <h2 className="text-sm font-semibold">{meta.label}</h2>
        </div>
        <span className="font-mono text-[9px] text-zinc-400">{id.slice(0, 16)}</span>
      </div>

      <Tabs defaultValue="settings" className="flex flex-1 flex-col">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger value="settings" className="text-xs">
            Settings
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-xs">
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-5 pt-3">
            {type === 'inputNode' && (
              <InputNodeConfig
                data={data}
                onChange={handleValueChange}
                onUpdateNode={onUpdateNode}
                id={id}
              />
            )}
            {type === 'httpNode' && <HttpNodeConfig data={data} onChange={handleValueChange} />}
            {type === 'outputNode' && <OutputNodeConfig data={data} onChange={handleValueChange} />}
            {type === 'transformNode' && (
              <TransformNodeConfig
                data={data}
                onChange={handleValueChange}
                onUpdateNode={onUpdateNode}
                id={id}
              />
            )}
            {type === 'conditionNode' && (
              <ConditionNodeConfig data={data} onChange={handleValueChange} />
            )}
            {type === 'secretNode' && <SecretNodeConfig data={data} onChange={handleValueChange} />}
          </div>
        </TabsContent>

        <TabsContent value="connections" className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4 pt-3">
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Incoming ({incomingEdges.length})
              </Label>
              {connectedInNodes.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {connectedInNodes.map((t, i) => (
                    <div
                      key={i}
                      className="rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {NODE_META[t]?.label || t}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-xs text-zinc-400">None</div>
              )}
            </div>
            <div>
              <Label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Outgoing ({outgoingEdges.length})
              </Label>
              {connectedOutNodes.length > 0 ? (
                <div className="mt-1 space-y-1">
                  {connectedOutNodes.map((t, i) => (
                    <div
                      key={i}
                      className="rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                    >
                      {NODE_META[t]?.label || t}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-xs text-zinc-400">None</div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          onClick={() => deleteNode(id)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
          Delete Node
        </Button>
      </div>
    </div>
  );
}

function InputNodeConfig({
  data,
  onChange,
  onUpdateNode,
  id,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  id: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Tool Name</Label>
        <Input
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. get_weather"
          className="h-8 font-mono text-xs"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={2}
          placeholder="What does this tool do?"
          className="text-xs"
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Parameters
          </Label>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-[10px]"
            onClick={() => {
              const params = data.parameters || [];
              onUpdateNode(id, {
                ...data,
                parameters: [
                  ...params,
                  {
                    name: 'param_' + params.length,
                    type: 'string',
                    description: '',
                    required: true,
                    defaultValue: '',
                  },
                ],
              });
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={10} />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {(data.parameters || []).map((param: NodeParameter, index: number) => (
            <div
              key={index}
              className="space-y-2 rounded-md border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="flex items-center gap-1.5">
                <Input
                  value={param.name}
                  onChange={(e) => {
                    const params = [...(data.parameters || [])];
                    params[index] = { ...params[index], name: e.target.value };
                    onChange('parameters', params);
                  }}
                  className="h-7 flex-1 font-mono text-[10px]"
                  placeholder="name"
                />
                <Select
                  value={param.type || 'string'}
                  onValueChange={(v) => {
                    const params = [...(data.parameters || [])];
                    params[index] = { ...params[index], type: v };
                    onChange('parameters', params);
                  }}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  className="flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  onClick={() => {
                    const params = data.parameters!.filter(
                      (_: NodeParameter, i: number) => i !== index,
                    );
                    onChange('parameters', params);
                  }}
                >
                  <span className="text-sm">x</span>
                </button>
              </div>
              <Input
                value={param.description || ''}
                onChange={(e) => {
                  const params = [...data.parameters!];
                  params[index] = {
                    ...params[index],
                    description: e.target.value,
                  };
                  onChange('parameters', params);
                }}
                className="h-7 text-[10px]"
                placeholder="Description..."
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <input
                    type="checkbox"
                    checked={param.required !== false}
                    onChange={(e) => {
                      const params = [...(data.parameters || [])];
                      params[index] = {
                        ...params[index],
                        required: e.target.checked,
                      };
                      onChange('parameters', params);
                    }}
                    className="size-3 rounded"
                  />
                  Required
                </label>
                <Input
                  value={(param.defaultValue as string | number) || ''}
                  onChange={(e) => {
                    const params = [...(data.parameters || [])];
                    params[index] = {
                      ...params[index],
                      defaultValue: e.target.value,
                    };
                    onChange('parameters', params);
                  }}
                  className="h-6 flex-1 text-[9px]"
                  placeholder="Default value"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function HttpNodeConfig({
  data,
  onChange,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
}) {
  const [headersText, setHeadersText] = useState(
    data.headers ? JSON.stringify(data.headers, null, 2) : '{}',
  );

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Method</Label>
        <Select value={data.method || 'GET'} onValueChange={(v) => onChange('method', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">URL</Label>
        <Input
          value={data.url || ''}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="https://api.example.com/{{input.param}}"
          className="h-8 font-mono text-xs"
        />
        <p className="text-[9px] text-zinc-400">Use {'{{input.paramName}}'} for dynamic values</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Headers (JSON)</Label>
        <Textarea
          value={headersText}
          onChange={(e) => {
            setHeadersText(e.target.value);
            try {
              const parsed = JSON.parse(e.target.value);
              onChange('headers', parsed);
            } catch {
              // invalid JSON, don't update
            }
          }}
          rows={3}
          className="font-mono text-[10px]"
          placeholder='{"Authorization": "Bearer {{secret.API_KEY}}"}'
        />
      </div>
      {data.method !== 'GET' && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Request Body (JSON)</Label>
          <Textarea
            value={data.body || ''}
            onChange={(e) => onChange('body', e.target.value)}
            rows={4}
            className="font-mono text-[10px]"
            placeholder='{"key": "{{input.value}}"}'
          />
        </div>
      )}
    </>
  );
}

function OutputNodeConfig({
  data,
  onChange,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Output Type</Label>
        <Select value={data.outputType || 'text'} onValueChange={(v) => onChange('outputType', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select output type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text / JSON</SelectItem>
            <SelectItem value="widget">Interactive Widget</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md bg-zinc-50 p-2.5 dark:bg-zinc-900">
          {data.outputType === 'widget' ? (
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Returns a structured card with labeled fields. The generated code uses
              <code className="mx-0.5 rounded bg-zinc-200 px-1 font-mono dark:bg-zinc-800">
                widget()
              </code>
              from mcp-use, which renders interactive UI in ChatGPT and other MCP Apps hosts.
            </p>
          ) : (
            <p className="text-[10px] leading-relaxed text-zinc-500">
              Returns raw JSON data using
              <code className="mx-0.5 rounded bg-zinc-200 px-1 font-mono dark:bg-zinc-800">
                object()
              </code>
              from mcp-use. The LLM receives the data directly and formats it in its response.
            </p>
          )}
        </div>
      </div>

      {data.outputType === 'widget' && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Widget Title</Label>
            <Input
              value={data.widgetTitle || ''}
              onChange={(e) => onChange('widgetTitle', e.target.value)}
              placeholder="e.g. User Profile"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Widget Description</Label>
            <Input
              value={data.widgetDescription || ''}
              onChange={(e) => onChange('widgetDescription', e.target.value)}
              placeholder="Brief description shown in the card header"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </>
  );
}

function TransformNodeConfig({
  data,
  onChange,
  onUpdateNode,
  id,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
  onUpdateNode: (id: string, data: Record<string, unknown>) => void;
  id: string;
}) {
  const mappings = data.mappings || [];

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Field Mappings
          </Label>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 text-[10px]"
            onClick={() => {
              onUpdateNode(id, {
                ...data,
                mappings: [...mappings, { from: '', to: '' }],
              });
            }}
          >
            <HugeiconsIcon icon={Add01Icon} size={10} />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {mappings.map((m: TransformMapping, i: number) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={m.from}
                onChange={(e) => {
                  const updated = [...mappings];
                  updated[i] = { ...updated[i], from: e.target.value };
                  onChange('mappings', updated);
                }}
                className="h-7 flex-1 font-mono text-[10px]"
                placeholder="source.field"
              />
              <span className="text-[10px] text-zinc-400">{'→'}</span>
              <Input
                value={m.to}
                onChange={(e) => {
                  const updated = [...mappings];
                  updated[i] = { ...updated[i], to: e.target.value };
                  onChange('mappings', updated);
                }}
                className="h-7 flex-1 font-mono text-[10px]"
                placeholder="target.field"
              />
              <button
                className="flex size-7 shrink-0 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500"
                onClick={() => {
                  onChange(
                    'mappings',
                    mappings.filter((_: TransformMapping, idx: number) => idx !== i),
                  );
                }}
              >
                <span className="text-sm">x</span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">JS Expression (optional)</Label>
        <Textarea
          value={data.expression || ''}
          onChange={(e) => onChange('expression', e.target.value)}
          rows={3}
          className="font-mono text-[10px]"
          placeholder="return { ...data, fullName: data.first + ' ' + data.last }"
        />
        <p className="text-[9px] text-zinc-400">
          Access incoming data via the &apos;data&apos; variable
        </p>
      </div>
    </>
  );
}

function ConditionNodeConfig({
  data,
  onChange,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Field</Label>
        <Input
          value={data.field || ''}
          onChange={(e) => onChange('field', e.target.value)}
          placeholder="e.g. status, data.count"
          className="h-8 font-mono text-xs"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Operator</Label>
        <Select value={data.operator || 'equals'} onValueChange={(v) => onChange('operator', v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals (==)</SelectItem>
            <SelectItem value="not_equals">Not Equals (!=)</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="gt">Greater Than ({'>'}) </SelectItem>
            <SelectItem value="lt">Less Than ({'<'})</SelectItem>
            <SelectItem value="gte">Greater or Equal ({'>'}=)</SelectItem>
            <SelectItem value="lte">Less or Equal ({'<'}=)</SelectItem>
            <SelectItem value="exists">Exists</SelectItem>
            <SelectItem value="not_exists">Not Exists</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {!['exists', 'not_exists'].includes(data.operator || 'equals') && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Value</Label>
          <Input
            value={(data.value as string | number) || ''}
            onChange={(e) => onChange('value', e.target.value)}
            placeholder="Expected value"
            className="h-8 text-xs"
          />
        </div>
      )}
    </>
  );
}

function SecretNodeConfig({
  data,
  onChange,
}: {
  data: GraphNodeData;
  onChange: (name: string, value: unknown) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Key Name</Label>
        <Input
          value={data.secretKey || ''}
          onChange={(e) => onChange('secretKey', e.target.value)}
          placeholder="e.g. API_KEY"
          className="h-8 font-mono text-xs uppercase"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Value</Label>
        <Input
          type="password"
          value={data.secretValue || ''}
          onChange={(e) => onChange('secretValue', e.target.value)}
          placeholder="sk-..."
          className="h-8 font-mono text-xs"
        />
        <p className="text-[9px] text-zinc-400">
          Stored locally. Use {'{{secret.KEY_NAME}}'} in HTTP nodes.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description</Label>
        <Input
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="What is this secret for?"
          className="h-8 text-xs"
        />
      </div>
    </>
  );
}
