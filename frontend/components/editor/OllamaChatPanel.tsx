'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Message01Icon, SentIcon, Settings02Icon } from '@hugeicons/core-free-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFlowStore } from '@/lib/useFlowStore';
import { ChatMessage } from '@/types/workflow';

interface OllamaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = 'http://localhost:3001';

export default function OllamaChatPanel({ isOpen, onClose }: OllamaChatPanelProps) {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const resources = useFlowStore((s) => s.resources);
  const prompts = useFlowStore((s) => s.prompts);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('llama3.1');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolLog, setToolLog] = useState<Record<string, unknown>[]>([]);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE}/workflow/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graph: { nodes, edges },
          resources,
          prompts,
          messages: nextMessages,
          model,
          ollamaUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Ollama chat failed');
      }

      const content = data.message?.content || 'The model returned an empty response.';
      setMessages([...nextMessages, { role: 'assistant', content }]);
      setToolLog(data.toolCalls || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete chat request');
      setMessages(nextMessages);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogContent
        className="fixed top-14 right-0 left-auto flex h-[calc(100vh-3.5rem)] w-[460px] max-w-[calc(100vw-1rem)] translate-x-0 translate-y-0 flex-col rounded-none border-l border-zinc-200 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
        hideOverlay
        showCloseButton={false}
      >
        <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Message01Icon} size={16} className="text-zinc-500" />
              <h2 className="text-sm font-semibold">Ollama Inspector</h2>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              x
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <div>
              <Label className="mb-1 block text-[10px] text-zinc-500">Model</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-[10px] text-zinc-500">Ollama URL</Label>
              <Input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <HugeiconsIcon icon={Settings02Icon} size={22} className="mb-3 text-zinc-400" />
              <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
                Ask the model to use your workflow tools. Tool calls run through the current canvas
                and return results back into the chat.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-8 border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
                      : 'mr-8 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200'
                  }`}
                >
                  <div className="mb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    {message.role}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              {toolLog.length > 0 && (
                <details className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                  <summary className="cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Tool calls ({toolLog.length})
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-zinc-50 p-2 text-[10px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    {JSON.stringify(toolLog, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            rows={3}
            placeholder="Ask Ollama to test this MCP..."
            className="text-xs"
          />
          <div className="mt-2 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => void sendMessage()}
              disabled={isSending || !input.trim()}
            >
              {isSending ? (
                <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <HugeiconsIcon icon={SentIcon} size={13} />
              )}
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
