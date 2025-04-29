import React, { useState, useRef, useEffect } from "react";
import {
  WorkflowNode as WorkflowNodeType,
  Position,
} from "../../types/workflow";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  selected: boolean;
  onSelect: (id: string, event?: React.MouseEvent) => void;
  onMove: (
    id: string,
    position: Position,
    width?: number,
    height?: number
  ) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStartConnection: (id: string, clientX: number, clientY: number) => void;
  onEndConnection: (id: string) => void;
  isConnecting: boolean;
  connectionSource?: string;
  canvasZoom: number;
  viewportPosition?: Position;
  isMultiSelected?: boolean;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (id: string) => void;
  showResizeHandles?: boolean;
}

// Define node shape types
type NodeShape =
  | "rectangle"
  | "rounded"
  | "circle"
  | "diamond"
  | "hexagon"
  | "cloud";

// Color mapping for node types
const colorMap = {
  task: "border-primary-400 bg-white",
  decision: "border-amber-400 bg-white",
  start: "border-green-500 bg-white",
  end: "border-red-500 bg-white",
  data: "border-purple-400 bg-white",
  process: "border-cyan-400 bg-white",
  io: "border-indigo-400 bg-white",
};

// Header color mapping
const headerColorMap = {
  task: "bg-primary-50 border-primary-100",
  decision: "bg-amber-50 border-amber-200",
  start: "bg-green-50 border-green-200",
  end: "bg-red-50 border-red-200",
  data: "bg-purple-50 border-purple-100",
  process: "bg-cyan-50 border-cyan-100",
  io: "bg-indigo-50 border-indigo-100",
};

// Shape CSS based on the node shape property
const getNodeShapeClasses = (shape: NodeShape = "rounded"): string => {
  switch (shape) {
    case "rectangle":
      return "";
    case "rounded":
      return "rounded-md";
    case "circle":
      return "rounded-full";
    case "diamond":
      return "transform rotate-45";
    case "hexagon":
      return "clip-path-hexagon";
    case "cloud":
      return "cloud-shape";
    default:
      return "rounded-md";
  }
};

// Node icons for different types
const nodeIcons: Record<string, React.ReactNode> = {
  task: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  decision: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
      <path d="M12 22v-7.5" />
      <path d="M12 2v7.5" />
    </svg>
  ),
  start: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8l6 4-6 4V8z" />
    </svg>
  ),
  end: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12h6" />
    </svg>
  ),
  data: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a8 5 0 0 0-8 5v10a8 5 0 0 0 16 0V7a8 5 0 0 0-8-5Z" />
      <path d="M4 12h16" />
    </svg>
  ),
  process: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h.01" />
      <path d="M12 8h.01" />
      <path d="M16 8h.01" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  ),
  io: (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
      <path d="M12 12v5" />
      <path d="M8 12v2" />
      <path d="M16 12v2" />
    </svg>
  ),
};

