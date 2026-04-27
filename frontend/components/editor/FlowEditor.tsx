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
import TransformNode from './nodes/TransformNode';
import ConditionNode from './nodes/ConditionNode';
import SecretNode from './nodes/SecretNode';

import CustomEdge from './edges/CustomEdge';
import ConfigPanel from './ConfigPanel';
import EditorHeader from './EditorHeader';
import WidgetPreview from './WidgetPreview';
import CodeExportModal from './CodeExportModal';
import RunWorkflowModal from './RunWorkflowModal';
import NodePalette from './NodePalette';
import TemplatePicker from './TemplatePicker';

import { useFlowStore } from '@/lib/useFlowStore';
import { WorkflowTemplate } from '@/lib/templates';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlayIcon, ZapIcon } from '@hugeicons/core-free-icons';

const nodeTypes = {
  inputNode: InputNode,
  httpNode: HttpNode,
  outputNode: OutputNode,
  transformNode: TransformNode,
  conditionNode: ConditionNode,
  secretNode: SecretNode,
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
    setExecutionResult,
    setExecutionState,
    setExecutionNodeStatuses,
    resetExecution,
    loadFromLocalStorage,
  } = useFlowStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  useEffect(() => {
    loadFromLocalStorage();
    const hasExisting = localStorage.getItem('mcp-flow-workspace');
    if (!hasExisting) {
      setTimeout(() => setShowTemplatePicker(true), 0);
    }
  }, [loadFromLocalStorage]);

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    useFlowStore.getState().setNodes(template.nodes);
    useFlowStore.getState().setEdges(template.edges);
    useFlowStore.getState().setWorkflowName(template.name);
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
      const response = await fetch('http://localhost:3001/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: { nodes, edges } }),
      });
      const data = await response.json();
      setGeneratedCode(data.code);
      setIsExportModalOpen(true);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const onExecuteClick = () => {
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
      const response = await fetch('http://localhost:3001/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: { nodes, edges }, input: values }),
      });
      const data = await response.json();
      setExecutionResult(data);
      setExecutionState('completed');

      setExecutionNodeStatuses(
        nodeOrder.map((n) => ({
          ...n,
          status: data.error ? 'error' : ('success' as const),
        })),
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
      <EditorHeader onExport={onExport} onShowTemplates={() => setShowTemplatePicker(true)} />

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
                className="h-11 gap-2 rounded-full border border-blue-700 bg-blue-600 px-6 text-white hover:bg-blue-700"
                disabled={executionState === 'running' || nodes.length === 0}
              >
                {executionState === 'running' ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <HugeiconsIcon icon={ZapIcon} size={16} />
                )}
                <span className="text-xs font-bold tracking-widest uppercase">
                  {executionState === 'running' ? 'Executing...' : 'Execute Workflow'}
                </span>
              </Button>
            </Panel>
          </ReactFlow>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-0 right-0 z-10 h-full w-[380px] border-l border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <ConfigPanel selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(executionResult || executionState === 'running') && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-0 right-0 z-20 flex h-full w-[450px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={PlayIcon} size={14} className="text-blue-500" />
                  <h3 className="text-xs font-bold tracking-wider uppercase">Execution Results</h3>
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
            </motion.div>
          )}
        </AnimatePresence>
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
        onSelectTemplate={handleSelectTemplate}
        onStartFresh={handleStartFresh}
      />
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
