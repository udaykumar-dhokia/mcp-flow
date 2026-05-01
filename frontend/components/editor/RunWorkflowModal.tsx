'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Node } from '@xyflow/react';
import { GraphNodeData, NodeParameter } from '../../types/workflow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface RunWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  onRun: (values: Record<string, unknown>) => void;
  isRunning: boolean;
}

export default function RunWorkflowModal({
  isOpen,
  onClose,
  nodes,
  onRun,
  isRunning,
}: RunWorkflowModalProps) {
  const [values, setValues] = React.useState<Record<string, unknown>>({});

  const inputNodes = nodes.filter((n) => n.type === 'inputNode');
  const allParams = inputNodes.flatMap((n) => {
    const d = n.data as GraphNodeData;
    return (d.parameters || []).map((p: NodeParameter) => ({
      ...p,
      toolName: d.name || 'unnamed',
    }));
  });

  React.useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('mcp-flow-run-values');
      const initial: Record<string, unknown> = stored ? JSON.parse(stored) : {};
      allParams.forEach((p) => {
        if (initial[p.name] === undefined) {
          initial[p.name] = p.defaultValue || '';
        }
      });
      setTimeout(() => setValues(initial), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mcp-flow-run-values', JSON.stringify(values));
    onRun(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg overflow-hidden border-zinc-200 p-0 sm:w-[400px] dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-sm font-semibold">Run Workflow</DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-500">
              Provide input parameters
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[50vh] space-y-4 overflow-y-auto p-5">
            {allParams.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">No parameters defined.</p>
            ) : (
              allParams.map((param: NodeParameter & { toolName: string }) => (
                <div key={param.name} className="space-y-1.5">
                  <Label className="text-xs">{param.name}</Label>
                  {param.type === 'boolean' ? (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={values[param.name] === true || values[param.name] === 'true'}
                        onChange={(e) => setValues({ ...values, [param.name]: e.target.checked })}
                        className="size-4 rounded"
                      />
                      {param.description || param.name}
                    </label>
                  ) : param.type === 'number' ? (
                    <Input
                      type="number"
                      value={(values[param.name] as string | number) || ''}
                      onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                      placeholder={param.description || `Enter ${param.name}`}
                      required={param.required !== false}
                    />
                  ) : (
                    <Input
                      value={(values[param.name] as string | number) || ''}
                      onChange={(e) => setValues({ ...values, [param.name]: e.target.value })}
                      placeholder={param.description || `Enter ${param.name}`}
                      required={param.required !== false}
                    />
                  )}
                  {param.description && (
                    <p className="text-[9px] text-zinc-400">{param.description}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isRunning} size="lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isRunning} size="lg" className="gap-1.5">
              {isRunning ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <HugeiconsIcon icon={PlayIcon} size={14} />
              )}
              {isRunning ? 'Executing...' : 'Run'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
