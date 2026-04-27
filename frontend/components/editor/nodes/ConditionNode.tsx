'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { GitBranchIcon } from '@hugeicons/core-free-icons';
import { GraphNodeData } from '../../../types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

const ConditionNode = ({ data, id, selected }: NodeProps) => {
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
  const field = d.field || '';
  const operator = d.operator || 'equals';
  const value = d.value || '';

  const operatorLabels: Record<string, string> = {
    equals: '==',
    not_equals: '!=',
    contains: 'contains',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    exists: 'exists',
    not_exists: '!exists',
  };

  return (
    <div
      className={`min-w-[240px] overflow-hidden rounded-lg border bg-white dark:bg-zinc-950 ${statusColor} ${selected ? 'ring-2 ring-blue-500/40' : ''}`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 bg-orange-50 px-3 py-2 dark:border-zinc-800 dark:bg-orange-950/30">
        <div className="flex size-6 items-center justify-center rounded bg-orange-500 text-white">
          <HugeiconsIcon icon={GitBranchIcon} size={14} />
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Condition</span>
      </div>

      <div className="p-3">
        {field ? (
          <div className="rounded bg-zinc-50 px-2 py-1.5 font-mono text-[10px] dark:bg-zinc-900">
            <span className="text-orange-600">{field}</span>{' '}
            <span className="text-zinc-400">{operatorLabels[operator] || operator}</span>{' '}
            {!['exists', 'not_exists'].includes(operator) && (
              <span className="text-zinc-700 dark:text-zinc-300">&quot;{value}&quot;</span>
            )}
          </div>
        ) : (
          <div className="text-[10px] text-zinc-400">No condition configured</div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-medium text-emerald-600">TRUE</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full bg-red-500" />
            <span className="text-[9px] font-medium text-red-500">FALSE</span>
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="size-2! border-0! bg-orange-400!" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '30%' }}
        className="size-2! border-0! bg-emerald-500!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '70%' }}
        className="size-2! border-0! bg-red-500!"
      />
    </div>
  );
};

export default memo(ConditionNode);
