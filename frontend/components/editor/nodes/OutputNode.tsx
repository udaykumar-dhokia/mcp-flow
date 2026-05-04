'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Layout01Icon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { NodeWrapper } from './NodeWrapper';

const OutputNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;

  return (
    <NodeWrapper id={id} selected={selected}>
      <div className="bg-primary/3 flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-purple-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-white text-black inset-shadow-sm inset-shadow-purple-700/60">
          <HugeiconsIcon icon={Layout01Icon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Output</span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 rounded bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900">
          <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            {d.outputType === 'widget' ? 'Interactive Widget' : 'Text / JSON'}
          </span>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="size-2! border-0! bg-purple-400!" />
    </NodeWrapper>
  );
};

export default memo(OutputNode);
