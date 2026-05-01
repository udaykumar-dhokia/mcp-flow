'use client';

import { useEffect, useState, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Message01Icon,
  SentIcon,
  Settings02Icon,
  Refresh01Icon,
  X,
} from '@hugeicons/core-free-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFlowStore } from '@/lib/useFlowStore';
import { ChatMessage } from '@/types/workflow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OllamaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:2815';

export default function OllamaChatPanel({ isOpen, onClose }: OllamaChatPanelProps) {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const resources = useFlowStore((s) => s.resources);
  const prompts = useFlowStore((s) => s.prompts);
  const chatConfig = useFlowStore((s) => s.chatConfig);
  const setChatConfig = useFlowStore((s) => s.setChatConfig);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState(chatConfig?.model || 'llama3.1');
  const [ollamaUrl, setOllamaUrl] = useState(chatConfig?.baseUrl || 'http://localhost:11434');
  const [provider, setProvider] = useState(chatConfig?.provider || 'ollama');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toolLog, setToolLog] = useState<Record<string, unknown>[]>([]);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [prevChatConfig, setPrevChatConfig] = useState(chatConfig);
  if (chatConfig !== prevChatConfig) {
    setPrevChatConfig(chatConfig);
    if (chatConfig) {
      setModel(chatConfig.model);
      setOllamaUrl(chatConfig.baseUrl);
      setProvider(chatConfig.provider);
    }
  }

  const fetchModels = useCallback(
    async (url: string) => {
      if (!url) return;
      setIsLoadingModels(true);
      try {
        const baseUrl = url.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) throw new Error('Could not fetch models');
        const data = await response.json();
        const modelNames = data.models?.map((m: { name: string }) => m.name) || [];
        setAvailableModels(modelNames);
        if (modelNames.length > 0 && !modelNames.includes(model)) {
          setModel(modelNames[0]);
        }
      } catch (err) {
        console.error('Failed to fetch Ollama models:', err);
        setAvailableModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    },
    [model],
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        void fetchModels(ollamaUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, ollamaUrl, fetchModels]);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: input.trim() }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);
    setToolLog([]);

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

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Ollama chat failed');
      }

      setMessages([...nextMessages, { role: 'assistant', content: '' }]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream returned');

      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'error') {
                throw new Error(parsed.error);
              } else if (parsed.type === 'content') {
                assistantContent += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantContent;
                  return updated;
                });
              } else if (parsed.type === 'tool_calls') {
                setToolLog(parsed.toolCalls);
              }
            } catch (err) {
              console.error('Failed to parse chunk', err);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete chat request');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} modal={false}>
      <DialogContent
        className="fixed top-14 right-0 left-auto flex h-[calc(100vh-3.5rem)] w-[460px] max-w-[calc(100vw-1rem)] translate-x-0 translate-y-0 flex-col rounded-none border-l border-zinc-200 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
        hideOverlay
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Message01Icon} size={16} className="text-zinc-500" />
              <h2 className="text-sm font-semibold">Chat</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettings(!showSettings)}
                className={showSettings ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
              >
                <HugeiconsIcon icon={Settings02Icon} size={14} className="text-zinc-500" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <HugeiconsIcon icon={X} size={14} className="text-zinc-500" />
              </Button>
            </div>
          </div>
        </div>

        {showSettings ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium">Provider</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="block text-xs font-medium">Ollama URL</Label>
                  <button
                    onClick={() => void fetchModels(ollamaUrl)}
                    className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
                    disabled={isLoadingModels}
                  >
                    <HugeiconsIcon
                      icon={Refresh01Icon}
                      size={10}
                      className={isLoadingModels ? 'animate-spin' : ''}
                    />
                  </button>
                </div>
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="h-9 font-mono text-xs"
                  placeholder="http://localhost:11434"
                />
              </div>

              <div className="pt-2">
                <Button
                  className="w-full text-xs"
                  onClick={() => {
                    setChatConfig({ provider, baseUrl: ollamaUrl, model });
                    setShowSettings(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <HugeiconsIcon icon={Message01Icon} size={22} className="mb-3 text-zinc-400" />
                  <p className="max-w-xs text-xs leading-relaxed text-zinc-500">
                    Ask the model to use your workflow tools. Tool calls run through the current
                    canvas and return results back into the chat.
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
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            code: ({ className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !match && !className?.includes('language') ? (
                                <code
                                  className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800"
                                  {...props}
                                >
                                  {children}
                                </code>
                              ) : (
                                <pre className="my-2 overflow-x-auto rounded-md bg-zinc-100 p-2 font-mono text-xs dark:bg-zinc-800">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                            ul: ({ ...props }) => <ul className="mb-2 list-disc pl-4" {...props} />,
                            ol: ({ ...props }) => (
                              <ol className="mb-2 list-decimal pl-4" {...props} />
                            ),
                            a: ({ ...props }) => (
                              <a
                                className="text-blue-500 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
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
                placeholder="Ask model to test this MCP..."
                className="text-xs"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Select
                      value={model}
                      onValueChange={(val) => {
                        setModel(val);
                        setChatConfig({ provider, baseUrl: ollamaUrl, model: val });
                      }}
                      disabled={isLoadingModels}
                    >
                      <SelectTrigger className="h-8 px-2 text-[10px]">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.length > 0 ? (
                          availableModels.map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="llama3.1" className="text-xs" disabled>
                            {isLoadingModels ? 'Loading...' : 'No models'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessages([])}
                    disabled={messages.length === 0}
                    className="h-8 text-[10px]"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => void sendMessage()}
                  disabled={isSending || !input.trim()}
                  className="h-8 gap-1.5 px-4"
                >
                  {isSending ? (
                    <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <HugeiconsIcon icon={SentIcon} size={13} />
                  )}
                  <span className="text-xs">Send</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
