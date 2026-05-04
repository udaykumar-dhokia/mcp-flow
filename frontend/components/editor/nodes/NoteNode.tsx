'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GraphNodeData } from '../../../types/workflow';
import { useFlowStore } from '@/lib/useFlowStore';

const NoteNode = ({ data, id, selected }: NodeProps) => {
  const d = data as GraphNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const startEditing = () => {
    setText(d.noteText || '');
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeData(id, { ...d, noteText: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      updateNodeData(id, { ...d, noteText: text });
    }
    e.stopPropagation();
  };

  return (
    <div className="group relative">
      <div
        className={`relative max-w-[320px] min-w-[200px] overflow-hidden rounded-lg border bg-amber-50 shadow-sm transition-all duration-300 dark:bg-amber-950/40 ${
          selected
            ? 'border-amber-500 ring-2 ring-amber-500/40'
            : 'border-amber-200 dark:border-amber-800/60'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-amber-200/60 px-3 py-1.5 dark:border-amber-800/40">
          <div className="flex size-5 items-center justify-center rounded bg-white text-amber-600 inset-shadow-sm inset-shadow-amber-500/60 dark:bg-amber-900/60 dark:text-amber-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">Note</span>
        </div>

        <div className="min-h-[60px] p-3" onDoubleClick={startEditing}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="nowheel nodrag nopan w-full resize-none bg-transparent text-xs leading-relaxed text-amber-900 placeholder-amber-400 outline-none dark:text-amber-100"
              placeholder="Write your notes here... (Markdown supported)"
              rows={Math.max(3, text.split('\n').length)}
            />
          ) : (
            <div className="prose prose-xs max-w-none cursor-text text-xs leading-relaxed text-amber-900 dark:text-amber-100 [&_a]:text-amber-600 [&_a]:underline [&_code]:rounded [&_code]:bg-amber-100 [&_code]:px-1 [&_code]:text-[10px] dark:[&_code]:bg-amber-900/60 [&_h1]:mt-0 [&_h1]:mb-1 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:mt-0 [&_h2]:mb-1 [&_h2]:text-xs [&_h2]:font-bold [&_h3]:mt-0 [&_h3]:mb-0.5 [&_h3]:text-xs [&_h3]:font-semibold [&_li]:my-0 [&_ol]:my-0.5 [&_ol]:pl-4 [&_p]:my-0.5 [&_pre]:my-1 [&_pre]:rounded [&_pre]:bg-amber-100 [&_pre]:p-2 [&_pre]:text-[10px] dark:[&_pre]:bg-amber-900/60 [&_ul]:my-0.5 [&_ul]:pl-4">
              {d.noteText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.noteText}</ReactMarkdown>
              ) : (
                <span className="text-amber-400 italic">Double-click to edit...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(NoteNode);
