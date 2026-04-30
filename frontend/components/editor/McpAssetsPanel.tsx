'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, BookOpen01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { McpPrompt, McpPromptArgument, McpResource } from '@/types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

interface McpAssetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function McpAssetsPanel({ isOpen, onClose }: McpAssetsPanelProps) {
  const resources = useFlowStore((s) => s.resources);
  const prompts = useFlowStore((s) => s.prompts);
  const setResources = useFlowStore((s) => s.setResources);
  const setPrompts = useFlowStore((s) => s.setPrompts);
  const saveWorkflow = useFlowStore((s) => s.saveWorkflow);

  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === selectedResourceId) || resources[0],
    [resources, selectedResourceId],
  );
  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId) || prompts[0],
    [prompts, selectedPromptId],
  );

  const updateResource = (id: string, patch: Partial<McpResource>) => {
    setResources(
      resources.map((resource) => (resource.id === id ? { ...resource, ...patch } : resource)),
    );
  };

  const updatePrompt = (id: string, patch: Partial<McpPrompt>) => {
    setPrompts(prompts.map((prompt) => (prompt.id === id ? { ...prompt, ...patch } : prompt)));
  };

  const addResource = () => {
    const resource: McpResource = {
      id: newId(),
      name: `resource_${resources.length + 1}`,
      uri: `mcp-flow://resource/${resources.length + 1}`,
      title: '',
      description: '',
      mimeType: 'text/plain',
      content: '',
    };
    setResources([...resources, resource]);
    setSelectedResourceId(resource.id);
  };

  const addPrompt = () => {
    const prompt: McpPrompt = {
      id: newId(),
      name: `prompt_${prompts.length + 1}`,
      description: '',
      arguments: [],
      template: 'You are a helpful assistant.',
      role: 'system',
    };
    setPrompts([...prompts, prompt]);
    setSelectedPromptId(prompt.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[78vh] max-w-5xl overflow-hidden border-zinc-200 p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={BookOpen01Icon} size={16} className="text-zinc-500" />
            <div>
              <h2 className="text-sm font-semibold">MCP Resources & Prompts</h2>
              <p className="text-xs text-zinc-500">
                Define server primitives included in generated MCP code.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => void saveWorkflow()}>
            Save
          </Button>
        </div>

        <Tabs defaultValue="resources" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-5 mt-4 grid w-fit grid-cols-2">
            <TabsTrigger value="resources" className="text-xs">
              Resources ({resources.length})
            </TabsTrigger>
            <TabsTrigger value="prompts" className="text-xs">
              Prompts ({prompts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="min-h-0 flex-1 px-5 pb-5">
            <div className="grid h-full grid-cols-[260px_1fr] gap-4">
              <AssetList
                title="Resources"
                empty="No resources yet"
                items={resources.map((resource) => ({
                  id: resource.id,
                  name: resource.name,
                  subtitle: resource.uri,
                }))}
                selectedId={selectedResource?.id}
                onSelect={setSelectedResourceId}
                onAdd={addResource}
              />
              {selectedResource ? (
                <ResourceForm
                  resource={selectedResource}
                  onChange={(patch) => updateResource(selectedResource.id, patch)}
                  onDelete={() => {
                    setResources(
                      resources.filter((resource) => resource.id !== selectedResource.id),
                    );
                    setSelectedResourceId(null);
                  }}
                />
              ) : (
                <EmptyEditor label="Select or create a resource" />
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="min-h-0 flex-1 px-5 pb-5">
            <div className="grid h-full grid-cols-[260px_1fr] gap-4">
              <AssetList
                title="Prompts"
                empty="No prompts yet"
                items={prompts.map((prompt) => ({
                  id: prompt.id,
                  name: prompt.name,
                  subtitle: prompt.description || `${prompt.arguments.length} arguments`,
                }))}
                selectedId={selectedPrompt?.id}
                onSelect={setSelectedPromptId}
                onAdd={addPrompt}
              />
              {selectedPrompt ? (
                <PromptForm
                  prompt={selectedPrompt}
                  onChange={(patch) => updatePrompt(selectedPrompt.id, patch)}
                  onDelete={() => {
                    setPrompts(prompts.filter((prompt) => prompt.id !== selectedPrompt.id));
                    setSelectedPromptId(null);
                  }}
                />
              ) : (
                <EmptyEditor label="Select or create a prompt" />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AssetList({
  title,
  empty,
  items,
  selectedId,
  onSelect,
  onAdd,
}: {
  title: string;
  empty: string;
  items: { id: string; name: string; subtitle: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
          {title}
        </span>
        <Button size="icon-xs" variant="ghost" onClick={onAdd} title={`Add ${title}`}>
          <HugeiconsIcon icon={Add01Icon} size={12} />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="px-2 py-8 text-center text-xs text-zinc-400">{empty}</div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                  selectedId === item.id
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="truncate text-xs font-semibold">{item.name}</div>
                <div className="truncate font-mono text-[10px] text-zinc-400">{item.subtitle}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceForm({
  resource,
  onChange,
  onDelete,
}: {
  resource: McpResource;
  onChange: (patch: Partial<McpResource>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="min-h-0 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input
            value={resource.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 font-mono text-xs"
          />
        </Field>
        <Field label="URI">
          <Input
            value={resource.uri}
            onChange={(e) => onChange({ uri: e.target.value })}
            className="h-8 font-mono text-xs"
          />
        </Field>
        <Field label="Title">
          <Input
            value={resource.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            className="h-8 text-xs"
          />
        </Field>
        <Field label="MIME Type">
          <Select value={resource.mimeType} onValueChange={(mimeType) => onChange({ mimeType })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text/plain">text/plain</SelectItem>
              <SelectItem value="text/markdown">text/markdown</SelectItem>
              <SelectItem value="application/json">application/json</SelectItem>
              <SelectItem value="text/html">text/html</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Description" className="mt-3">
        <Input
          value={resource.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          className="h-8 text-xs"
        />
      </Field>
      <Field label="Content" className="mt-3">
        <Textarea
          value={resource.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={12}
          className="font-mono text-xs"
        />
      </Field>
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} size={13} />
          Delete
        </Button>
      </div>
    </div>
  );
}

function PromptForm({
  prompt,
  onChange,
  onDelete,
}: {
  prompt: McpPrompt;
  onChange: (patch: Partial<McpPrompt>) => void;
  onDelete: () => void;
}) {
  const updateArgument = (index: number, patch: Partial<McpPromptArgument>) => {
    const args = [...prompt.arguments];
    args[index] = { ...args[index], ...patch };
    onChange({ arguments: args });
  };

  return (
    <div className="min-h-0 overflow-y-auto rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <Field label="Name">
          <Input
            value={prompt.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="h-8 font-mono text-xs"
          />
        </Field>
        <Field label="Role">
          <Select
            value={prompt.role}
            onValueChange={(role) => onChange({ role: role as McpPrompt['role'] })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Description" className="mt-3">
        <Input
          value={prompt.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          className="h-8 text-xs"
        />
      </Field>
      <Field label="Template" className="mt-3">
        <Textarea
          value={prompt.template}
          onChange={(e) => onChange({ template: e.target.value })}
          rows={8}
          className="font-mono text-xs"
        />
      </Field>
      <div className="mt-4 flex items-center justify-between">
        <Label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
          Arguments
        </Label>
        <Button
          variant="outline"
          size="xs"
          onClick={() =>
            onChange({
              arguments: [
                ...prompt.arguments,
                { name: `arg_${prompt.arguments.length + 1}`, type: 'string', required: true },
              ],
            })
          }
        >
          <HugeiconsIcon icon={Add01Icon} size={12} />
          Add
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        {prompt.arguments.map((arg, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_110px_90px_28px] gap-2 rounded-md border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <Input
              value={arg.name}
              onChange={(e) => updateArgument(index, { name: e.target.value })}
              className="h-7 font-mono text-[10px]"
            />
            <Select value={arg.type} onValueChange={(type) => updateArgument(index, { type })}>
              <SelectTrigger className="h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1 text-[10px] text-zinc-500">
              <input
                type="checkbox"
                checked={arg.required !== false}
                onChange={(e) => updateArgument(index, { required: e.target.checked })}
              />
              Required
            </label>
            <button
              onClick={() =>
                onChange({ arguments: prompt.arguments.filter((_, i) => i !== index) })
              }
              className="flex size-7 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} size={13} />
          Delete
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}

function EmptyEditor({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800">
      {label}
    </div>
  );
}
