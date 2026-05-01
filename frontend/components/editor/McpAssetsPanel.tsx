'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Add01Icon, BookOpen01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { McpResource, McpPrompt, McpPromptArgument } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden border-zinc-200 p-0 shadow-2xl sm:h-[80vh] dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
          <div className="flex flex-col gap-0.5 text-left">
            <DialogTitle className="text-sm font-semibold">Workflow Assets</DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-500">
              Manage MCP resources and prompts for this workflow.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs defaultValue="resources" className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-zinc-100 px-5 py-2.5 dark:border-zinc-800">
            <TabsList className="grid w-[300px] grid-cols-2">
              <TabsTrigger value="resources" className="text-xs">
                Resources
                <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {resources.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="prompts" className="text-xs">
                Prompts
                <span className="ml-2 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {prompts.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resources" className="m-0 min-h-0 flex-1 p-0">
            <div className="grid h-full grid-cols-[280px_1fr]">
              <AssetList
                title="RESOURCES"
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
              <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-900/10">
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
                  <EmptyEditor label="Select a resource to edit" />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="m-0 min-h-0 flex-1 p-0">
            <div className="grid h-full grid-cols-[280px_1fr]">
              <AssetList
                title="PROMPTS"
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
              <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-900/10">
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
                  <EmptyEditor label="Select a prompt to edit" />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <Button type="button" variant="ghost" onClick={onClose} size="sm" className="h-9 px-4">
            Cancel
          </Button>
          <Button
            onClick={() => {
              void saveWorkflow();
              onClose();
            }}
            size="sm"
            className="h-9 px-4"
          >
            Save Changes
          </Button>
        </div>
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
    <div className="flex min-h-0 flex-col border-r border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          {title}
        </span>
        <Button size="icon-xs" variant="ghost" onClick={onAdd} title={`Add ${title}`}>
          <HugeiconsIcon icon={Add01Icon} size={14} className="text-zinc-500" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {items.length === 0 ? (
          <div className="mt-8 px-4 text-center text-xs text-zinc-400">{empty}</div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`group w-full rounded-md px-3 py-2.5 text-left transition-all ${
                  selectedId === item.id
                    ? 'bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="truncate text-xs font-semibold">{item.name}</div>
                <div
                  className={`truncate font-mono text-[10px] ${selectedId === item.id ? 'text-zinc-400' : 'text-zinc-500'}`}
                >
                  {item.subtitle}
                </div>
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
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Resource Details
          </h3>
          <p className="text-xs text-zinc-500">Configure how this resource is exposed.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
          Delete Resource
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Resource Name" description="Unique identifier for the resource.">
            <Input
              value={resource.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="h-10 font-mono text-xs"
            />
          </Field>
          <Field label="URI" description="The URI that clients use to access this.">
            <Input
              value={resource.uri}
              onChange={(e) => onChange({ uri: e.target.value })}
              className="h-10 font-mono text-xs"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Display Title" description="Human-readable title for the resource.">
            <Input
              value={resource.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className="h-10 text-xs"
            />
          </Field>
          <Field label="MIME Type" description="Content type of the resource data.">
            <Select value={resource.mimeType} onValueChange={(mimeType) => onChange({ mimeType })}>
              <SelectTrigger className="h-10 text-xs">
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

        <Field
          label="Description"
          description="Helps the model understand when to use this resource."
        >
          <Input
            value={resource.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            className="h-10 text-xs"
          />
        </Field>

        <Field label="Resource Content" description="The raw data or content of this resource.">
          <Textarea
            value={resource.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={10}
            className="min-h-[200px] resize-none font-mono text-xs leading-relaxed"
          />
        </Field>
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
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Prompt Definition
          </h3>
          <p className="text-xs text-zinc-500">Configure your system or user prompt template.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} className="mr-2" />
          Delete Prompt
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-[1fr_180px] gap-6">
          <Field label="Prompt Name" description="Internal name for this prompt.">
            <Input
              value={prompt.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="h-10 font-mono text-xs"
            />
          </Field>
          <Field label="Role" description="Which role uses this prompt.">
            <Select
              value={prompt.role}
              onValueChange={(role) => onChange({ role: role as McpPrompt['role'] })}
            >
              <SelectTrigger className="h-10 text-xs">
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

        <Field label="Description" description="Short summary of what this prompt does.">
          <Input
            value={prompt.description || ''}
            onChange={(e) => onChange({ description: e.target.value })}
            className="h-10 text-xs"
          />
        </Field>

        <Field label="Template" description="The core prompt text. Use {{arg_name}} for variables.">
          <Textarea
            value={prompt.template}
            onChange={(e) => onChange({ template: e.target.value })}
            rows={8}
            className="min-h-[160px] resize-none font-mono text-xs leading-relaxed"
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
            <Label className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              PROMPT ARGUMENTS
            </Label>
            <Button
              variant="outline"
              size="xs"
              className="h-7 text-[10px]"
              onClick={() =>
                onChange({
                  arguments: [
                    ...prompt.arguments,
                    { name: `arg_${prompt.arguments.length + 1}`, type: 'string', required: true },
                  ],
                })
              }
            >
              <HugeiconsIcon icon={Add01Icon} size={12} className="mr-1" />
              Add Argument
            </Button>
          </div>
          <div className="space-y-2">
            {prompt.arguments.length === 0 ? (
              <p className="py-4 text-center text-[10px] text-zinc-400">
                No arguments defined for this prompt.
              </p>
            ) : (
              prompt.arguments.map((arg, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_120px_100px_32px] gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <Input
                    value={arg.name}
                    onChange={(e) => updateArgument(index, { name: e.target.value })}
                    className="h-8 font-mono text-[10px]"
                    placeholder="Name"
                  />
                  <Select
                    value={arg.type}
                    onValueChange={(type) => updateArgument(index, { type })}
                  >
                    <SelectTrigger className="h-8 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      checked={arg.required !== false}
                      onChange={(e) => updateArgument(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  <button
                    onClick={() =>
                      onChange({ arguments: prompt.arguments.filter((_, i) => i !== index) })
                    }
                    className="flex size-8 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2">
        <Label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-[10px] leading-normal text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyEditor({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-3 p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-700">
        <HugeiconsIcon icon={BookOpen01Icon} size={24} />
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</h4>
        <p className="mt-1 max-w-[200px] text-xs text-zinc-500">
          Assets are shared across your workflow and can be referenced by AI models.
        </p>
      </div>
    </div>
  );
}
