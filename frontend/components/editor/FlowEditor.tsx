'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Panel,
  Controls,
  Background,
  MiniMap,
  Connection,
  Node,
  Edge,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import InputNode from './nodes/InputNode';
import HttpNode from './nodes/HttpNode';
import OutputNode from './nodes/OutputNode';
import { ExecutionNodeResult, WorkflowExecutionResponse } from '@/types/workflow';
import TransformNode from './nodes/TransformNode';
import ConditionNode from './nodes/ConditionNode';
import SecretNode from './nodes/SecretNode';
import NoteNode from './nodes/NoteNode';

import CustomEdge from './edges/CustomEdge';
import ConfigPanel from './ConfigPanel';
import EditorHeader from './EditorHeader';
import WidgetPreview from './WidgetPreview';
import CodeExportModal from './CodeExportModal';
import RunWorkflowModal from './RunWorkflowModal';
import NodePalette from './NodePalette';
import TemplatePicker from './TemplatePicker';
import McpAssetsPanel from './McpAssetsPanel';
import OllamaChatPanel from './OllamaChatPanel';

import { useFlowStore } from '@/lib/useFlowStore';
import { WorkflowTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon } from '@hugeicons/core-free-icons';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:2815';

const nodeTypes = {
  inputNode: InputNode,
  httpNode: HttpNode,
  outputNode: OutputNode,
  transformNode: TransformNode,
  conditionNode: ConditionNode,
  secretNode: SecretNode,
  noteNode: NoteNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'customEdge',
};

function FlowEditorInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    selectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    addNode,
    updateNodeData,
    deleteSelected,
    executionState,
    executionResult,
    resources,
    prompts,
    setExecutionResult,
    setExecutionState,
    setExecutionNodeStatuses,
    resetExecution,
    loadWorkflows,
  } = useFlowStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showAssetsPanel, setShowAssetsPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  const isGraphValid = React.useMemo(() => {
    const inputNodes = nodes.filter((n) => n.type === 'inputNode');
    const outputNodes = nodes.filter((n) => n.type === 'outputNode');

    if (inputNodes.length === 0 || outputNodes.length === 0 || edges.length === 0) {
      return false;
    }

    const reachableFromInputs = new Set<string>();
    const queue = inputNodes.map((n) => n.id);
    queue.forEach((id) => reachableFromInputs.add(id));

    let head = 0;
    while (head < queue.length) {
      const currentId = queue[head++];
      const outgoingEdges = edges.filter((e) => e.source === currentId);
      for (const edge of outgoingEdges) {
        if (!reachableFromInputs.has(edge.target)) {
          reachableFromInputs.add(edge.target);
          queue.push(edge.target);
        }
      }
    }

    return outputNodes.some((n) => reachableFromInputs.has(n.id));
  }, [nodes, edges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  useEffect(() => {
    void loadWorkflows();
    const hasExisting = localStorage.getItem('mcp-flow-workspace');
    if (!hasExisting) {
      setTimeout(() => setShowTemplatePicker(true), 0);
    }
  }, [loadWorkflows]);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    useFlowStore.getState().setNodes(template.nodes);
    useFlowStore.getState().setEdges(template.edges);
    useFlowStore.getState().setWorkflowName(template.name);
    useFlowStore.getState().setResources([]);
    useFlowStore.getState().setPrompts([]);
    useFlowStore.getState().saveToLocalStorage();
    setShowTemplatePicker(false);
  };

  const handleStartFresh = () => {
    useFlowStore.getState().saveToLocalStorage();
    setShowTemplatePicker(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useFlowStore.getState().redo();
        } else {
          useFlowStore.getState().undo();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        useFlowStore.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData('application/reactflow');
      if (!raw) return;

      try {
        const { type, data } = JSON.parse(raw);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type,
          position,
          data,
        };

        addNode(newNode);
      } catch {
        // invalid drag data
      }
    },
    [screenToFlowPosition, addNode],
  );

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) return false;

      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;
      if (targetNode.type === 'inputNode') return false;
      if (targetNode.type === 'secretNode') return false;
      if (sourceNode.type === 'outputNode') return false;

      const existingConnection = edges.find(
        (e) => e.target === connection.target && e.targetHandle === connection.targetHandle,
      );
      if (existingConnection) return false;

      return true;
    },
    [nodes, edges],
  );

  const onExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/workflow/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: { nodes, edges }, resources, prompts }),
      });
      const data = await response.json();
      setGeneratedCode(data.code);
      setIsExportModalOpen(true);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const onExecuteClick = () => {
    if (!isGraphValid) return;
    setIsRunModalOpen(true);
  };

  const onRunWorkflow = async (values: Record<string, unknown>) => {
    setExecutionState('running');
    resetExecution();

    const nodeOrder = nodes.map((n) => ({
      nodeId: n.id,
      status: 'idle' as const,
    }));
    setExecutionNodeStatuses(nodeOrder);

    try {
      const response = await fetch(`${API_BASE}/workflow/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: { nodes, edges }, input: values }),
      });
      const data: WorkflowExecutionResponse = await response.json();
      setExecutionResult(data as Record<string, unknown>);
      setExecutionState('completed');

      const executionResults = data._execution?.nodes || [];
      const resultMap = new Map<string, ExecutionNodeResult>(
        executionResults.map((r) => [r.nodeId, r]),
      );

      setExecutionNodeStatuses(
        nodeOrder.map((n) => {
          const result = resultMap.get(n.nodeId);
          if (result) {
            return {
              nodeId: n.nodeId,
              status: result.status as 'success' | 'error',
              duration: result.duration,
              error: result.error,
            };
          }
          return n;
        }),
      );
    } catch {
      setExecutionResult({ error: 'Execution failed' });
      setExecutionState('error');
    } finally {
      setIsRunModalOpen(false);
    }
  };

  const onUpdateNode = (id: string, data: Record<string, unknown>) => {
    updateNodeData(id, data);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <EditorHeader
        onExport={onExport}
        onShowTemplates={() => setShowTemplatePicker(true)}
        onShowAssets={() => setShowAssetsPanel(true)}
        onShowChat={() => setShowChatPanel(true)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <NodePalette
          isCollapsed={isPaletteCollapsed}
          onToggle={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
        />

        <div ref={reactFlowWrapper} className="relative flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            isValidConnection={isValidConnection}
            fitView
            deleteKeyCode={null}
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-50 dark:bg-zinc-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--color-zinc-300, #d4d4d8)"
              className="dark:opacity-30"
            />
            <Controls
              showInteractive={false}
              className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 [&>button]:border-zinc-200 [&>button]:bg-white [&>button]:text-zinc-600 [&>button]:hover:bg-zinc-50 dark:[&>button]:border-zinc-800 dark:[&>button]:bg-zinc-950 dark:[&>button]:text-zinc-400"
            />
            <MiniMap
              nodeStrokeWidth={3}
              pannable
              zoomable
              className="rounded-lg border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80"
              maskColor="rgba(0, 0, 0, 0.05)"
            />

            <Panel position="bottom-center" className="mb-6">
              <Button
                size="lg"
                onClick={onExecuteClick}
                className="border-primary bg-primary hover:bg-primary/80 h-10 gap-2 rounded-xl border px-6 text-white"
                disabled={executionState === 'running' || !isGraphValid}
              >
                {executionState === 'running' ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <HugeiconsIcon icon={PlayIcon} />
                )}
                <span className="text-xs font-bold">
                  {executionState === 'running' ? 'Executing...' : 'Execute'}
                </span>
              </Button>
            </Panel>
          </ReactFlow>
        </div>

        <Dialog
          open={!!selectedNode}
          onOpenChange={(open) => !open && selectNode(null)}
          modal={false}
        >
          <DialogContent
            className="fixed top-14 right-0 left-auto h-[calc(100vh-3.5rem)] w-full max-w-md translate-x-0 translate-y-0 overflow-hidden rounded-none border-l border-zinc-200 p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
            hideOverlay
            showCloseButton={false}
          >
            <ConfigPanel selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!executionResult || executionState === 'running'}
          onOpenChange={(open) => {
            if (!open) {
              setExecutionResult(null);
              resetExecution();
            }
          }}
          modal={false}
        >
          <DialogContent
            className="fixed top-14 right-0 left-auto flex h-[calc(100vh-3.5rem)] w-[450px] max-w-lg translate-x-0 translate-y-0 flex-col rounded-none border-l border-zinc-200 bg-white p-0 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
            hideOverlay
            showCloseButton={false}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold">Execution Results</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-zinc-400 hover:text-zinc-600"
                onClick={() => {
                  setExecutionResult(null);
                  resetExecution();
                }}
              >
                <span className="text-sm">x</span>
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <WidgetPreview
                result={executionResult}
                isRunning={executionState === 'running'}
                onRun={() => setIsRunModalOpen(true)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <CodeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        code={generatedCode}
      />

      <RunWorkflowModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        nodes={nodes}
        onRun={(values) => onRunWorkflow(values as Record<string, unknown>)}
        isRunning={executionState === 'running'}
      />

      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleSelectTemplate}
        onStartFresh={handleStartFresh}
      />

      <McpAssetsPanel isOpen={showAssetsPanel} onClose={() => setShowAssetsPanel(false)} />

      <OllamaChatPanel isOpen={showChatPanel} onClose={() => setShowChatPanel(false)} />
    </div>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorInner />
    </ReactFlowProvider>
  );
}
