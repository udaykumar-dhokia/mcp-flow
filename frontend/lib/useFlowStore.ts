'use client';

import { create } from 'zustand';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
}

interface ExecutionNodeStatus {
  nodeId: string;
  status: 'idle' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
}

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  workflowName: string;

  executionState: 'idle' | 'running' | 'completed' | 'error';
  executionNodeStatuses: ExecutionNodeStatus[];
  executionResult: Record<string, unknown> | null;

  past: HistoryEntry[];
  future: HistoryEntry[];

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  deleteEdge: (edgeId: string) => void;
  deleteSelected: () => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  selectNode: (nodeId: string | null) => void;
  setWorkflowName: (name: string) => void;
  clearCanvas: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setExecutionState: (state: FlowState['executionState']) => void;
  setExecutionNodeStatuses: (statuses: ExecutionNodeStatus[]) => void;
  setExecutionResult: (result: Record<string, unknown> | null) => void;
  resetExecution: () => void;

  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

const STORAGE_KEY = 'mcp-flow-workspace';
const MAX_HISTORY = 50;

function pushHistory(state: FlowState): Partial<FlowState> {
  const entry: HistoryEntry = {
    nodes: JSON.parse(JSON.stringify(state.nodes)),
    edges: JSON.parse(JSON.stringify(state.edges)),
  };
  const past = [...state.past, entry].slice(-MAX_HISTORY);
  return { past, future: [] };
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: 'Untitled Workflow',

  executionState: 'idle',
  executionNodeStatuses: [],
  executionResult: null,

  past: [],
  future: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const state = get();
    set({
      ...pushHistory(state),
      edges: addEdge({ ...connection, type: 'customEdge', animated: false }, state.edges),
    });
    get().saveToLocalStorage();
  },

  addNode: (node) => {
    const state = get();
    set({
      ...pushHistory(state),
      nodes: [...state.nodes, node],
    });
    get().saveToLocalStorage();
  },

  deleteNode: (nodeId) => {
    const state = get();
    set({
      ...pushHistory(state),
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    });
    get().saveToLocalStorage();
  },

  deleteEdge: (edgeId) => {
    const state = get();
    set({
      ...pushHistory(state),
      edges: state.edges.filter((e) => e.id !== edgeId),
    });
    get().saveToLocalStorage();
  },

  deleteSelected: () => {
    const state = get();
    const selectedNodes = state.nodes.filter((n) => n.selected);
    const selectedEdges = state.edges.filter((e) => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    set({
      ...pushHistory(state),
      nodes: state.nodes.filter((n) => !n.selected),
      edges: state.edges.filter(
        (e) => !e.selected && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target),
      ),
      selectedNodeId: null,
    });
    get().saveToLocalStorage();
  },

  updateNodeData: (nodeId, data) => {
    const state = get();
    set({
      ...pushHistory(state),
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, data } : node)),
    });
    get().saveToLocalStorage();
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setWorkflowName: (name) => {
    set({ workflowName: name });
    get().saveToLocalStorage();
  },

  clearCanvas: () => {
    const state = get();
    set({
      ...pushHistory(state),
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
    get().saveToLocalStorage();
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const previous = state.past[state.past.length - 1];
    const futureEntry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      past: state.past.slice(0, -1),
      future: [...state.future, futureEntry],
    });
    get().saveToLocalStorage();
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const next = state.future[state.future.length - 1];
    const pastEntry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };

    set({
      nodes: next.nodes,
      edges: next.edges,
      past: [...state.past, pastEntry],
      future: state.future.slice(0, -1),
    });
    get().saveToLocalStorage();
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  setExecutionState: (executionState) => set({ executionState }),
  setExecutionNodeStatuses: (executionNodeStatuses) => set({ executionNodeStatuses }),
  setExecutionResult: (executionResult) => set({ executionResult }),
  resetExecution: () =>
    set({
      executionState: 'idle',
      executionNodeStatuses: [],
      executionResult: null,
    }),

  saveToLocalStorage: () => {
    const state = get();
    try {
      const data = {
        nodes: state.nodes,
        edges: state.edges,
        workflowName: state.workflowName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage might be full or unavailable
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.nodes && data.edges) {
        set({
          nodes: data.nodes,
          edges: data.edges,
          workflowName: data.workflowName || 'Untitled Workflow',
        });
      }
    } catch {
      // corrupted data, ignore
    }
  },
}));
