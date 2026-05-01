'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import {
  Globe02Icon,
  SquareLockPasswordIcon,
  GitBranchIcon,
  SmileDizzyIcon,
  Add01Icon,
  ChipIcon,
} from '@hugeicons/core-free-icons';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '@/lib/templates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// ... (imports remain the same above this)
interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
  onStartFresh: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATEGORY_ICONS: Record<string, any> = {
  Showcase: ChipIcon,
  'API Integration': Globe02Icon,
  Security: SquareLockPasswordIcon,
  Logic: GitBranchIcon,
  Fun: SmileDizzyIcon,
};

const CATEGORY_COLORS: Record<string, string> = {
  Showcase: 'bg-blue-600',
  'API Integration': 'bg-emerald-500',
  Security: 'bg-red-500',
  Logic: 'bg-orange-500',
  Fun: 'bg-pink-500',
};

export default function TemplatePicker({
  isOpen,
  onClose,
  onSelectTemplate,
  onStartFresh,
}: TemplatePickerProps) {
  const categories = [...new Set(WORKFLOW_TEMPLATES.map((t) => t.category))];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl overflow-hidden border-zinc-200 p-0 sm:w-[80vw] md:w-[60vw] dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <HugeiconsIcon icon={ChipIcon} size={16} />
          </div>
          <div className="flex flex-col gap-0.5 text-left">
            <DialogTitle className="text-sm font-semibold">Welcome to MCP-Flow</DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-500">
              Start from scratch or pick a template to get going fast.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          <button
            onClick={onStartFresh}
            className="group mb-6 flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-zinc-200 px-5 py-4 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-zinc-200 text-zinc-400 transition-colors group-hover:border-blue-400 group-hover:text-blue-500 dark:border-zinc-700">
              <HugeiconsIcon icon={Add01Icon} size={20} />
            </div>
            <div>
              <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Blank Canvas
              </span>
              <span className="text-xs text-zinc-500">
                Start with an empty workflow and build from scratch.
              </span>
            </div>
          </button>

          {categories.map((category) => {
            const templates = WORKFLOW_TEMPLATES.filter((t) => t.category === category);
            const icon = CATEGORY_ICONS[category] || Globe02Icon;
            const color = CATEGORY_COLORS[category] || 'bg-zinc-500';

            return (
              <div key={category} className="mb-5">
                <div className="mb-2 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  {category}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => onSelectTemplate(template)}
                      className="group flex items-start gap-3 rounded-xl border border-zinc-100 px-4 py-3.5 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${color} mt-0.5 text-white`}
                      >
                        <HugeiconsIcon icon={icon} size={14} />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                          {template.name}
                        </span>
                        <span className="block truncate text-[11px] leading-tight text-zinc-500">
                          {template.description}
                        </span>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800">
                            {template.nodes.length} nodes
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500 dark:bg-zinc-800">
                            {template.edges.length} connections
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-center text-[10px] text-zinc-400">
            You can always add, remove, and reconfigure nodes after selecting a template.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
