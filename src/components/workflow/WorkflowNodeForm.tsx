import React, { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import TextField from "../ui/TextField";
import TextArea from "../ui/TextArea";
import { WorkflowNode } from "../../types/workflow";

interface WorkflowNodeFormProps {
  node?: WorkflowNode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nodeData: Partial<WorkflowNode>) => void;
  onResize?: () => void;
}

// The possible node shapes
type NodeShape =
  | "rectangle"
  | "rounded"
  | "circle"
  | "diamond"
  | "hexagon"
  | "cloud";

const WorkflowNodeForm: React.FC<WorkflowNodeFormProps> = ({
  node,
  isOpen,
  onClose,
  onSubmit,
  onResize,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"task" | "decision" | "start" | "end">(
    "task"
  );
  const [shape, setShape] = useState<NodeShape>("rounded");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [borderColor, setBorderColor] = useState("");
  const [textColor, setTextColor] = useState("");
  const [showIcon, setShowIcon] = useState(true);
  const [errors, setErrors] = useState<{ title?: string }>({});

  // Initialize form with node data when editing
  useEffect(() => {
    if (node) {
      setTitle(node.title || "");
      setDescription(node.description || "");
      setType(node.type || "task");

      // Initialize customization options from node.data
      setShape((node.data?.shape as NodeShape) || "rounded");
      setBackgroundColor(node.data?.backgroundColor || "");
      setBorderColor(node.data?.borderColor || "");
      setTextColor(node.data?.textColor || "");
      setShowIcon(node.data?.showIcon !== false);
    } else {
      // Default values for a new node
      setTitle("");
      setDescription("");
      setType("task");
      setShape("rounded");
      setBackgroundColor("");
      setBorderColor("");
      setTextColor("");
      setShowIcon(true);
    }
  }, [node, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }

    // Prepare node data
    const nodeData: Partial<WorkflowNode> = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      data: {
        shape,
        showIcon,
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(borderColor ? { borderColor } : {}),
        ...(textColor ? { textColor } : {}),
        ...(node?.data ? node.data : {}), // Preserve other data properties
      },
    };

    // Submit
    onSubmit(nodeData);

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={node ? "Edit Node" : "Create Node"}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10 items-stretch">
        {/* Left: Main controls */}
        <div className="flex-1 flex flex-col gap-4 justify-between">
          <div>
            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">Type</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center rounded-md border p-2 text-xs ${
                    type === "task"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setType("task")}
                >
                  <span className="mb-1 text-lg">📝</span>
                  Task
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center rounded-md border p-2 text-xs ${
                    type === "decision"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setType("decision")}
                >
                  <span className="mb-1 text-lg">🔄</span>
                  Decision
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center rounded-md border p-2 text-xs ${
                    type === "start"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setType("start")}
                >
                  <span className="mb-1 text-lg">▶️</span>
                  Start
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center rounded-md border p-2 text-xs ${
                    type === "end"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setType("end")}
                >
                  <span className="mb-1 text-lg">🏁</span>
                  End
                </button>
              </div>
            </div>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) {
                  setErrors({});
                }
              }}
              error={errors.title}
              placeholder="Enter node title"
              fullWidth
              autoFocus
            />

            <TextArea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter node description"
              fullWidth
              rows={2}
            />

            {/* Node shape selection */}
            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">Node Shape</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "rectangle"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("rectangle")}
                >
                  Rectangle
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "rounded"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("rounded")}
                >
                  Rounded
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "circle"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("circle")}
                >
                  Circle
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "diamond"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("diamond")}
                >
                  Diamond
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "hexagon"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("hexagon")}
                >
                  Hexagon
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-md border p-2 text-xs ${
                    shape === "cloud"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                  onClick={() => setShape("cloud")}
                >
                  Cloud
                </button>
              </div>
            </div>

            {/* Appearance customization */}
            <div className="mb-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">Appearance</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="w-20 text-xs text-neutral-600">Background:</label>
                  <input
                    type="color"
                    value={backgroundColor || "#ffffff"}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="CSS color or hex"
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  />
                  {backgroundColor && (
                    <button
                      type="button"
                      onClick={() => setBackgroundColor("")}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="w-20 text-xs text-neutral-600">Border:</label>
                  <input
                    type="color"
                    value={borderColor || "#000000"}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    placeholder="CSS color or hex"
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  />
                  {borderColor && (
                    <button
                      type="button"
                      onClick={() => setBorderColor("")}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <label className="w-20 text-xs text-neutral-600">Text:</label>
                  <input
                    type="color"
                    value={textColor || "#000000"}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-neutral-300"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    placeholder="CSS color or hex"
                    className="flex-1 rounded-md border border-neutral-300 px-2 py-1 text-xs"
                  />
                  {textColor && (
                    <button
                      type="button"
                      onClick={() => setTextColor("")}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Show icon toggle */}
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={showIcon}
                onChange={(e) => setShowIcon(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                id="show-icon-toggle"
              />
              <label htmlFor="show-icon-toggle" className="text-sm text-neutral-700 cursor-pointer">
                Show type icon
              </label>
            </div>
          </div>
          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {onResize && (
              <Button type="button" variant="secondary" onClick={onResize}>
                Resize
              </Button>
            )}
            <Button type="submit">{node ? "Update" : "Create"} Node</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default WorkflowNodeForm;
