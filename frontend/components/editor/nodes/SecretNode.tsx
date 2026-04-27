'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLockPasswordIcon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

const SecretNode = ({ data, id, selected }: NodeProps) => {
  const executionNodeStatuses = useFlowStore((s) => s.executionNodeStatuses);
  const nodeStatus = executionNodeStatuses.find((s) => s.nodeId === id);

  const statusColor =
    nodeStatus?.status === 'running'
      ? 'border-blue-500'
      : nodeStatus?.status === 'success'
        ? 'border-emerald-500'
        : nodeStatus?.status === 'error'
          ? 'border-red-500'
          : 'border-zinc-200 dark:border-zinc-800';

  const d = data as GraphNodeData;

  return (
    <div
      className={`min-w-[240px] overflow-hidden rounded-lg border bg-white dark:bg-zinc-950 ${statusColor} ${selected ? 'ring-2 ring-blue-500/40' : ''}`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-red-50 px-3 py-2 dark:border-zinc-800 dark:bg-red-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-red-500 text-white">
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
    </div>
  );
};

export default memo(SecretNode);
