import React, { useState } from "react";
import { NodeConnection, WorkflowNode } from "../../types/workflow";

interface WorkflowConnectionProps {
  connection: NodeConnection;
  sourceNode: WorkflowNode;
  targetNode: WorkflowNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  connectionPoints: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
  };
}

const WorkflowConnection: React.FC<WorkflowConnectionProps> = ({
  connection,
  isSelected,
  onSelect,
  onDelete,
  connectionPoints,
}) => {
  const { sourceX, sourceY, targetX, targetY } = connectionPoints;

  // Track hover state
  const [isHovered, setIsHovered] = useState(false);

  // Calculate control points for a Bezier curve
  const generatePath = () => {
    if (connection.style === "straight") {
      return `M${sourceX},${sourceY} L${targetX},${targetY}`;
    } else if (connection.style === "step") {
      const midX = (sourceX + targetX) / 2;
      return `M${sourceX},${sourceY} L${midX},${sourceY} L${midX},${targetY} L${targetX},${targetY}`;
    } else {
      // Default: Bezier curve
      const dx = Math.abs(targetX - sourceX) * 0.5;
      return `M${sourceX},${sourceY} C${sourceX + dx},${sourceY} ${
        targetX - dx
      },${targetY} ${targetX},${targetY}`;
    }
  };

  // Calculate arrow position (at the end of the path)
  const generateArrow = () => {
    // Direction vector from source to target
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    // Normalize the vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const ndx = dx / length;
    const ndy = dy / length;

    // Calculate arrow points
    const arrowSize = 8;
    const arrowX = targetX - ndx * 5; // Pull back a little from the target
    const arrowY = targetY - ndy * 5;

    // Perpendicular vector
    const pdx = -ndy;
    const pdy = ndx;

    // Arrow points
    const point1X = arrowX - ndx * arrowSize + (pdx * arrowSize) / 2;
    const point1Y = arrowY - ndy * arrowSize + (pdy * arrowSize) / 2;
    const point2X = arrowX - ndx * arrowSize - (pdx * arrowSize) / 2;
    const point2Y = arrowY - ndy * arrowSize - (pdy * arrowSize) / 2;

    return `M${arrowX},${arrowY} L${point1X},${point1Y} L${point2X},${point2Y} Z`;
  };

  // Determine the connection color - use the custom color or fallback to selected/default colors
  const connectionColor =
    connection.color || (isSelected ? "#3b82f6" : "#60a5fa");

  return (
    <g
      className="cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(connection.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Invisible hit area for easier selection */}
      <path
        d={generatePath()}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        className="workflow-connection-hit-area"
      />

      {/* Connection line */}
      <path
        d={generatePath()}
        fill="none"
        stroke={connectionColor}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={connection.animated ? "5,5" : "none"}
        className={`${
          connection.animated ? "animate-dash" : ""
        } workflow-connection`}
      />

      {/* Arrow at the end */}
      <path d={generateArrow()} fill={connectionColor} stroke="none" />

      {/* Connection label (if any) */}
      {connection.label && (
        <g>
          <rect
            x={(sourceX + targetX) / 2 - 25}
            y={(sourceY + targetY) / 2 - 10}
            width="50"
            height="20"
            rx="4"
            fill="white"
            stroke={connectionColor}
            strokeWidth="1"
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2 + 5}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Delete button (shown when hovered or selected) */}
      {(isSelected || isHovered) && (
        <g
          transform={`translate(${(sourceX + targetX) / 2 - 16}, ${
            (sourceY + targetY) / 2 - 38
          })`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(connection.id);
          }}
          className="cursor-pointer hover:opacity-90"
        >
          {/* Invisible hit area for easier clicking */}
          <circle cx="16" cy="16" r="18" fill="transparent" />
          {/* Visible red icon */}
          <circle cx="16" cy="16" r="10" fill="#ef4444" />
          <line
            x1="11"
            y1="11"
            x2="21"
            y2="21"
            stroke="white"
            strokeWidth="2"
          />
          <line
            x1="21"
            y1="11"
            x2="11"
            y2="21"
            stroke="white"
            strokeWidth="2"
          />
        </g>
      )}
    </g>
  );
};

export default WorkflowConnection;
