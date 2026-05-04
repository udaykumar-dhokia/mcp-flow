'use client';

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings01Icon,
  Globe02Icon,
  Layout01Icon,
  RepeatIcon,
  GitBranchIcon,
  SquareLockPasswordIcon,
  Search01Icon,
  Note01Icon,
} from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: string;
  category: string;
  defaultData: Record<string, unknown>;
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: 'inputNode',
    label: 'Input',
    description: 'Define tool name, description, and parameters',
    icon: Settings01Icon,
    color: 'blue-700',
    category: 'Triggers',
    defaultData: { name: 'my_tool', description: '', parameters: [] },
  },
  {
    type: 'httpNode',
    label: 'HTTP Request',
    description: 'Make HTTP requests to APIs',
    icon: Globe02Icon,
    color: 'emerald-700',
    category: 'Actions',
    defaultData: { method: 'GET', url: '', headers: {}, body: '' },
  },
  {
    type: 'transformNode',
    label: 'Transform',
    description: 'Map and transform JSON data',
    icon: RepeatIcon,
    color: 'amber-600',
    category: 'Logic',
    defaultData: { mappings: [], expression: '' },
  },
  {
    type: 'conditionNode',
    label: 'Condition',
    description: 'If/Else branching logic',
    icon: GitBranchIcon,
    color: 'orange-700',
    category: 'Logic',
    defaultData: { field: '', operator: 'equals', value: '' },
  },
  {
    type: 'outputNode',
    label: 'Output',
    description: 'Define the response returned to the LLM',
    icon: Layout01Icon,
    color: 'purple-700',
    category: 'Output',
    defaultData: { outputType: 'text' },
  },
  {
    type: 'secretNode',
    label: 'Secret',
    description: 'Inject API keys and secrets securely',
    icon: SquareLockPasswordIcon,
    color: 'red-700',
    category: 'Security',
    defaultData: { secretKey: '', secretValue: '', description: '' },
  },
  {
    type: 'noteNode',
    label: 'Note',
    description: 'Add sticky notes and documentation',
    icon: Note01Icon,
    color: 'yellow-600',
    category: 'Utility',
    defaultData: { noteText: '' },
  },
];

const INSET_SHADOW_COLOR_MAP: Record<string, string> = {
  'blue-700': 'inset-shadow-blue-700/60',
  'emerald-700': 'inset-shadow-emerald-700/60',
  'amber-600': 'inset-shadow-amber-600/60',
  'orange-700': 'inset-shadow-orange-700/60',
  'purple-700': 'inset-shadow-purple-700/60',
  'red-700': 'inset-shadow-red-700/60',
  'yellow-600': 'inset-shadow-yellow-600/60',
};

const CATEGORIES = ['Triggers', 'Actions', 'Logic', 'Output', 'Security', 'Utility'];

interface NodePaletteProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function NodePalette({ isCollapsed, onToggle }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = searchQuery
    ? NODE_DEFINITIONS.filter(
        (n) =>
          n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : NODE_DEFINITIONS;

  const onDragStart = (event: React.DragEvent, nodeDefinition: NodeDefinition) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({
        type: nodeDefinition.type,
        data: nodeDefinition.defaultData,
      }),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-zinc-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <button
          onClick={onToggle}
          className="mb-4 flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          title="Expand palette"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {NODE_DEFINITIONS.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node)}
            className="mb-2 flex size-8 cursor-grab items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            title={node.label}
          >
            <HugeiconsIcon icon={node.icon} size={16} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full w-[240px] flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Nodes</span>
        <button
          onClick={onToggle}
          className="flex size-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title="Collapse palette"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-400"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {CATEGORIES.map((category) => {
          const categoryNodes = filteredNodes.filter((n) => n.category === category);
          if (categoryNodes.length === 0) return null;

          return (
            <div key={category} className="mb-4">
              <div className="mb-2 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                {category}
              </div>
              <div className="space-y-1">
                {categoryNodes.map((node) => (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, node)}
                    className="flex cursor-grab items-center gap-2.5 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-zinc-200 hover:bg-zinc-50 active:cursor-grabbing dark:hover:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <div
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded bg-white text-black inset-shadow-sm',
                        INSET_SHADOW_COLOR_MAP[node.color],
                      )}
                    >
                      <HugeiconsIcon icon={node.icon} size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {node.label}
                      </div>
                      <div className="truncate text-[10px] leading-tight text-zinc-400">
                        {node.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { NODE_DEFINITIONS };
export type { NodeDefinition };
