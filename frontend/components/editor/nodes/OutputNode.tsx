'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Layout01Icon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

const OutputNode = ({ data, id, selected }: NodeProps) => {
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
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-purple-50 px-3 py-2 dark:border-zinc-800 dark:bg-purple-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-purple-500 text-white">
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
    </div>
  );
};

export default memo(OutputNode);
