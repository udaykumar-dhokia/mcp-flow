'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Download01Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
  LayoutIcon,
} from '@hugeicons/core-free-icons';
import { useFlowStore } from '@/lib/useFlowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Logo } from '@/components/ui/Logo';

interface EditorHeaderProps {
  onExport: () => void;
  onShowTemplates: () => void;
}

export default function EditorHeader({ onExport, onShowTemplates }: EditorHeaderProps) {
  const { workflowName, setWorkflowName, clearCanvas, nodes } = useFlowStore();
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const canUndo = useFlowStore((s) => s.canUndo());
  const canRedo = useFlowStore((s) => s.canRedo());

  const [isEditingName, setIsEditingName] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    if (nodes.length === 0) return;
    if (showClearConfirm) {
      clearCanvas();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="flex h-14 items-center justify-around border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-6">
        <Logo size={28} />

        <div className="flex items-center gap-3">
          {isEditingName ? (
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
              }}
              className="h-7 w-48 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold text-zinc-900 transition-colors hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
            >
              {workflowName}
            </button>
          )}

          <div className="ml-2 flex items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Undo (Ctrl+Z)"
            >
              <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="flex size-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Redo (Ctrl+Y)"
            >
              <HugeiconsIcon icon={ArrowTurnForwardIcon} size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onShowTemplates}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            title="Browse templates"
          >
            <HugeiconsIcon icon={LayoutIcon} size={14} />
            Templates
          </button>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          <button
            onClick={handleClear}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              showClearConfirm
                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300'
            }`}
            disabled={nodes.length === 0}
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
            {showClearConfirm ? 'Confirm Clear' : 'Clear'}
          </button>

          <Button
            onClick={onExport}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            disabled={nodes.length === 0}
          >
            <HugeiconsIcon icon={Download01Icon} size={14} />
            Export Code
          </Button>
        </div>
      </div>
    </div>
  );
}
