import { CSSProperties } from 'react';

// Position interface for node positioning
export interface Position {
  x: number;
  y: number;
}

// Node interface representing a task or step in the workflow
export interface WorkflowNode {
  id: string;
  type: 'task' | 'decision' | 'start' | 'end';
  title: string;
  description?: string;
  position: Position;
  width?: number;
  height?: number;
  style?: CSSProperties;
  data?: Record<string, any>; // Additional data for future extension
  tooltip?: {
    text: string;
    alwaysVisible?: boolean;
  };
}

// Connection interface representing a directed edge between nodes
export interface NodeConnection {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  label?: string;
  style?: 'straight' | 'bezier' | 'step';
  animated?: boolean;
  color?: string;
  tooltip?: {
    text: string;
    alwaysVisible?: boolean;
  };
}

// Workflow interface representing the entire workflow
export interface Workflow {
  id: string;
  title: string;
  description?: string;
  nodes: Record<string, WorkflowNode>;
  connections: Record<string, NodeConnection>;
  createdAt: number;
  updatedAt: number;
}

// ViewPort state for panning and zooming
export interface ViewPort {
  zoom: number;
  position: Position;
}

// Canvas state with workflow and viewport
export interface WorkflowCanvasState {
  workflow: Workflow;
  viewport: ViewPort;
  selectedNodeId?: string;
  selectedConnectionId?: string;
  selectedNodeIds: string[]; // Array of selected node IDs for multi-selection
  isDragging: boolean;
  isConnecting: boolean;
  connectionSource?: string;
  isMultiSelecting: boolean; // Indicates if multi-selection mode is active
}

// Types of canvas actions
export type CanvasAction =
  | { type: 'ADD_NODE'; payload: WorkflowNode }
  | { type: 'UPDATE_NODE'; payload: { id: string; changes: Partial<WorkflowNode> } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; position: Position } }
  | { type: 'MOVE_SELECTED_NODES'; payload: { offset: Position } }
  | { type: 'ADD_CONNECTION'; payload: NodeConnection }
  | { type: 'UPDATE_CONNECTION'; payload: { id: string; changes: Partial<NodeConnection> } }
  | { type: 'DELETE_CONNECTION'; payload: string }
  | { type: 'SELECT_NODE'; payload: string | undefined }
  | { type: 'SELECT_CONNECTION'; payload: string | undefined }
  | { type: 'ADD_TO_SELECTION'; payload: string } // Add a node to the multi-selection
  | { type: 'REMOVE_FROM_SELECTION'; payload: string } // Remove a node from the multi-selection
  | { type: 'TOGGLE_NODE_SELECTION'; payload: string } // Toggle a node's selection state
  | { type: 'CLEAR_SELECTION'; payload: undefined } // Clear all selections
  | { type: 'SET_MULTI_SELECTING'; payload: boolean } // Set multi-selection mode
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTION_SOURCE'; payload: string | undefined }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'ZOOM'; payload: number }
  | { type: 'PAN'; payload: Position }
  | { type: 'RESET_VIEW' }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'IMPORT_WORKFLOW'; payload: Workflow }
  | { type: 'SELECT_ALL_NODES' }; 