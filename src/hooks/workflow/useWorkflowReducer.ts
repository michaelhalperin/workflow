import { useReducer } from "react";
import {
  CanvasAction,
  WorkflowCanvasState,
  Workflow,
  ViewPort,
} from "../../types/workflow";
import { v4 as uuidv4 } from "uuid";

// Initial viewport state
const initialViewport: ViewPort = {
  zoom: 1,
  position: { x: 0, y: 0 },
};

// Initial workflow state
const createInitialWorkflow = (): Workflow => ({
  id: uuidv4(),
  title: "New Workflow",
  nodes: {},
  connections: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Create initial canvas state
const createInitialState = (
  initialWorkflow?: Workflow
): WorkflowCanvasState => ({
  workflow: initialWorkflow || createInitialWorkflow(),
  viewport: initialViewport,
  selectedNodeId: undefined,
  selectedConnectionId: undefined,
  selectedNodeIds: [], // Initialize empty array for multi-selection
  isDragging: false,
  isConnecting: false,
  connectionSource: undefined,
  isMultiSelecting: false, // Initialize multi-selection mode as false
});

/**
 * Reducer function for workflow canvas state
 */
function reducer(
  state: WorkflowCanvasState,
  action: CanvasAction
): WorkflowCanvasState {
  switch (action.type) {
    case "ADD_NODE": {
      const node = action.payload;
      return {
        ...state,
        workflow: {
          ...state.workflow,
          nodes: {
            ...state.workflow.nodes,
            [node.id]: node,
          },
          updatedAt: Date.now(),
        },
        selectedNodeId: node.id,
        selectedConnectionId: undefined,
        // Clear multi-selection when adding a new node
        selectedNodeIds: [node.id],
      };
    }

    case "UPDATE_NODE": {
      const { id, changes } = action.payload;
      const node = state.workflow.nodes[id];
      if (!node) return state;

      const updatedNode = { ...node, ...changes };
      return {
        ...state,
        workflow: {
          ...state.workflow,
          nodes: {
            ...state.workflow.nodes,
            [id]: updatedNode,
          },
          updatedAt: Date.now(),
        },
      };
    }

    case "DELETE_NODE": {
      const nodeId = action.payload;
      const { [nodeId]: deletedNode, ...remainingNodes } = state.workflow.nodes;

      // Also delete any connections that use this node
      const updatedConnections = { ...state.workflow.connections };
      Object.keys(updatedConnections).forEach((connectionId) => {
        const connection = updatedConnections[connectionId];
        if (connection.source === nodeId || connection.target === nodeId) {
          delete updatedConnections[connectionId];
        }
      });

      // Remove the node from selectedNodeIds
      const updatedSelectedNodeIds = state.selectedNodeIds.filter(
        (id) => id !== nodeId
      );

      return {
        ...state,
        workflow: {
          ...state.workflow,
          nodes: remainingNodes,
          connections: updatedConnections,
          updatedAt: Date.now(),
        },
        selectedNodeId:
          state.selectedNodeId === nodeId ? undefined : state.selectedNodeId,
        selectedNodeIds: updatedSelectedNodeIds,
      };
    }

    case "MOVE_NODE": {
      const { id, position } = action.payload;
      const node = state.workflow.nodes[id];
      if (!node) return state;

      return {
        ...state,
        workflow: {
          ...state.workflow,
          nodes: {
            ...state.workflow.nodes,
            [id]: {
              ...node,
              position,
            },
          },
          updatedAt: Date.now(),
        },
      };
    }

    case "MOVE_SELECTED_NODES": {
      const { offset } = action.payload;
      const nodesToMove =
        state.selectedNodeIds.length > 0
          ? state.selectedNodeIds
          : state.selectedNodeId
          ? [state.selectedNodeId]
          : [];

      if (nodesToMove.length === 0) return state;

      const updatedNodes = { ...state.workflow.nodes };

      // Move each selected node by the offset
      nodesToMove.forEach((nodeId) => {
        const node = updatedNodes[nodeId];
        if (node) {
          updatedNodes[nodeId] = {
            ...node,
            position: {
              x: node.position.x + offset.x,
              y: node.position.y + offset.y,
            },
          };
        }
      });

      return {
        ...state,
        workflow: {
          ...state.workflow,
          nodes: updatedNodes,
          updatedAt: Date.now(),
        },
      };
    }

    case "ADD_CONNECTION": {
      const connection = action.payload;
      return {
        ...state,
        workflow: {
          ...state.workflow,
          connections: {
            ...state.workflow.connections,
            [connection.id]: connection,
          },
          updatedAt: Date.now(),
        },
        selectedConnectionId: connection.id,
        selectedNodeId: undefined,
        selectedNodeIds: [],
        isConnecting: false,
        connectionSource: undefined,
      };
    }

    case "UPDATE_CONNECTION": {
      const { id, changes } = action.payload;
      const connection = state.workflow.connections[id];
      if (!connection) return state;

      const updatedConnection = { ...connection, ...changes };
      return {
        ...state,
        workflow: {
          ...state.workflow,
          connections: {
            ...state.workflow.connections,
            [id]: updatedConnection,
          },
          updatedAt: Date.now(),
        },
      };
    }

    case "DELETE_CONNECTION": {
      const connectionId = action.payload;
      const { [connectionId]: deletedConnection, ...remainingConnections } =
        state.workflow.connections;
      return {
        ...state,
        workflow: {
          ...state.workflow,
          connections: remainingConnections,
          updatedAt: Date.now(),
        },
        selectedConnectionId:
          state.selectedConnectionId === connectionId
            ? undefined
            : state.selectedConnectionId,
      };
    }

    case "SELECT_NODE": {
      const nodeId = action.payload;
      // If multiselecting is active, don't clear the selectedNodeIds
      if (state.isMultiSelecting && nodeId) {
        return {
          ...state,
          selectedNodeId: nodeId,
          selectedConnectionId: undefined,
        };
      }

      // Otherwise, clear multi-selection and set single selection
      return {
        ...state,
        selectedNodeId: nodeId,
        selectedNodeIds: nodeId ? [nodeId] : [],
        selectedConnectionId: undefined,
      };
    }

    case "SELECT_CONNECTION": {
      return {
        ...state,
        selectedConnectionId: action.payload,
        selectedNodeId: undefined,
        selectedNodeIds: [], // Clear multi-selection when selecting a connection
      };
    }

    case "ADD_TO_SELECTION": {
      const nodeId = action.payload;
      // Don't add if already in selection
      if (state.selectedNodeIds.includes(nodeId)) {
        return state;
      }

      return {
        ...state,
        selectedNodeIds: [...state.selectedNodeIds, nodeId],
        selectedNodeId: nodeId, // Update the primary selected node
        selectedConnectionId: undefined,
      };
    }

    case "REMOVE_FROM_SELECTION": {
      const nodeId = action.payload;
      const updatedSelectedNodeIds = state.selectedNodeIds.filter(
        (id) => id !== nodeId
      );

      return {
        ...state,
        selectedNodeIds: updatedSelectedNodeIds,
        // Update the primary selected node if we removed it
        selectedNodeId:
          state.selectedNodeId === nodeId
            ? updatedSelectedNodeIds.length > 0
              ? updatedSelectedNodeIds[0]
              : undefined
            : state.selectedNodeId,
      };
    }

    case "TOGGLE_NODE_SELECTION": {
      const nodeId = action.payload;
      const isSelected = state.selectedNodeIds.includes(nodeId);

      if (isSelected) {
        // Remove from selection
        const updatedSelectedNodeIds = state.selectedNodeIds.filter(
          (id) => id !== nodeId
        );
        return {
          ...state,
          selectedNodeIds: updatedSelectedNodeIds,
          selectedNodeId:
            state.selectedNodeId === nodeId
              ? updatedSelectedNodeIds.length > 0
                ? updatedSelectedNodeIds[0]
                : undefined
              : state.selectedNodeId,
          selectedConnectionId: undefined,
        };
      } else {
        // Add to selection
        return {
          ...state,
          selectedNodeIds: [...state.selectedNodeIds, nodeId],
          selectedNodeId: nodeId,
          selectedConnectionId: undefined,
        };
      }
    }

    case "CLEAR_SELECTION": {
      return {
        ...state,
        selectedNodeId: undefined,
        selectedNodeIds: [],
        selectedConnectionId: undefined,
      };
    }

    case "SET_MULTI_SELECTING": {
      return {
        ...state,
        isMultiSelecting: action.payload,
      };
    }

    case "SET_CONNECTING": {
      return {
        ...state,
        isConnecting: action.payload,
        connectionSource: action.payload ? state.connectionSource : undefined,
      };
    }

    case "SET_CONNECTION_SOURCE": {
      return {
        ...state,
        connectionSource: action.payload,
        isConnecting: !!action.payload,
      };
    }

    case "SET_DRAGGING": {
      return {
        ...state,
        isDragging: action.payload,
      };
    }

    case "ZOOM": {
      return {
        ...state,
        viewport: {
          ...state.viewport,
          zoom: action.payload,
        },
      };
    }

    case "PAN": {
      return {
        ...state,
        viewport: {
          ...state.viewport,
          position: action.payload,
        },
      };
    }

    case "RESET_VIEW": {
      return {
        ...state,
        viewport: initialViewport,
      };
    }

    case "CLEAR_CANVAS": {
      return {
        ...state,
        workflow: {
          ...createInitialWorkflow(),
          id: state.workflow.id,
          title: state.workflow.title,
          updatedAt: Date.now(),
        },
        selectedNodeId: undefined,
        selectedNodeIds: [],
        selectedConnectionId: undefined,
        isConnecting: false,
        connectionSource: undefined,
      };
    }

    case "IMPORT_WORKFLOW": {
      return {
        ...state,
        workflow: {
          ...action.payload,
          updatedAt: Date.now(),
        },
        selectedNodeId: undefined,
        selectedNodeIds: [],
        selectedConnectionId: undefined,
      };
    }

    case "SELECT_ALL_NODES": {
      const allNodeIds = Object.keys(state.workflow.nodes);
      return {
        ...state,
        selectedNodeIds: allNodeIds,
        selectedNodeId: allNodeIds.length > 0 ? allNodeIds[0] : undefined,
        selectedConnectionId: undefined,
      };
    }

    default:
      return state;
  }
}

// Custom hook for using the workflow reducer
export function useWorkflowReducer(initialWorkflow?: Workflow) {
  return useReducer(reducer, createInitialState(initialWorkflow));
}

export default useWorkflowReducer;
