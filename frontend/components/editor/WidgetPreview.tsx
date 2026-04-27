'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, TerminalIcon, Layout01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WidgetPreviewProps {
  result: Record<string, unknown> | null;
  isRunning: boolean;
  onRun: () => void;
}

function WidgetCard({ data }: { data: Record<string, unknown> }) {
  const widgetMeta = data?.widget as Record<string, unknown> | undefined;
  const payload = data?.data || data;

  if (!widgetMeta) {
    return <JsonView data={payload} />;
  }

  const fields =
    typeof payload === 'object' && payload !== null
      ? Object.entries(payload).filter(([k]) => k !== '_execution')
      : [];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <HugeiconsIcon icon={Layout01Icon} size={16} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {(widgetMeta.title as string) || 'Widget Result'}
            </h4>
            {(widgetMeta.description as string) && (
              <p className="text-[10px] text-zinc-500">{widgetMeta.description as string}</p>
            )}
          </div>
        </div>

        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
              >
                <span className="text-[11px] font-medium text-zinc-500">{key}</span>
                <span className="max-w-[65%] text-right text-[11px] font-medium wrap-break-word break-all text-zinc-900 dark:text-zinc-200">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value ?? 'null')}
                </span>
              </div>
            ))}
          </div>
        )}

        {(widgetMeta.timestamp as string | number) && (
          <div className="mt-3 border-t border-zinc-100 pt-2 text-[9px] text-zinc-400 dark:border-zinc-800">
            Generated at {new Date(widgetMeta.timestamp as string | number).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

function JsonView({ data }: { data: unknown }) {
  const cleaned =
    data && typeof data === 'object' && '_execution' in data
      ? Object.fromEntries(Object.entries(data).filter(([k]) => k !== '_execution'))
      : data;

  return (
    <pre className="rounded-md bg-zinc-50 p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
      {JSON.stringify(cleaned, null, 2)}
    </pre>
  );
}

function ExecutionTimeline({ execution }: { execution: Record<string, unknown> | undefined }) {
  if (!execution?.nodes || !Array.isArray(execution.nodes) || execution.nodes.length === 0)
    return null;

  return (
    <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <span className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
        Execution Timeline
      </span>
      {(execution.nodes as Record<string, unknown>[]).map(
        (n: Record<string, unknown>, i: number) => (
          <div key={i} className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
              <div
                className={`size-1.5 rounded-full ${
                  n.status === 'success'
                    ? 'bg-emerald-500'
                    : n.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-zinc-300'
                }`}
              />
              <span className="text-zinc-500">{n.type as string}</span>
            </div>
            <span className="font-mono text-zinc-400">
              {n.duration !== undefined ? `${n.duration}ms` : '-'}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

export default function WidgetPreview({ result, isRunning, onRun }: WidgetPreviewProps) {
  const hasWidget = result?.widget !== undefined;
  const execution = result?._execution;

  return (
    <div className="flex flex-col p-4 dark:text-zinc-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={TerminalIcon} size={14} className="text-zinc-400" />
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Output
          </span>
          {hasWidget && (
            <Badge variant="outline" className="text-[8px] text-purple-500">
              Widget
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <Badge variant={result.error ? 'destructive' : 'outline'} className="text-[9px]">
              {result.error ? 'Error' : 'Success'}
            </Badge>
          )}
          <Button
            onClick={onRun}
            disabled={isRunning}
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-[10px]"
          >
            <HugeiconsIcon icon={PlayIcon} size={12} />
            Re-run
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[300px]">
        {result ? (
          <>
            {hasWidget ? <WidgetCard data={result} /> : <JsonView data={result} />}
            <ExecutionTimeline execution={execution as Record<string, unknown> | undefined} />
          </>
        ) : (
          <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-zinc-200 text-xs text-zinc-400 dark:border-zinc-800">
            No output yet. Run the tool to see results.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
