import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import { NodeConnection } from "../../types/workflow";

interface WorkflowConnectionFormProps {
  connection?: NodeConnection;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (connectionData: Partial<NodeConnection>) => void;
}

// Preset colors for connections
const colorPresets = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
];

const WorkflowConnectionForm: React.FC<WorkflowConnectionFormProps> = ({
  connection,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [label, setLabel] = useState("");
  const [style, setStyle] = useState<"straight" | "bezier" | "step">("bezier");
  const [animated, setAnimated] = useState(false);
  const [color, setColor] = useState("#3b82f6");

  // Initialize form with connection data when editing
  useEffect(() => {
    if (connection) {
      setLabel(connection.label || "");
      setStyle(connection.style || "bezier");
      setAnimated(connection.animated || false);
      setColor(connection.color || "#3b82f6");
    } else {
      // Default values for a new connection
      setLabel("");
      setStyle("bezier");
      setAnimated(false);
      setColor("#3b82f6");
    }
  }, [connection, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Submit
    onSubmit({
      label: label.trim() || undefined,
      style,
      animated,
      color,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connection Properties">
      <form onSubmit={handleSubmit}>
        <TextField
          label="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter connection label"
          fullWidth
          autoFocus
        />

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Line Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                style === "straight"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
              onClick={() => setStyle("straight")}
            >
              <svg
                className="mr-1"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Straight
            </button>
            <button
              type="button"
              className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                style === "bezier"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
              onClick={() => setStyle("bezier")}
            >
              <svg
                className="mr-1"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 18 C 10 18, 14 6, 19 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              Curved
            </button>
            <button
              type="button"
              className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                style === "step"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
              onClick={() => setStyle("step")}
            >
              <svg
                className="mr-1"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polyline
                  points="5,18 12,18 12,6 19,6"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              Stepped
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Line Color
          </label>

          {/* Color preview */}
          <div
            className="h-8 w-full rounded-md border border-neutral-300 mb-2"
            style={{
              backgroundColor: color,
              backgroundImage: animated
                ? "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.2) 5px, rgba(255,255,255,0.2) 10px)"
                : undefined,
            }}
          />

          {/* Color picker and input */}
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border border-neutral-300"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 rounded-md border border-neutral-300 px-3 py-1 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Preset colors */}
          <div className="flex flex-wrap gap-2">
            {colorPresets.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                className={`h-6 w-6 rounded-full ${
                  color === presetColor
                    ? "ring-2 ring-offset-2 ring-primary-500"
                    : ""
                }`}
                style={{ backgroundColor: presetColor }}
                onClick={() => setColor(presetColor)}
                aria-label={`Select color ${presetColor}`}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={animated}
              onChange={(e) => setAnimated(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="font-medium text-neutral-700">Animated line</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {connection ? "Update" : "Create"} Connection
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkflowConnectionForm;
