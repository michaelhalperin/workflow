import { useState, useCallback } from "react";
import {
  WorkflowNode,
  NodeConnection,
  Position,
  ViewPort,
} from "../../types/workflow";

/**
 * Custom hook for workflow utility functions
 */
const useWorkflowUtils = (viewport: ViewPort) => {
  // For temporary connection being created
  const [tempConnectionPoints, setTempConnectionPoints] = useState<{
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  // Transform node position from canvas to screen coordinates
  const transformPosition = useCallback(
    (position: Position): Position => {
      return {
        x: position.x * viewport.zoom + viewport.position.x,
        y: position.y * viewport.zoom + viewport.position.y,
      };
    },
    [viewport]
  );

  // Transform screen coordinates to canvas position
  const reverseTransformPosition = useCallback(
    (screenPosition: Position): Position => {
      return {
        x: (screenPosition.x - viewport.position.x) / viewport.zoom,
        y: (screenPosition.y - viewport.position.y) / viewport.zoom,
      };
    },
    [viewport]
  );

  // Generate a new unique ID for a node
  const generateNodeId = (): string => {
    return `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Generate a new unique ID for a connection
  const generateConnectionId = (): string => {
    return `connection-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  // Calculate node center position
  const getNodeCenter = (node: WorkflowNode): Position => {
    const width = node.width || 200;
    const height = node.height || 100;

    return {
      x: node.position.x + width / 2,
      y: node.position.y + height / 2,
    };
  };

  // Calculate connecting points for a connection between two nodes
  const calculateConnectionPoints = useCallback(
    (
      sourceNode: WorkflowNode,
      targetNode: WorkflowNode
    ): {
      sourceX: number;
      sourceY: number;
      targetX: number;
      targetY: number;
    } => {
      const sourceCenter = getNodeCenter(sourceNode);
      const targetCenter = getNodeCenter(targetNode);

      const sourceWidth = sourceNode.width || 200;
      const sourceHeight = sourceNode.height || 100;
      const targetWidth = targetNode.width || 200;
      const targetHeight = targetNode.height || 100;

      // Calculate angle between centers
      const dx = targetCenter.x - sourceCenter.x;
      const dy = targetCenter.y - sourceCenter.y;
      const angle = Math.atan2(dy, dx);

      // Source point
      let sourceX = sourceCenter.x + Math.cos(angle) * (sourceWidth / 2);
      let sourceY = sourceCenter.y + Math.sin(angle) * (sourceHeight / 2);

      // Target point
      let targetX = targetCenter.x - Math.cos(angle) * (targetWidth / 2);
      let targetY = targetCenter.y - Math.sin(angle) * (targetHeight / 2);

      // Apply viewport transformation
      const transformedSource = transformPosition({ x: sourceX, y: sourceY });
      const transformedTarget = transformPosition({ x: targetX, y: targetY });

      return {
        sourceX: transformedSource.x,
        sourceY: transformedSource.y,
        targetX: transformedTarget.x,
        targetY: transformedTarget.y,
      };
    },
    [transformPosition]
  );

  // Start drawing a temporary connection from a source node
  const startConnectionDrag = useCallback(
    (sourceNode: WorkflowNode, clientX: number, clientY: number) => {
      const sourceCenter = getNodeCenter(sourceNode);
      const transformedSource = transformPosition(sourceCenter);

      setTempConnectionPoints({
        sourceX: transformedSource.x,
        sourceY: transformedSource.y,
        targetX: clientX,
        targetY: clientY,
      });
    },
    [transformPosition]
  );

  // Update temporary connection target position during drag
  const updateConnectionDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!tempConnectionPoints) return;

      setTempConnectionPoints({
        ...tempConnectionPoints,
        targetX: clientX,
        targetY: clientY,
      });
    },
    [tempConnectionPoints]
  );

  // End drawing a temporary connection
  const endConnectionDrag = useCallback(() => {
    setTempConnectionPoints(null);
  }, []);

  // Generate Bezier curve path for connection
  const generateConnectionPath = useCallback(
    (points: {
      sourceX: number;
      sourceY: number;
      targetX: number;
      targetY: number;
    }): string => {
      const { sourceX, sourceY, targetX, targetY } = points;

      // Calculate control points for a smooth curve
      const dx = Math.abs(targetX - sourceX) * 0.5;

      return `M${sourceX},${sourceY} C${sourceX + dx},${sourceY} ${
        targetX - dx
      },${targetY} ${targetX},${targetY}`;
    },
    []
  );

  // Check if point is inside node
  const isPointInNode = useCallback(
    (point: Position, node: WorkflowNode): boolean => {
      const width = node.width || 200;
      const height = node.height || 100;

      return (
        point.x >= node.position.x &&
        point.x <= node.position.x + width &&
        point.y >= node.position.y &&
        point.y <= node.position.y + height
      );
    },
    []
  );

  // Find a node at a specific point
  const findNodeAtPoint = useCallback(
    (point: Position, nodes: Record<string, WorkflowNode>): string | null => {
      const nodeIds = Object.keys(nodes);

      // Reverse to check nodes rendered on top first
      for (let i = nodeIds.length - 1; i >= 0; i--) {
        const nodeId = nodeIds[i];
        const node = nodes[nodeId];

        if (isPointInNode(point, node)) {
          return nodeId;
        }
      }

      return null;
    },
    [isPointInNode]
  );

  // Create a new node at a specific position
  const createNode = useCallback(
    (
      type: "task" | "decision" | "start" | "end",
      position: Position,
      title: string = "New Node",
      width: number = 200,
      height: number = 100
    ): WorkflowNode => {
      return {
        id: generateNodeId(),
        type,
        title,
        position,
        width,
        height,
      };
    },
    []
  );

  // Create a new connection between nodes
  const createConnection = useCallback(
    (
      sourceNodeId: string,
      targetNodeId: string,
      style: "straight" | "bezier" | "step" = "bezier"
    ): NodeConnection => {
      return {
        id: generateConnectionId(),
        source: sourceNodeId,
        target: targetNodeId,
        style,
        animated: false,
      };
    },
    []
  );

  return {
    tempConnectionPoints,
    transformPosition,
    reverseTransformPosition,
    generateNodeId,
    generateConnectionId,
    getNodeCenter,
    calculateConnectionPoints,
    startConnectionDrag,
    updateConnectionDrag,
    endConnectionDrag,
    generateConnectionPath,
    isPointInNode,
    findNodeAtPoint,
    createNode,
    createConnection,
  };
};

export default useWorkflowUtils;
