'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Globe02Icon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { NodeWrapper } from './NodeWrapper';

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  POST: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  PUT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
};

const HttpNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;
  const method = d.method || 'GET';

  return (
    <NodeWrapper id={id} selected={selected}>
      <div className="bg-primary/3 flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-emerald-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-white text-black inset-shadow-sm inset-shadow-emerald-700/60">
          <HugeiconsIcon icon={Globe02Icon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">HTTP Request</span>
        <span
          className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${METHOD_COLORS[method] || METHOD_COLORS.GET}`}
        >
          {method}
        </span>
      </div>

      <div className="p-3">
        <div className="truncate font-mono text-[10px] text-zinc-500">
          {d.url || 'https://api.example.com'}
        </div>
        {d.headers && Object.keys(d.headers).length > 0 && (
          <div className="mt-1 text-[9px] text-zinc-400">
            {Object.keys(d.headers).length} header(s)
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="size-2! border-0! bg-emerald-400!" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="size-2! border-0! bg-emerald-500!"
      />
    </NodeWrapper>
  );
};

export default memo(HttpNode);
