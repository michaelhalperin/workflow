import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import WorkflowNode from "./WorkflowNode";
import WorkflowConnection from "./WorkflowConnection";
import WorkflowNodeForm from "./WorkflowNodeForm";
import WorkflowConnectionForm from "./WorkflowConnectionForm";
import useWorkflowReducer from "../../hooks/workflow/useWorkflowReducer";
import useWorkflowUtils from "../../hooks/workflow/useWorkflowUtils";
import {
  WorkflowNode as WorkflowNodeType,
  NodeConnection,
  Position,
  Workflow,
} from "../../types/workflow";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import TextArea from "../ui/TextArea";
import ContextMenu from "../ui/ContextMenu";
import NotificationModal from "../ui/NotificationModal";
import html2canvas from "html2canvas";

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialWorkflow,
  onSave,
}) => {
  // Canvas ref for measuring and handling interactions
  const canvasRef = useRef<HTMLDivElement>(null);

  // State management
  const [state, dispatch] = useWorkflowReducer(initialWorkflow);
  const {
    workflow,
    viewport,
    selectedNodeId,
    selectedConnectionId,
    selectedNodeIds,
    isDragging,
    isConnecting,
    connectionSource,
  } = state;

  // Workflow utility functions
  const utils = useWorkflowUtils(viewport);

  // Mouse position tracking for panning and connecting
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  // Sensitivity constants
  const PAN_SENSITIVITY = 1.5; // Higher = less sensitive
  const ZOOM_STEP = 0.05; // Smaller = smoother zoom
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 2;

  // Modal state
  const [isNodeFormOpen, setIsNodeFormOpen] = useState(false);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [exportValue, setExportValue] = useState("");
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState("");

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    targetNodeId?: string;
  }>({ isOpen: false, position: { x: 0, y: 0 }, targetNodeId: undefined });

  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<Position | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<Position | null>(null);

  // Notification modal state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: undefined,
  });

  // Editable workflow title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(workflow.title);

  // Track which node is in resize mode
  const [resizeNodeId, setResizeNodeId] = useState<string | null>(null);

  // Save As dropdown state
  const [isSaveAsOpen, setIsSaveAsOpen] = useState(false);

  // Update local input when workflow changes (e.g., import)
  useEffect(() => {
    setTitleInput(workflow.title);
  }, [workflow.title]);

  // Auto-save workflow to localStorage on every change
  useEffect(() => {
    if (onSave) {
      onSave(workflow);
    }
  }, [workflow, onSave]);

  // Handle title save
  const saveTitle = useCallback(() => {
    const newTitle = titleInput.trim() || "Untitled Workflow";
    if (newTitle !== workflow.title) {
      dispatch({
        type: "IMPORT_WORKFLOW",
        payload: { ...workflow, title: newTitle },
      });
    }
    setIsEditingTitle(false);
  }, [titleInput, workflow, dispatch]);

  // Helper: get node bounding box in canvas coordinates
  const getNodeRect = (node: WorkflowNodeType) => {
    const width = node.width || 200;
    const height = node.height || 100;
    return {
      x: node.position.x,
      y: node.position.y,
      width,
      height,
    };
  };

  // Helper: check if a node is inside the marquee rectangle
  const isNodeInMarquee = (
    node: WorkflowNodeType,
    rect: { x1: number; y1: number; x2: number; y2: number }
  ) => {
    const nodeRect = getNodeRect(node);
    const nodeLeft = nodeRect.x;
    const nodeRight = nodeRect.x + nodeRect.width;
    const nodeTop = nodeRect.y;
    const nodeBottom = nodeRect.y + nodeRect.height;
    const xMin = Math.min(rect.x1, rect.x2);
    const xMax = Math.max(rect.x1, rect.x2);
    const yMin = Math.min(rect.y1, rect.y2);
    const yMax = Math.max(rect.y1, rect.y2);
    // Check if node overlaps the marquee rectangle
    return (
      nodeRight > xMin && nodeLeft < xMax && nodeBottom > yMin && nodeTop < yMax
    );
  };

  // Canvas mouse down: start marquee selection if Ctrl/Shift is held
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // Always clear selection and exit connect mode when clicking the canvas background
      dispatch({ type: "CLEAR_SELECTION", payload: undefined });
      if (isConnecting) {
        dispatch({ type: "SET_CONNECTING", payload: false });
        dispatch({ type: "SET_CONNECTION_SOURCE", payload: undefined });
        utils.endConnectionDrag();
        return;
      }
      if (e.ctrlKey || e.shiftKey) {
        // Start marquee selection
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const start = utils.reverseTransformPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          setIsMarqueeSelecting(true);
          setMarqueeStart(start);
          setMarqueeEnd(start);
        }
        return;
      }
      // Update multi-selection mode based on Ctrl key
      dispatch({ type: "SET_MULTI_SELECTING", payload: e.ctrlKey });
      // If not pressing Ctrl, start panning
      if (!e.ctrlKey) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [dispatch, isConnecting, utils]
  );

  // Canvas mouse move: update marquee end
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMarqueeSelecting && marqueeStart) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const end = utils.reverseTransformPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          setMarqueeEnd(end);
        }
        return;
      }
      // If connecting, update the temporary connection line
      if (isConnecting && connectionSource) {
        const sourceNode = workflow.nodes[connectionSource];
        if (sourceNode) {
          utils.updateConnectionDrag(e.clientX, e.clientY);
        }
      }

      // If panning, update the viewport position
      if (isPanning) {
        // Reduce sensitivity by dividing the delta
        const dx = (e.clientX - panStart.x) / PAN_SENSITIVITY;
        const dy = (e.clientY - panStart.y) / PAN_SENSITIVITY;
        // Ignore very small movements
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        dispatch({
          type: "PAN",
          payload: {
            x: viewport.position.x + dx,
            y: viewport.position.y + dy,
          },
        });
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    },
    [
      isMarqueeSelecting,
      marqueeStart,
      utils,
      isConnecting,
      connectionSource,
      workflow.nodes,
      isPanning,
      panStart,
      dispatch,
      viewport.position,
      PAN_SENSITIVITY,
    ]
  );

  // Canvas mouse up: finish marquee selection
  const handleCanvasMouseUp = useCallback(() => {
    if (isMarqueeSelecting && marqueeStart && marqueeEnd) {
      // Calculate selection rectangle in canvas coordinates
      const rect = {
        x1: marqueeStart.x,
        y1: marqueeStart.y,
        x2: marqueeEnd.x,
        y2: marqueeEnd.y,
      };
      // Find all nodes inside the rectangle
      const selectedIds = Object.values(workflow.nodes)
        .filter((node) => isNodeInMarquee(node, rect))
        .map((node) => node.id);
      dispatch({
        type: "SET_MULTI_SELECTING",
        payload: true,
      });
      dispatch({
        type: "CLEAR_SELECTION",
        payload: undefined,
      });
      selectedIds.forEach((id) => {
        dispatch({ type: "ADD_TO_SELECTION", payload: id });
      });
      setIsMarqueeSelecting(false);
      setMarqueeStart(null);
      setMarqueeEnd(null);
      return;
    }
    // End panning
    if (isPanning) {
      setIsPanning(false);
    }

    // End dragging
    if (isDragging) {
      dispatch({ type: "SET_DRAGGING", payload: false });
    }

    // End connecting
    if (isConnecting) {
      utils.endConnectionDrag();
      // Don't end connection mode here - we will continue until user completes a connection
      // or cancels by pressing Escape
    }
  }, [
    isMarqueeSelecting,
    marqueeStart,
    marqueeEnd,
    workflow.nodes,
    dispatch,
    isPanning,
    isDragging,
    isConnecting,
    utils,
  ]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      let delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      // Optionally, scale delta by e.ctrlKey for pinch-zoom on Mac
      if (e.ctrlKey) delta *= 0.5;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, viewport.zoom + delta)
      );
      // Zoom toward cursor position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        // Calculate new position to zoom toward mouse
        const newPosition = {
          x:
            viewport.position.x -
            ((mouseX - viewport.position.x) * delta) / viewport.zoom,
          y:
            viewport.position.y -
            ((mouseY - viewport.position.y) * delta) / viewport.zoom,
        };
        dispatch({ type: "ZOOM", payload: newZoom });
        dispatch({ type: "PAN", payload: newPosition });
      } else {
        dispatch({ type: "ZOOM", payload: newZoom });
      }
    },
    [dispatch, viewport.zoom, viewport.position, ZOOM_STEP, MIN_ZOOM, MAX_ZOOM]
  );

  // Add node at mouse position
  const handleAddNode = useCallback(() => {
    setIsNodeFormOpen(true);
  }, []);

  // Add node at specific position
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const position = utils.reverseTransformPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });

        // Create a default node at this position
        const newNode = utils.createNode("task", position, "New Task");
        dispatch({ type: "ADD_NODE", payload: newNode });
        dispatch({ type: "SELECT_NODE", payload: newNode.id });
        setIsNodeFormOpen(true);
      }
    },
    [dispatch, utils]
  );

  // Handle node move
  const handleNodeMove = useCallback(
    (id: string, position: Position, width?: number, height?: number) => {
      const node = workflow.nodes[id];
      if (!node) return;

      if (width !== undefined && height !== undefined) {
        // Update both position and dimensions
        dispatch({
          type: "UPDATE_NODE",
          payload: {
            id,
            changes: { position, width, height },
          },
        });
      } else {
        // If this node is part of a multi-selection, move all selected nodes
        if (selectedNodeIds.includes(id)) {
          // Calculate the offset from the node's original position
          const deltaX = position.x - node.position.x;
          const deltaY = position.y - node.position.y;

          // Move all selected nodes by the same offset
          dispatch({
            type: "MOVE_SELECTED_NODES",
            payload: {
              offset: { x: deltaX, y: deltaY },
            },
          });
        } else {
          // Moving a single node
          dispatch({ type: "MOVE_NODE", payload: { id, position } });
        }
      }
    },
    [dispatch, workflow.nodes, selectedNodeIds]
  );

  // Start connecting nodes
  const handleStartConnection = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const sourceNode = workflow.nodes[nodeId];
      if (!sourceNode) return;

      dispatch({ type: "SET_CONNECTION_SOURCE", payload: nodeId });
      dispatch({ type: "SET_CONNECTING", payload: true });
      utils.startConnectionDrag(sourceNode, clientX, clientY);
    },
    [dispatch, workflow.nodes, utils]
  );

  // End connecting nodes
  const handleEndConnection = useCallback(
    (targetNodeId: string) => {
      if (!connectionSource || connectionSource === targetNodeId) return;

      // Check if connection already exists
      const existingConnection = Object.values(workflow.connections).find(
        (conn) =>
          conn.source === connectionSource && conn.target === targetNodeId
      );

      if (!existingConnection) {
        // Create new connection
        const newConnection = utils.createConnection(
          connectionSource,
          targetNodeId
        );
        dispatch({ type: "ADD_CONNECTION", payload: newConnection });
        dispatch({ type: "SELECT_CONNECTION", payload: newConnection.id });
        setIsConnectionFormOpen(true);
      }

      // End connecting mode
      dispatch({ type: "SET_CONNECTING", payload: false });
      dispatch({ type: "SET_CONNECTION_SOURCE", payload: undefined });
      utils.endConnectionDrag();
    },
    [dispatch, connectionSource, workflow.connections, utils]
  );

  // Open node editor
  const handleEditNode = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SELECT_NODE", payload: nodeId });
      setIsNodeFormOpen(true);
    },
    [dispatch]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Delete Node",
        message:
          "Are you sure you want to delete this node? This action cannot be undone.",
        onConfirm: () => {
          dispatch({ type: "DELETE_NODE", payload: nodeId });
          if (onSave) {
            const { [nodeId]: _, ...remainingNodes } = workflow.nodes;
            onSave({
              ...workflow,
              nodes: remainingNodes,
            });
          }
          setNotification((n) => ({ ...n, isOpen: false }));
        },
      });
    },
    [dispatch, onSave, workflow]
  );

  // Edit connection
  const handleEditConnection = useCallback(
    (connectionId: string) => {
      dispatch({ type: "SELECT_CONNECTION", payload: connectionId });
      setIsConnectionFormOpen(true);
    },
    [dispatch]
  );

  // Delete connection
  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      dispatch({ type: "DELETE_CONNECTION", payload: connectionId });
    },
    [dispatch]
  );

  // Submit node form
  const handleNodeFormSubmit = useCallback(
    (nodeData: Partial<WorkflowNodeType>) => {
      if (selectedNodeId) {
        // Editing existing node
        dispatch({
          type: "UPDATE_NODE",
          payload: {
            id: selectedNodeId,
            changes: nodeData,
          },
        });
        if (onSave)
          onSave({
            ...workflow,
            nodes: {
              ...workflow.nodes,
              [selectedNodeId]: {
                ...workflow.nodes[selectedNodeId],
                ...nodeData,
              },
            },
          });
      } else {
        // Creating new node
        // Default position in center of visible canvas
        const position = {
          x: (window.innerWidth / 2 - viewport.position.x) / viewport.zoom,
          y: (window.innerHeight / 2 - viewport.position.y) / viewport.zoom,
        };

        const newNode = utils.createNode(
          nodeData.type || "task",
          position,
          nodeData.title || "New Node"
        );

        if (nodeData.description) {
          newNode.description = nodeData.description;
        }

        dispatch({ type: "ADD_NODE", payload: newNode });
        dispatch({ type: "SELECT_NODE", payload: newNode.id });
      }

      setIsNodeFormOpen(false);
    },
    [dispatch, selectedNodeId, utils, viewport]
  );

  // Submit connection form
  const handleConnectionFormSubmit = useCallback(
    (connectionData: Partial<NodeConnection>) => {
      if (selectedConnectionId) {
        // Editing existing connection
        dispatch({
          type: "UPDATE_CONNECTION",
          payload: {
            id: selectedConnectionId,
            changes: connectionData,
          },
        });
      }

      setIsConnectionFormOpen(false);
    },
    [dispatch, selectedConnectionId]
  );

  // Export workflow to JSON
  const handleExport = useCallback(() => {
    setExportValue(JSON.stringify(workflow, null, 2));
    setIsImportExportOpen(true);
  }, [workflow]);

  // Import workflow from JSON
  const handleImport = useCallback(() => {
    setImportValue("");
    setImportError("");
    setIsImportExportOpen(true);
  }, []);

  // Process import
  const handleProcessImport = useCallback(() => {
    try {
      const parsedWorkflow = JSON.parse(importValue);

      // Validate minimal workflow structure
      if (
        !parsedWorkflow.id ||
        !parsedWorkflow.title ||
        !parsedWorkflow.nodes ||
        !parsedWorkflow.connections
      ) {
        throw new Error("Invalid workflow structure");
      }

      dispatch({ type: "IMPORT_WORKFLOW", payload: parsedWorkflow });
      setIsImportExportOpen(false);
      setImportError("");
    } catch (error) {
      setImportError("Invalid JSON or workflow structure");
    }
  }, [dispatch, importValue]);

  // Clear canvas
  const handleClear = useCallback(() => {
    setNotification({
      isOpen: true,
      type: "warning",
      title: "Clear Canvas",
      message:
        "Are you sure you want to clear the canvas? This will delete all nodes and connections.",
      onConfirm: () => {
        dispatch({ type: "CLEAR_CANVAS" });
        setNotification((n) => ({ ...n, isOpen: false }));
      },
    });
  }, [dispatch]);

  // Reset view
  const handleResetView = useCallback(() => {
    dispatch({ type: "RESET_VIEW" });
  }, [dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape: Cancel connecting or close modals
      if (e.key === "Escape") {
        if (isConnecting) {
          utils.endConnectionDrag();
          dispatch({ type: "SET_CONNECTING", payload: false });
          dispatch({ type: "SET_CONNECTION_SOURCE", payload: undefined });
        } else if (isNodeFormOpen) {
          setIsNodeFormOpen(false);
        } else if (isConnectionFormOpen) {
          setIsConnectionFormOpen(false);
        } else if (isImportExportOpen) {
          setIsImportExportOpen(false);
        } else if (selectedNodeId || selectedConnectionId) {
          dispatch({ type: "CLEAR_SELECTION", payload: undefined });
        }
      }

      // Delete/Backspace: Delete selected connection
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isNodeFormOpen &&
        !isConnectionFormOpen &&
        !isImportExportOpen &&
        selectedConnectionId
      ) {
        handleDeleteConnection(selectedConnectionId);
      }

      // Space: Reset view
      if (
        e.key === " " &&
        !isNodeFormOpen &&
        !isConnectionFormOpen &&
        !isImportExportOpen
      ) {
        e.preventDefault();
        handleResetView();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    dispatch,
    selectedNodeId,
    selectedConnectionId,
    isConnecting,
    isNodeFormOpen,
    isConnectionFormOpen,
    isImportExportOpen,
    handleDeleteNode,
    handleDeleteConnection,
    handleResetView,
    utils,
  ]);

  // Calculate connection points for all connections
  const connectionPoints = useMemo(() => {
    const points: Record<
      string,
      {
        sourceX: number;
        sourceY: number;
        targetX: number;
        targetY: number;
      }
    > = {};

    Object.values(workflow.connections).forEach((connection) => {
      const sourceNode = workflow.nodes[connection.source];
      const targetNode = workflow.nodes[connection.target];

      if (sourceNode && targetNode) {
        points[connection.id] = utils.calculateConnectionPoints(
          sourceNode,
          targetNode
        );
      }
    });

    return points;
  }, [workflow.connections, workflow.nodes, utils]);

  // Get selected node and connection
  const selectedNode = selectedNodeId
    ? workflow.nodes[selectedNodeId]
    : undefined;
  const selectedConnection = selectedConnectionId
    ? workflow.connections[selectedConnectionId]
    : undefined;

  // Helper for selecting nodes (to be passed as a prop)
  const selectNode = useCallback(
    (id: string, event?: React.MouseEvent) => {
      const isCtrlPressed = event?.ctrlKey || false;

      // If this node is already selected, do not change selection
      if (selectedNodeIds.includes(id)) {
        // Optionally, bring this node to the front or set as primary
        dispatch({ type: "SET_MULTI_SELECTING", payload: true });
        return;
      }

      // Set multi-selecting mode based on Ctrl key
      dispatch({ type: "SET_MULTI_SELECTING", payload: isCtrlPressed });

      if (isCtrlPressed) {
        // Toggle this node in the selection
        if (selectedNodeIds.includes(id)) {
          dispatch({ type: "REMOVE_FROM_SELECTION", payload: id });
        } else {
          dispatch({ type: "ADD_TO_SELECTION", payload: id });
        }
      } else {
        // Regular selection (clears other selections)
        dispatch({ type: "SELECT_NODE", payload: id });
      }
    },
    [dispatch, selectedNodeIds]
  );

  // Node context menu handler
  const handleNodeContextMenu = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetNodeId: nodeId,
    });
  };

  // Canvas context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetNodeId: undefined,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      targetNodeId: undefined,
    });
  };

  // Context menu options
  const contextMenuOptions =
    typeof contextMenu.targetNodeId === "string"
      ? [
          {
            label: "Resize Node",
            onClick: () => {
              setResizeNodeId(contextMenu.targetNodeId as string);
              handleCloseContextMenu();
            },
          },
          {
            label: "Delete Node",
            onClick: () => {
              handleDeleteNode(contextMenu.targetNodeId as string);
            },
          },
        ]
      : [
          {
            label: "Add Node",
            onClick: () => {
              const position = utils.reverseTransformPosition({
                x: contextMenu.position.x - viewport.position.x,
                y: contextMenu.position.y - viewport.position.y,
              });
              dispatch({
                type: "ADD_NODE",
                payload: {
                  id: utils.generateNodeId(),
                  type: "task",
                  title: "New Node",
                  position,
                  width: 200,
                  height: 100,
                },
              });
            },
          },
          {
            label: "Select All",
            onClick: () => {
              dispatch({ type: "SELECT_ALL_NODES" });
            },
          },
          {
            label: "Clear Canvas",
            onClick: () => {
              handleClear();
            },
          },
        ];

  // Double-click handler for node: open modal with Resize action
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      dispatch({ type: "SELECT_NODE", payload: nodeId });
      setIsNodeFormOpen(true);
    },
    [dispatch]
  );

  // In the node form, add a Resize button
  const handleNodeFormResize = useCallback(() => {
    setIsNodeFormOpen(false);
    if (selectedNodeId) setResizeNodeId(selectedNodeId);
  }, [selectedNodeId]);

  // When resizing is done (on mouse up), clear resizeNodeId
  useEffect(() => {
    if (!resizeNodeId) return;
    const handleUp = () => setResizeNodeId(null);
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [resizeNodeId]);

  // Download JSON utility
  function downloadJSON(data: object, filename: string) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  // Save as image utility (requires html2canvas)
  // npm install html2canvas
  async function downloadCanvasAsImage(
    canvasRef: React.RefObject<HTMLDivElement>,
    filename: string
  ) {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: 2,
      ignoreElements: (element: Element) => element.classList.contains("z-50"), // ignore overlays
    });
    canvas.toBlob((blob: Blob | null) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }, "image/png");
  }

  // Close Save As dropdown on outside click
  useEffect(() => {
    if (!isSaveAsOpen) return;
    const handle = () => setIsSaveAsOpen(false);
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, [isSaveAsOpen]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-2">
        <div className="flex space-x-2 items-center">
          {/* Editable workflow title */}
          {isEditingTitle ? (
            <input
              className="text-lg font-medium border-b border-primary-400 focus:outline-none focus:border-primary-600 bg-white px-1 py-0.5 rounded min-w-[120px]"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveTitle();
                } else if (e.key === "Escape") {
                  setIsEditingTitle(false);
                  setTitleInput(workflow.title);
                }
              }}
              maxLength={64}
            />
          ) : (
            <span
              className="text-lg font-medium cursor-pointer hover:bg-primary-50 px-1 rounded transition"
              title="Click to edit workflow name"
              onClick={() => setIsEditingTitle(true)}
            >
              {workflow.title || "Untitled Workflow"}
            </span>
          )}
          {/* Add Node button */}
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleAddNode}
          >
            Add Node
          </button>
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleClear}
          >
            Clear All
          </button>
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleResetView}
          >
            Reset View
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleExport}
          >
            Export
          </button>
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={handleImport}
          >
            Import
          </button>
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={() => {
              const safeTitle = (workflow.title || "workflow").replace(
                /[^a-z0-9-_]+/gi,
                "_"
              );
              downloadJSON(workflow, `${safeTitle}.json`);
            }}
          >
            Download as JSON
          </button>
          <button
            className="rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={async () => {
              const safeTitle = (workflow.title || "workflow").replace(
                /[^a-z0-9-_]+/gi,
                "_"
              );
              await downloadCanvasAsImage(canvasRef, `${safeTitle}.png`);
            }}
          >
            Download as Image
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={() =>
              dispatch({ type: "ZOOM", payload: viewport.zoom + 0.1 })
            }
          >
            +
          </button>
          <span className="text-xs text-neutral-600">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <button
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            onClick={() =>
              dispatch({ type: "ZOOM", payload: viewport.zoom - 0.1 })
            }
          >
            -
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative flex-1 overflow-hidden bg-neutral-50 ${
          isPanning
            ? "cursor-grabbing"
            : isMarqueeSelecting
            ? "cursor-crosshair"
            : "cursor-grab"
        }`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Marquee selection rectangle */}
        {isMarqueeSelecting && marqueeStart && marqueeEnd && (
          <div
            className="absolute z-40 pointer-events-none border-2 border-primary-400 bg-primary-200/20"
            style={{
              left: `${
                Math.min(marqueeStart.x, marqueeEnd.x) * viewport.zoom +
                viewport.position.x
              }px`,
              top: `${
                Math.min(marqueeStart.y, marqueeEnd.y) * viewport.zoom +
                viewport.position.y
              }px`,
              width: `${
                Math.abs(marqueeEnd.x - marqueeStart.x) * viewport.zoom
              }px`,
              height: `${
                Math.abs(marqueeEnd.y - marqueeStart.y) * viewport.zoom
              }px`,
            }}
          />
        )}
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            backgroundPosition: `${
              viewport.position.x % (20 * viewport.zoom)
            }px ${viewport.position.y % (20 * viewport.zoom)}px`,
          }}
        />

        {/* SVG for connections */}
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Render all connections */}
          {Object.values(workflow.connections).map((connection) => {
            const sourceNode = workflow.nodes[connection.source];
            const targetNode = workflow.nodes[connection.target];
            const points = connectionPoints[connection.id];

            if (!sourceNode || !targetNode || !points) return null;

            return (
              <WorkflowConnection
                key={connection.id}
                connection={connection}
                sourceNode={sourceNode}
                targetNode={targetNode}
                isSelected={selectedConnectionId === connection.id}
                onSelect={handleEditConnection}
                onDelete={handleDeleteConnection}
                connectionPoints={points}
              />
            );
          })}

          {/* Temporary connection line when creating a new connection */}
          {isConnecting && utils.tempConnectionPoints && (
            <path
              d={utils.generateConnectionPath(utils.tempConnectionPoints)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-dash"
            />
          )}
        </svg>

        {/* Nodes */}
        {Object.values(workflow.nodes).map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onSelect={(id, event) => selectNode(id, event)}
            onMove={handleNodeMove}
            onEdit={handleEditNode}
            onDelete={handleDeleteNode}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            isConnecting={isConnecting}
            connectionSource={connectionSource}
            canvasZoom={viewport.zoom}
            viewportPosition={viewport.position}
            isMultiSelected={selectedNodeIds.includes(node.id)}
            onContextMenu={(e) => handleNodeContextMenu(node.id, e)}
            onDoubleClick={handleNodeDoubleClick}
            showResizeHandles={resizeNodeId === node.id}
          />
        ))}
      </div>

      {/* Node Form Modal */}
      <WorkflowNodeForm
        node={selectedNode}
        isOpen={isNodeFormOpen}
        onClose={() => setIsNodeFormOpen(false)}
        onSubmit={handleNodeFormSubmit}
        onResize={handleNodeFormResize}
      />

      {/* Connection Form Modal */}
      <WorkflowConnectionForm
        connection={selectedConnection}
        isOpen={isConnectionFormOpen}
        onClose={() => setIsConnectionFormOpen(false)}
        onSubmit={handleConnectionFormSubmit}
      />

      {/* Import/Export Modal */}
      <Modal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        title={exportValue ? "Export Workflow" : "Import Workflow"}
      >
        {exportValue ? (
          <div>
            <p className="mb-2 text-sm text-neutral-600">
              Copy this JSON to save your workflow:
            </p>
            <TextArea
              value={exportValue}
              onChange={() => {}}
              rows={10}
              className="font-mono text-xs"
              fullWidth
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsImportExportOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm text-neutral-600">
              Paste a valid workflow JSON to import:
            </p>
            <TextArea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              rows={10}
              className="font-mono text-xs"
              fullWidth
              error={importError}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setIsImportExportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessImport}
                disabled={!importValue.trim()}
              >
                Import
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        onClose={handleCloseContextMenu}
        position={contextMenu.position}
        options={contextMenuOptions}
      />

      {/* Notification Modal for confirmations and alerts */}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification((n) => ({ ...n, isOpen: false }))}
        onConfirm={notification.onConfirm}
        confirmLabel={notification.type === "warning" ? "Delete" : undefined}
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default WorkflowCanvas;
