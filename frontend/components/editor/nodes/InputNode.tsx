'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon } from '@hugeicons/core-free-icons';
import { GraphNodeData, NodeParameter } from '../../../types/workflow';
import { NodeWrapper } from './NodeWrapper';

const InputNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;
  return (
    <NodeWrapper id={id} selected={selected}>
      <div className="bg-primary/3 flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-blue-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-white text-black inset-shadow-sm inset-shadow-blue-700/60">
          <HugeiconsIcon icon={Settings01Icon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Input</span>
        {d.name && <span className="ml-auto font-mono text-[10px] text-zinc-400">{d.name}</span>}
      </div>

      <div className="space-y-2 p-3">
        <div className="text-[10px] leading-relaxed text-zinc-500">
          {d.description || 'No description'}
        </div>

        {d.parameters && d.parameters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.parameters?.map((p: NodeParameter, i: number) => (
              <div
                key={i}
                className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 dark:bg-blue-900/30"
              >
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  {p.name}
                </span>
                <span className="text-[8px] text-zinc-400">{p.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="size-2! border-0! bg-blue-500!" />
    </NodeWrapper>
  );
};

export default memo(InputNode);
