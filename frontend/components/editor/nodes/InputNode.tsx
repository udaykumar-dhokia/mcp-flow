'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings01Icon } from '@hugeicons/core-free-icons';
import { GraphNodeData, NodeParameter } from '../../../types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

const InputNode = ({ data, id, selected }: NodeProps) => {
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
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-blue-50 px-3 py-2 dark:border-zinc-800 dark:bg-blue-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-blue-500 text-white">
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
    </div>
  );
};

export default memo(InputNode);
