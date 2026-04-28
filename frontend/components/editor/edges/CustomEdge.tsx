'use client';

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import { useFlowStore } from '@/lib/useFlowStore';
import { HugeiconsIcon } from '@hugeicons/react';
import { Close } from '@hugeicons/core-free-icons';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps) {
  const deleteEdge = useFlowStore((s) => s.deleteEdge);
  const executionState = useFlowStore((s) => s.executionState);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const isExecuting = executionState === 'running';
  const edgeColor =
    (data as Record<string, unknown>)?.branch === 'true'
      ? 'var(--color-emerald-500, #10b981)'
      : (data as Record<string, unknown>)?.branch === 'false'
        ? 'var(--color-red-500, #ef4444)'
        : selected
          ? 'var(--color-blue-500, #3b82f6)'
          : 'var(--color-zinc-300, #d4d4d8)';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          transition: 'stroke 0.15s, stroke-width 0.15s',
        }}
        className={isExecuting ? 'animated' : ''}
      />
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(id);
              }}
              className="flex size-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-[10px] text-zinc-500 transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <HugeiconsIcon icon={Close} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
