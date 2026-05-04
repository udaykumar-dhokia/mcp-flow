'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { RepeatIcon } from '@hugeicons/core-free-icons';
import { GraphNodeData, TransformMapping } from '../../../types/workflow';
import { NodeWrapper } from './NodeWrapper';

const TransformNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;
  const mappings = d.mappings || [];

  return (
    <NodeWrapper id={id} selected={selected}>
      <div className="bg-primary/3 flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-amber-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-white text-black inset-shadow-sm inset-shadow-amber-700/60">
          <HugeiconsIcon icon={RepeatIcon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Transform</span>
      </div>

      <div className="p-3">
        {mappings.length > 0 ? (
          <div className="space-y-1">
            {mappings.slice(0, 3).map((m: TransformMapping, i: number) => (
              <div key={i} className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                <span className="text-amber-600">{m.from}</span>
                <span className="text-zinc-400">{'->'}</span>
                <span className="text-zinc-700 dark:text-zinc-300">{m.to}</span>
              </div>
            ))}
            {mappings.length > 3 && (
              <div className="text-[10px] text-zinc-400">+{mappings.length - 3} more</div>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-zinc-400">No mappings defined</div>
        )}
        {d.expression && (
          <div className="mt-2 truncate rounded bg-zinc-50 px-2 py-1 font-mono text-[10px] text-zinc-500 dark:bg-zinc-900">
            {d.expression}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="size-2! border-0! bg-amber-400!" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="size-2! border-0! bg-amber-500!"
      />
    </NodeWrapper>
  );
};

export default memo(TransformNode);
