'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Download01Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
  LayoutIcon,
  Add01Icon,
  BookOpen01Icon,
  Message01Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons';
import { useFlowStore } from '@/lib/useFlowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy01Icon } from '@hugeicons/core-free-icons';

import { Logo } from '@/components/ui/Logo';

interface EditorHeaderProps {
  onExport: () => void;
  onShowTemplates: () => void;
  onShowAssets: () => void;
  onShowChat: () => void;
}

export default function EditorHeader({
  onExport,
  onShowTemplates,
  onShowAssets,
  onShowChat,
}: EditorHeaderProps) {
  const {
    workflowName,
    setWorkflowName,
    clearCanvas,
    nodes,
    workflows,
    currentWorkflowId,
    switchWorkflow,
    createWorkflow,
    saveWorkflow,
    isSaving,
    persistenceError,
    isLive,
    liveUrl,
    toggleLive,
  } = useFlowStore();
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
    <div className="relative z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-6">
        <Logo size={28} />

        <div className="flex items-center gap-3">
          <Select value={currentWorkflowId || ''} onValueChange={(val) => void switchWorkflow(val)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              {workflows.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id} className="text-xs">
                  {workflow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => void createWorkflow(`Workflow ${workflows.length + 1}`)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title="New workflow"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          New
        </button>

        <button
          onClick={() => void saveWorkflow()}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title={persistenceError || 'Save workflow'}
        >
          {isSaving ? (
            <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <HugeiconsIcon icon={FloppyDiskIcon} size={14} />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <div className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/50 py-1 pr-2 pl-3 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Label
              htmlFor="live-mode"
              className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase"
            >
              <span
                className={`size-1.5 rounded-full ${isLive ? 'animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`}
              />
              Live
            </Label>
            <Switch
              id="live-mode"
              checked={isLive}
              onCheckedChange={toggleLive}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {isLive && liveUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-emerald-100 bg-emerald-50/50 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-400"
              onClick={() => {
                void navigator.clipboard.writeText(liveUrl);
                toast.success('MCP URL copied to clipboard');
              }}
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} />
              Copy URL
            </Button>
          )}
        </div>

        <div className="mx-2 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

        <button
          onClick={onShowTemplates}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title="Browse templates"
        >
          <HugeiconsIcon icon={LayoutIcon} size={14} />
          Templates
        </button>

        <button
          onClick={onShowAssets}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title="Resources and prompts"
        >
          <HugeiconsIcon icon={BookOpen01Icon} size={14} />
          MCP Assets
        </button>

        <button
          onClick={onShowChat}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          title="Test with Ollama"
        >
          <HugeiconsIcon icon={Message01Icon} size={14} />
          Inspector
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
  );
}
