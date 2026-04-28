'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLockPasswordIcon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { NodeWrapper } from './NodeWrapper';

const SecretNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;

  return (
    <NodeWrapper id={id} selected={selected}>
      <div className="bg-primary/3 flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800 dark:bg-red-950/30">
        <div className="bg-primary/5 flex size-6 items-center justify-center rounded text-red-700">
          <HugeiconsIcon icon={SquareLockPasswordIcon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Secret</span>
      </div>

      <div className="p-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500">Key:</span>
            <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
              {d.secretKey || 'UNNAMED_KEY'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500">Value:</span>
            <span className="font-mono text-[10px] text-zinc-400">{'*'.repeat(12)}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="size-2! border-0! bg-red-500!" />
    </NodeWrapper>
  );
};

export default memo(SecretNode);
