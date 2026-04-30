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
import { McpPrompt, McpResource, SavedWorkflow } from '@/types/workflow';

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
  workflows: SavedWorkflow[];
  currentWorkflowId: string | null;
  selectedNodeId: string | null;
  workflowName: string;
  resources: McpResource[];
  prompts: McpPrompt[];
  isSaving: boolean;
  persistenceError: string | null;

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
  setResources: (resources: McpResource[]) => void;
  setPrompts: (prompts: McpPrompt[]) => void;
  clearCanvas: () => void;
  createWorkflow: (name?: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  loadWorkflows: () => Promise<void>;
  switchWorkflow: (id: string) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;

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
const API_BASE = 'http://localhost:3001';

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
  workflows: [],
  currentWorkflowId: null,
  selectedNodeId: null,
  workflowName: 'Untitled Workflow',
  resources: [],
  prompts: [],
  isSaving: false,
  persistenceError: null,

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
    const state = get();
    set({
      workflowName: name,
      workflows: state.workflows.map((workflow) =>
        workflow.id === state.currentWorkflowId ? { ...workflow, name } : workflow,
      ),
    });
    get().saveToLocalStorage();
  },

  setResources: (resources) => {
    set({ resources });
    get().saveToLocalStorage();
  },

  setPrompts: (prompts) => {
    set({ prompts });
    get().saveToLocalStorage();
  },

  clearCanvas: () => {
    const state = get();
    set({
      ...pushHistory(state),
      nodes: [],
      edges: [],
      resources: [],
      prompts: [],
      selectedNodeId: null,
    });
    get().saveToLocalStorage();
  },

  createWorkflow: async (name = 'Untitled Workflow') => {
    const state = get();
    const emptyGraph = { nodes: [], edges: [] };
    set({ isSaving: true, persistenceError: null });
    try {
      const response = await fetch(`${API_BASE}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          graph: emptyGraph,
          resources: [],
          prompts: [],
        }),
      });
      if (!response.ok) throw new Error('Could not create workflow');
      const workflow: SavedWorkflow = await response.json();
      set({
        workflows: [...state.workflows, workflow],
        currentWorkflowId: workflow.id,
        workflowName: workflow.name,
        nodes: workflow.graph.nodes as Node[],
        edges: workflow.graph.edges as Edge[],
        resources: workflow.resources,
        prompts: workflow.prompts,
        selectedNodeId: null,
        past: [],
        future: [],
      });
      get().saveToLocalStorage();
    } catch (error) {
      const id = `local-${Date.now()}`;
      const workflow: SavedWorkflow = {
        id,
        name,
        graph: emptyGraph,
        resources: [],
        prompts: [],
      };
      set({
        workflows: [...state.workflows, workflow],
        currentWorkflowId: id,
        workflowName: name,
        nodes: [],
        edges: [],
        resources: [],
        prompts: [],
        persistenceError: error instanceof Error ? error.message : 'Could not create workflow',
      });
      get().saveToLocalStorage();
    } finally {
      set({ isSaving: false });
    }
  },

  saveWorkflow: async () => {
    const state = get();
    const payload = {
      name: state.workflowName,
      graph: { nodes: state.nodes, edges: state.edges },
      resources: state.resources,
      prompts: state.prompts,
    };

    if (!state.currentWorkflowId || state.currentWorkflowId.startsWith('local-')) {
      set({ isSaving: true, persistenceError: null });
      try {
        const response = await fetch(`${API_BASE}/workflow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Could not save workflow');
        const workflow: SavedWorkflow = await response.json();
        set({
          workflows: [
            ...state.workflows.filter((item) => item.id !== state.currentWorkflowId),
            workflow,
          ],
          currentWorkflowId: workflow.id,
        });
        get().saveToLocalStorage();
      } catch (error) {
        set({
          workflows: state.workflows.map((item) =>
            item.id === state.currentWorkflowId ? { ...item, ...payload } : item,
          ),
          persistenceError: error instanceof Error ? error.message : 'Could not save workflow',
        });
      } finally {
        set({ isSaving: false });
      }
      return;
    }

    set({ isSaving: true, persistenceError: null });
    try {
      const response = await fetch(`${API_BASE}/workflow/${state.currentWorkflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Could not save workflow');
      const workflow: SavedWorkflow = await response.json();
      set({
        workflows: state.workflows.map((item) => (item.id === workflow.id ? workflow : item)),
      });
      get().saveToLocalStorage();
    } catch (error) {
      set({
        workflows: state.workflows.map((item) =>
          item.id === state.currentWorkflowId ? { ...item, ...payload } : item,
        ),
        persistenceError: error instanceof Error ? error.message : 'Could not save workflow',
      });
      get().saveToLocalStorage();
    } finally {
      set({ isSaving: false });
    }
  },

  loadWorkflows: async () => {
    get().loadFromLocalStorage();
    try {
      const response = await fetch(`${API_BASE}/workflow`);
      if (!response.ok) throw new Error('Could not load workflows');
      const workflows: SavedWorkflow[] = await response.json();
      if (workflows.length === 0) {
        await get().createWorkflow('Untitled Workflow');
        return;
      }
      const currentId = get().currentWorkflowId;
      const selected = workflows.find((workflow) => workflow.id === currentId) || workflows[0];
      set({
        workflows,
        currentWorkflowId: selected.id,
        workflowName: selected.name,
        nodes: selected.graph.nodes as Node[],
        edges: selected.graph.edges as Edge[],
        resources: selected.resources || [],
        prompts: selected.prompts || [],
        persistenceError: null,
        past: [],
        future: [],
      });
      get().saveToLocalStorage();
    } catch (error) {
      const state = get();
      const localWorkflow: SavedWorkflow = {
        id: state.currentWorkflowId || 'local-default',
        name: state.workflowName,
        graph: { nodes: state.nodes, edges: state.edges },
        resources: state.resources,
        prompts: state.prompts,
      };
      set({
        workflows: state.workflows.length > 0 ? state.workflows : [localWorkflow],
        currentWorkflowId: state.currentWorkflowId || localWorkflow.id,
        persistenceError: error instanceof Error ? error.message : 'Backend unavailable',
      });
    }
  },

  switchWorkflow: async (id) => {
    await get().saveWorkflow();
    const workflow = get().workflows.find((item) => item.id === id);
    if (!workflow) return;
    set({
      currentWorkflowId: workflow.id,
      workflowName: workflow.name,
      nodes: workflow.graph.nodes as Node[],
      edges: workflow.graph.edges as Edge[],
      resources: workflow.resources || [],
      prompts: workflow.prompts || [],
      selectedNodeId: null,
      past: [],
      future: [],
    });
    get().saveToLocalStorage();
  },

  deleteWorkflow: async (id) => {
    const state = get();
    const nextWorkflows = state.workflows.filter((workflow) => workflow.id !== id);
    if (!id.startsWith('local-')) {
      try {
        await fetch(`${API_BASE}/workflow/${id}`, { method: 'DELETE' });
      } catch {
        set({ persistenceError: 'Could not delete workflow from the backend' });
      }
    }

    set({ workflows: nextWorkflows });
    if (state.currentWorkflowId === id) {
      const next = nextWorkflows[0];
      if (next) {
        set({
          currentWorkflowId: next.id,
          workflowName: next.name,
          nodes: next.graph.nodes as Node[],
          edges: next.graph.edges as Edge[],
          resources: next.resources || [],
          prompts: next.prompts || [],
        });
      } else {
        await get().createWorkflow('Untitled Workflow');
      }
    }
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
        workflows: state.workflows,
        currentWorkflowId: state.currentWorkflowId,
        resources: state.resources,
        prompts: state.prompts,
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
          workflows: data.workflows || [],
          currentWorkflowId: data.currentWorkflowId || null,
          resources: data.resources || [],
          prompts: data.prompts || [],
        });
      }
    } catch {
      // corrupted data, ignore
    }
  },
}));
