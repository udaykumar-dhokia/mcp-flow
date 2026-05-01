'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CopyIcon, CheckmarkCircle01Icon, Download01Icon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const PACKAGE_JSON = `{
  "name": "mcp-flow-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "mcp-use dev",
    "build": "mcp-use build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "mcp-use": "latest",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}`;

export default function CodeExportModal({ isOpen, onClose, code }: CodeExportModalProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl overflow-hidden border-zinc-200 p-0 sm:w-[50vw] dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-sm font-semibold">Generated MCP Server</DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-500">
              Download or copy your server code
            </DialogDescription>
          </div>
        </DialogHeader>

        <Tabs defaultValue="server" className="flex flex-col">
          <TabsList className="mx-5 mt-3 grid w-auto grid-cols-2">
            <TabsTrigger value="server" className="text-xs">
              index.ts
            </TabsTrigger>
            <TabsTrigger value="package" className="text-xs">
              package.json
            </TabsTrigger>
          </TabsList>

          <TabsContent value="server" className="px-5 pb-5">
            <div className="mb-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px]"
                onClick={() => copyToClipboard(code)}
              >
                {copied ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={12}
                    className="text-emerald-500"
                  />
                ) : (
                  <HugeiconsIcon icon={CopyIcon} size={12} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px]"
                onClick={() => downloadFile(code, 'index.ts')}
              >
                <HugeiconsIcon icon={Download01Icon} size={12} />
                Download
              </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
              <pre className="font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {code}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="package" className="px-5 pb-5">
            <div className="mb-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px]"
                onClick={() => copyToClipboard(PACKAGE_JSON)}
              >
                <HugeiconsIcon icon={CopyIcon} size={12} />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px]"
                onClick={() => downloadFile(PACKAGE_JSON, 'package.json')}
              >
                <HugeiconsIcon icon={Download01Icon} size={12} />
                Download
              </Button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
              <pre className="font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {PACKAGE_JSON}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h4 className="mb-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
            Quick Start
          </h4>
          <ol className="list-decimal space-y-1 pl-4 text-[11px] text-zinc-500">
            <li>Download both files into a new directory</li>
            <li>
              Run <code className="font-mono text-zinc-700 dark:text-zinc-300">npm install</code>
            </li>
            <li>
              Run <code className="font-mono text-zinc-700 dark:text-zinc-300">npm run dev</code>
            </li>
            <li>Add the server URL to Claude, Cursor, or ChatGPT</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
