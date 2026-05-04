'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Message01Icon,
  Settings02Icon,
  Refresh01Icon,
  X,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { motion, AnimatePresence } from 'framer-motion';

interface OllamaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:2815';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function ToolCallBadge({ toolCalls }: { toolCalls: Record<string, unknown>[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l-4.6 4.6a1 1 0 0 1-1.4 0L2 5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''} used
        <svg
          width="8"
          height="8"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {toolCalls.map((call, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {String(call.name || 'unknown')}
                    </span>
                  </div>
                  {!!call.arguments && (
                    <pre className="mt-1 overflow-auto rounded bg-white/60 px-2 py-1 font-mono text-[9px] leading-relaxed text-zinc-500 dark:bg-zinc-900/60">
                      {JSON.stringify(call.arguments, null, 2)}
                    </pre>
                  )}
                  {!!call.result && (
                    <pre className="mt-1 overflow-auto rounded bg-emerald-50/50 px-2 py-1 font-mono text-[9px] leading-relaxed text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                      {typeof call.result === 'string'
                        ? call.result
                        : JSON.stringify(call.result, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !match && !className?.includes('language') ? (
            <code
              className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800"
              {...props}
            >
              {children}
            </code>
          ) : (
            <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 font-mono text-[11px] dark:bg-zinc-800">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        },
        ul: ({ ...props }) => <ul className="mb-2 list-disc pl-4" {...props} />,
        ol: ({ ...props }) => <ol className="mb-2 list-decimal pl-4" {...props} />,
        a: ({ ...props }) => (
          <a
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
        h1: ({ ...props }) => (
          <h1 className="mt-3 mb-2 text-base font-bold first:mt-0" {...props} />
        ),
        h2: ({ ...props }) => (
          <h2 className="mt-2.5 mb-1.5 text-sm font-bold first:mt-0" {...props} />
        ),
        h3: ({ ...props }) => <h3 className="mt-2 mb-1 text-xs font-bold first:mt-0" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prevChatConfig, setPrevChatConfig] = useState(chatConfig);
  if (chatConfig !== prevChatConfig) {
    setPrevChatConfig(chatConfig);
    if (chatConfig) {
      setModel(chatConfig.model);
      setOllamaUrl(chatConfig.baseUrl);
      setProvider(chatConfig.provider);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

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
        throw new Error(data.message || data.error || 'Chat request failed');
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
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  };
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

  const inputTools = nodes
    .filter((n) => n.type === 'inputNode')
    .map((n) => String(n.data.name || 'unnamed'));

  return (
    <Dialog open={isOpen} modal={false}>
      <DialogContent
        className="fixed top-14 right-0 left-auto flex h-[calc(100vh-3.5rem)] w-[460px] max-w-[calc(100vw-1rem)] translate-x-0 translate-y-0 flex-col rounded-none border-l border-zinc-200 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
        hideOverlay
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Message01Icon} size={16} className="text-zinc-500" />
            <h2 className="text-xs font-bold">Inspector</h2>
            {model && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800">
                {model.split(':')[0]}
              </span>
            )}
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <HugeiconsIcon icon={Message01Icon} size={18} className="text-zinc-400" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Test your MCP tools
                  </p>
                  <p className="mb-4 max-w-xs text-[11px] leading-relaxed text-zinc-400">
                    Ask the model to use your workflow tools. Tool calls run through the current
                    canvas.
                  </p>
                  {inputTools.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {inputTools.map((tool) => (
                        <button
                          key={tool}
                          onClick={() => setInput(`Use the ${tool} tool`)}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          Try &ldquo;{tool}&rdquo;
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`${message.role === 'user' ? 'flex justify-end' : ''}`}
                      >
                        {message.role === 'user' ? (
                          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-white dark:bg-zinc-100 dark:text-zinc-900">
                            {message.content}
                          </div>
                        ) : (
                          <div className="py-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
                            {index === messages.length - 1 && toolLog.length > 0 && (
                              <ToolCallBadge toolCalls={toolLog} />
                            )}
                            {message.content ? (
                              <AssistantMessage content={message.content} />
                            ) : isSending && index === messages.length - 1 ? (
                              <TypingIndicator />
                            ) : null}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {error && (
              <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Message..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pr-10 pl-3.5 text-xs leading-relaxed text-zinc-800 placeholder-zinc-400 transition-colors outline-none focus:border-zinc-300 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:bg-zinc-900"
                  style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={isSending || !input.trim()}
                  className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {isSending ? (
                    <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="rotate-180" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select
                    value={model}
                    onValueChange={(val) => {
                      setModel(val);
                      setChatConfig({ provider, baseUrl: ollamaUrl, model: val });
                    }}
                    disabled={isLoadingModels}
                  >
                    <SelectTrigger className="h-6 w-28 border-0 bg-transparent px-1 text-[10px] text-zinc-400 shadow-none">
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
                <button
                  onClick={() => {
                    setMessages([]);
                    setToolLog([]);
                  }}
                  disabled={messages.length === 0}
                  className="text-[10px] text-zinc-400 transition-colors hover:text-zinc-600 disabled:opacity-30 dark:hover:text-zinc-300"
                >
                  Clear chat
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
