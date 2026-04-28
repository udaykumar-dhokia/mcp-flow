'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useFlowStore } from '@/lib/useFlowStore';
import { cn } from '@/lib/utils';

interface NodeWrapperProps {
  id: string;
  selected?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const NodeWrapper = ({ id, selected, children, className }: NodeWrapperProps) => {
  const executionNodeStatuses = useFlowStore((s) => s.executionNodeStatuses);
  const nodeStatus = executionNodeStatuses.find((s) => s.nodeId === id);
  const isRunning = nodeStatus?.status === 'running';

  const statusColor =
    nodeStatus?.status === 'success'
      ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
      : nodeStatus?.status === 'error'
        ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
        : 'border-zinc-200 dark:border-zinc-800';

  return (
    <div className="group relative">
      {isRunning && (
        <motion.div
          className="absolute inset-[-2px] z-0 rounded-xl bg-[conic-gradient(from_0deg,transparent,#3b82f6,#60a5fa,transparent)] opacity-100"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div
        className={cn(
          'relative z-10 min-w-[240px] overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 dark:bg-zinc-950',
          statusColor,
          selected && 'border-blue-500 ring-2 ring-blue-500/40',
          isRunning && 'border-transparent',
          className,
        )}
      >
        {children}
      </div>

      {isRunning && (
        <div className="absolute -inset-4 z-[-1] animate-pulse rounded-full bg-blue-500/10 blur-2xl" />
      )}
    </div>
  );
};