const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  node,
  selected,
  onSelect,
  onMove,
  onEdit,
  onDelete,
  onStartConnection,
  onEndConnection,
  isConnecting,
  connectionSource,
  canvasZoom,
  viewportPosition = { x: 0, y: 0 },
  isMultiSelected = false,
  onContextMenu,
  onDoubleClick,
  showResizeHandles = false,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Position>({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState<Position>(node.position);
  const [isResizing, setIsResizing] = useState(false);

  // --- Resize logic ---
  // Track which handle is being dragged and the initial mouse/node state
  const [resizeHandle, setResizeHandle] = useState<
    | null
    | "top-left"
    | "top"
    | "top-right"
    | "right"
    | "bottom-right"
    | "bottom"
    | "bottom-left"
    | "left"
  >(null);
  const [resizeStart, setResizeStart] = useState<{
    mouseX: number;
    mouseY: number;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Extract node custom properties with defaults
  const nodeShape = (node.data?.shape as NodeShape) || "rounded";
  const nodeIcon = node.data?.showIcon !== false;
  const customBgColor = node.data?.backgroundColor;
  const customBorderColor = node.data?.borderColor;
  const customTextColor = node.data?.textColor;
  const nodeImage = node.data?.image;

  // Set node width and height from rendered DOM element
  useEffect(() => {
    if (nodeRef.current) {
      const { width, height } = nodeRef.current.getBoundingClientRect();
      if (width !== node.width || height !== node.height) {
        // Only update if different to avoid infinite loops
        onMove(node.id, node.position, width, height);
      }
    }
  }, [nodeRef, node.id, node.width, node.height, node.position, onMove]);

  // Handle mouse move and mouse up for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate mouse movement delta in screen coordinates
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;

      // Convert screen delta to canvas coordinates by dividing by zoom
      const canvasDeltaX = deltaX / canvasZoom;
      const canvasDeltaY = deltaY / canvasZoom;

      // Apply delta to original node position
      const newPosition = {
        x: nodeStartPos.x + canvasDeltaX,
        y: nodeStartPos.y + canvasDeltaY,
      };

      // Move the node
      onMove(node.id, newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add document-level event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Clean up
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, node.id, dragStartPos, nodeStartPos, onMove, canvasZoom]);

  // Handle mouse down event for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only handle left mouse button
    e.stopPropagation();

    // Select this node (unless multi-selecting with Ctrl)
    onSelect(node.id, e);

    // Save the mouse start position and node start position
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setNodeStartPos({ ...node.position });
    setIsDragging(true);
  };

  // Handle click on connection handle
  const handleConnectionHandleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    onStartConnection(node.id, e.clientX, e.clientY);
  };

  // Handle when a connecting line targets this node
  const handleConnectionTarget = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (isConnecting && connectionSource && connectionSource !== node.id) {
      onEndConnection(node.id);
    }
  };

  // Calculate the displayed position of the node in the DOM
  // This transforms the logical canvas coordinates to screen coordinates
  const displayX = node.position.x * canvasZoom + viewportPosition.x;
  const displayY = node.position.y * canvasZoom + viewportPosition.y;

  // Custom inline styles
  const customStyles: React.CSSProperties = {
    ...(node.style || {}),
    backgroundColor: customBgColor || undefined,
    borderColor: customBorderColor || undefined,
    color: customTextColor || undefined,
  };

  // Get shape-specific classes
  const shapeClasses = getNodeShapeClasses(nodeShape);

  // Resize mouse move/up handlers
  useEffect(() => {
    if (!isResizing || !resizeHandle || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const dx = (e.clientX - resizeStart.mouseX) / canvasZoom;
      const dy = (e.clientY - resizeStart.mouseY) / canvasZoom;
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.x;
      let newY = resizeStart.y;
      const minWidth = 80;
      const minHeight = 40;
      switch (resizeHandle) {
        case "top-left":
          newWidth = Math.max(minWidth, resizeStart.width - dx);
          newHeight = Math.max(minHeight, resizeStart.height - dy);
          newX = resizeStart.x + (resizeStart.width - newWidth);
          newY = resizeStart.y + (resizeStart.height - newHeight);
          break;
        case "top":
          newHeight = Math.max(minHeight, resizeStart.height - dy);
          newY = resizeStart.y + (resizeStart.height - newHeight);
          break;
        case "top-right":
          newWidth = Math.max(minWidth, resizeStart.width + dx);
          newHeight = Math.max(minHeight, resizeStart.height - dy);
          newY = resizeStart.y + (resizeStart.height - newHeight);
          break;
        case "right":
          newWidth = Math.max(minWidth, resizeStart.width + dx);
          break;
        case "bottom-right":
          newWidth = Math.max(minWidth, resizeStart.width + dx);
          newHeight = Math.max(minHeight, resizeStart.height + dy);
          break;
        case "bottom":
          newHeight = Math.max(minHeight, resizeStart.height + dy);
          break;
        case "bottom-left":
          newWidth = Math.max(minWidth, resizeStart.width - dx);
          newHeight = Math.max(minHeight, resizeStart.height + dy);
          newX = resizeStart.x + (resizeStart.width - newWidth);
          break;
        case "left":
          newWidth = Math.max(minWidth, resizeStart.width - dx);
          newX = resizeStart.x + (resizeStart.width - newWidth);
          break;
      }
      // Call onMove with new size and position
      onMove(node.id, { x: newX, y: newY }, newWidth, newHeight);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, onMove, node.id, canvasZoom]);

  // --- Render resize handles ---
  const renderResizeHandles = () => {
    if (!showResizeHandles) return null;
    // Handles: 8 directions
    const handlePositions = [
      { key: "top-left", style: "left-0 top-0 cursor-nwse-resize" },
      { key: "top", style: "left-1/2 top-0 -translate-x-1/2 cursor-ns-resize" },
      { key: "top-right", style: "right-0 top-0 cursor-nesw-resize" },
      {
        key: "right",
        style: "right-0 top-1/2 -translate-y-1/2 cursor-ew-resize",
      },
      { key: "bottom-right", style: "right-0 bottom-0 cursor-nwse-resize" },
      {
        key: "bottom",
        style: "left-1/2 bottom-0 -translate-x-1/2 cursor-ns-resize",
      },
      { key: "bottom-left", style: "left-0 bottom-0 cursor-nesw-resize" },
      {
        key: "left",
        style: "left-0 top-1/2 -translate-y-1/2 cursor-ew-resize",
      },
    ];
    return (
      <>
        {handlePositions.map((h) => (
          <div
            key={h.key}
            className={`absolute w-3 h-3 bg-primary-500 border-2 border-white rounded-full z-30 ${h.style}`}
            style={{
              transform:
                h.style.includes("-translate-x-1/2") &&
                h.style.includes("-translate-y-1/2")
                  ? "translate(-50%,-50%)"
                  : h.style.includes("-translate-x-1/2")
                  ? "translateX(-50%)"
                  : h.style.includes("-translate-y-1/2")
                  ? "translateY(-50%)"
                  : undefined,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              setResizeHandle(h.key as any);
              setResizeStart({
                mouseX: e.clientX,
                mouseY: e.clientY,
                width: node.width || 200,
                height: node.height || 100,
                x: node.position.x,
                y: node.position.y,
              });
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-grab shadow-card hover:shadow-card-hover border-2 ${
        !customBorderColor ? colorMap[node.type] : ""
      } 
        ${shapeClasses} ${
        selected || isMultiSelected ? "ring-2 ring-primary-500" : ""
      } ${isDragging ? "cursor-grabbing" : ""}
        ${nodeShape === "diamond" ? "overflow-hidden" : ""}`}
      style={{
        left: `${displayX}px`,
        top: `${displayY}px`,
        width: node.width ? `${node.width}px` : "auto",
        minWidth: nodeShape === "circle" ? "120px" : "180px",
        minHeight: nodeShape === "circle" ? "120px" : "80px",
        height:
          nodeShape === "circle"
            ? node.width
              ? `${node.width}px`
              : "120px"
            : "auto",
        maxWidth: "400px",
        transform: `scale(${canvasZoom}) ${
          nodeShape === "diamond" ? "rotate(45deg)" : ""
        }`,
        transformOrigin: "top left",
        zIndex: selected || isDragging ? 10 : 1,
        ...customStyles,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id, e);
      }}
      onContextMenu={onContextMenu}
      onDoubleClick={() => {
        if (typeof onDoubleClick === "function") onDoubleClick(node.id);
      }}
    >
      {/* Node with image background if specified */}
      {nodeImage && (
        <div
          className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
          style={{ backgroundImage: `url(${nodeImage})` }}
        />
      )}

      {/* Content container - rotated back if diamond */}
      <div
        className={`relative z-10 h-full flex flex-col ${
          nodeShape === "diamond" ? "transform -rotate-45" : ""
        } 
        ${
          nodeShape === "circle"
            ? "justify-center items-center text-center px-3 py-3"
            : ""
        }`}
      >
        {/* Header with title - only for rectangle and rounded shapes */}
        {(nodeShape === "rectangle" || nodeShape === "rounded") && (
          <div
            className={`flex items-center px-3 py-2 font-medium text-sm border-b ${
              !customBorderColor ? headerColorMap[node.type] : ""
            }`}
          >
            {nodeIcon && nodeIcons[node.type] && (
              <span className="mr-1.5 text-current">
                {nodeIcons[node.type]}
              </span>
            )}
            {node.title}
          </div>
        )}

        {/* Circle, Diamond, Hexagon - simplified layout */}
        {(nodeShape === "circle" ||
          nodeShape === "diamond" ||
          nodeShape === "hexagon" ||
          nodeShape === "cloud") && (
          <div className="flex flex-col items-center justify-center">
            {nodeIcon && nodeIcons[node.type] && (
              <div className="mb-1">{nodeIcons[node.type]}</div>
            )}
            <div className="font-medium text-sm">{node.title}</div>
            {node.description && (
              <div className="text-xs text-neutral-700 mt-1 text-center">
                {node.description.length > 30
                  ? `${node.description.substring(0, 30)}...`
                  : node.description}
              </div>
            )}
          </div>
        )}

        {/* Content (description) - only for rectangle and rounded shapes */}
        {(nodeShape === "rectangle" || nodeShape === "rounded") && (
          <div className="p-3 text-xs text-neutral-700">
            {node.description || "No description"}
          </div>
        )}

        {/* Node actions - positioned differently based on shape */}
        <div
          className={`absolute ${
            nodeShape === "circle" || nodeShape === "diamond"
              ? "top-0 right-0 transform translate-x-0 translate-y-0"
              : "top-1 right-1"
          } flex space-x-1`}
        >
          <button
            className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-primary-600"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node.id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button
            className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Connection handle */}
      <div
        className={`absolute w-6 h-6 right-0 bottom-0 transform translate-x-1/2 translate-y-1/2 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center cursor-pointer z-20 workflow-handle ${
          isConnecting && connectionSource === node.id
            ? "ring-2 ring-primary-300"
            : ""
        }`}
        onMouseDown={handleConnectionHandleMouseDown}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>

      {/* Connection target indicator (only displayed when connecting) */}
      {isConnecting && connectionSource !== node.id && (
        <div
          className="absolute inset-0 border-2 border-dashed border-primary-400 rounded-md bg-primary-50 bg-opacity-50 z-10 cursor-pointer flex items-center justify-center"
          onClick={handleConnectionTarget}
        >
          <div className="bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            Connect here
          </div>
        </div>
      )}

      {/* Resize handles (show only in resize mode) */}
      {showResizeHandles && renderResizeHandles()}
    </div>
  );
};

export default WorkflowNode;
