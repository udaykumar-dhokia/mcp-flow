'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Node } from '@xyflow/react';
import { GraphNodeData, NodeParameter } from '../../types/workflow';

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-2 text-blue-600">
                  <HugeiconsIcon icon={PlayIcon} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Run Workflow</h3>
                  <p className="text-[10px] text-zinc-500">Provide input parameters</p>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[50vh] space-y-4 overflow-y-auto p-5">
                {allParams.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500">No parameters defined.</p>
                ) : (
                  allParams.map((param: NodeParameter & { toolName: string }) => (
                    <div key={param.name} className="space-y-1.5">
                      <Label className="text-xs">{param.name}</Label>
                      {param.type === 'boolean' ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={values[param.name] === true || values[param.name] === 'true'}
                            onChange={(e) =>
                              setValues({ ...values, [param.name]: e.target.checked })
                            }
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isRunning}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isRunning} size="sm" className="gap-1.5">
                  {isRunning ? (
                    <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <HugeiconsIcon icon={PlayIcon} size={14} />
                  )}
                  {isRunning ? 'Executing...' : 'Run'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
