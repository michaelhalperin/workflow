import React, { useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TextField from "../../components/ui/TextField";
import NotificationModal from "../../components/ui/NotificationModal";
// import AIWorkflowGenerator from "../../components/workflow/AIWorkflowGenerator";
import useWorkflowStorage from "../../hooks/workflow/useWorkflowStorage";
// import { Workflow } from "../../types/workflow";

interface WorkflowListPageProps {
  onSelectWorkflow: (workflowId: string) => void;
  onCreateWorkflow: () => void;
}

const WorkflowListPage: React.FC<WorkflowListPageProps> = ({
  onSelectWorkflow,
  onCreateWorkflow,
}) => {
  const {
    workflowsList,
    deleteWorkflow,
    // saveWorkflow
  } = useWorkflowStorage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [error, setError] = useState("");
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

  // Handle workflow creation
  const handleCreateWorkflow = () => {
    if (!newWorkflowTitle.trim()) {
      setError("Workflow title is required");
      return;
    }

    // Close modal
    setIsCreateModalOpen(false);
    setNewWorkflowTitle("");
    setError("");

    // Trigger workflow creation
    onCreateWorkflow();
  };

  // Handle AI-generated workflow
  // const handleAIGeneratedWorkflow = (workflowData: any) => {
  //   // Ensure start and end nodes are in the correct positions
  //   const startNode = workflowData.nodes.find((n: any) => n.type === "start");
  //   const endNode = workflowData.nodes.find((n: any) => n.type === "end");

  //   if (startNode) {
  //     startNode.position = { x: 300, y: 100 };
  //   }
  //   if (endNode) {
  //     endNode.position = { x: 300, y: 1000 };
  //   }

  //   // Build connection maps
  //   const nodeMap = new Map(workflowData.nodes.map((n: any) => [n.id, n]));
  //   const outgoing = new Map<string, string[]>();
  //   const incoming = new Map<string, string[]>();
  //   workflowData.nodes.forEach((n: any) => {
  //     outgoing.set(n.id, []);
  //     incoming.set(n.id, []);
  //   });
  //   workflowData.edges.forEach((e: any) => {
  //     outgoing.get(e.source)?.push(e.target);
  //     incoming.get(e.target)?.push(e.source);
  //   });

  //   // Find the main flow (longest path from start to end)
  //   function findLongestPath(current: string, path: string[]): string[] {
  //     if (current === (endNode?.id || "end")) return [...path, current];
  //     const nexts = outgoing.get(current) || [];
  //     if (nexts.length === 0) return [...path, current];
  //     let longest: string[] = [];
  //     for (const next of nexts) {
  //       const candidate = findLongestPath(next, [...path, current]);
  //       if (candidate.length > longest.length) longest = candidate;
  //     }
  //     return longest;
  //   }
  //   const mainFlow = startNode ? findLongestPath(startNode.id, []) : [];

  //   // Position main flow vertically
  //   const xMain = 300;
  //   const yStart = 100;
  //   const yStep = 150;
  //   mainFlow.forEach((id, idx) => {
  //     const node = nodeMap.get(id);
  //     if (node && typeof node === "object" && "position" in node) {
  //       node.position = { x: xMain, y: yStart + idx * yStep };
  //     }
  //   });

  //   // Position branches (nodes not in main flow)
  //   const branchXOffset = 300;
  //   const branchYStep = 120;
  //   let branchCol = 1;
  //   workflowData.nodes.forEach((node: any) => {
  //     if (
  //       !mainFlow.includes(node.id) &&
  //       node.type !== "start" &&
  //       node.type !== "end"
  //     ) {
  //       // Find the parent in main flow (first incoming that is in main flow)
  //       const parents = incoming.get(node.id) || [];
  //       const parentInMain = parents.find((pid) => mainFlow.includes(pid));
  //       let parentY = yStart;
  //       if (parentInMain) {
  //         const parentIdx = mainFlow.indexOf(parentInMain);
  //         parentY = yStart + parentIdx * yStep;
  //       }
  //       if (typeof node === "object") {
  //         node.position = {
  //           x: xMain + branchCol * branchXOffset,
  //           y: parentY + branchYStep * (branchCol - 1),
  //         };
  //       }
  //       branchCol++;
  //     }
  //   });

  //   // Combine nodes in the correct order
  //   const sortedNodes = [
  //     startNode,
  //     ...workflowData.nodes.filter(
  //       (n: any) => n !== startNode && n !== endNode
  //     ),
  //     endNode,
  //   ].filter(Boolean);

  //   // Create a map of node positions for edge sorting
  //   const nodePositions = new Map(
  //     sortedNodes.map((node: any, index: number) => [node.id, index])
  //   );

  //   // Sort edges based on their source node's position
  //   const sortedEdges = workflowData.edges.sort((a: any, b: any) => {
  //     const posA = nodePositions.get(a.source) ?? 0;
  //     const posB = nodePositions.get(b.source) ?? 0;
  //     return posA - posB;
  //   });

  //   // Convert the AI-generated data to match our Workflow type
  //   const workflow: Workflow = {
  //     id: crypto.randomUUID(),
  //     title: workflowData.title,
  //     nodes: Object.fromEntries(
  //       sortedNodes.map((node: any) => [
  //         node.id,
  //         {
  //           id: node.id,
  //           type: node.type,
  //           title: node.data.label,
  //           description: node.data.description,
  //           position: node.position,
  //         },
  //       ])
  //     ),
  //     connections: Object.fromEntries(
  //       sortedEdges.map((edge: any) => [
  //         edge.id,
  //         {
  //           id: edge.id,
  //           source: edge.source,
  //           target: edge.target,
  //           label: edge.label,
  //         },
  //       ])
  //     ),
  //     createdAt: Date.now(),
  //     updatedAt: Date.now(),
  //   };

  //   saveWorkflow(workflow);
  //   onSelectWorkflow(workflow.id);
  // };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold text-neutral-900">
            Visual Workflow Builder
          </h1>
          <p className="text-lg text-neutral-600">
            Create, visualize, and manage your workflows with our interactive
            builder
          </p>
        </header>

        {/* Create workflow buttons */}
        <div className="mb-8 flex justify-center space-x-4">
          <Button
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-8 shadow-lg hover:shadow-xl transition-shadow duration-200"
          >
            Create New Workflow
          </Button>
        </div>

        {/* Workflows list */}
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-800">
            Your Workflows
          </h2>

          {workflowsList.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
              <svg
                className="mb-4 h-12 w-12 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <p className="mb-4 text-lg text-neutral-600">
                You haven't created any workflows yet
              </p>
              <Button
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6"
              >
                Create your first workflow
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workflowsList.map((workflow) => (
                <div
                  key={workflow.id}
                  onClick={() => onSelectWorkflow(workflow.id)}
                  className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-primary-300 hover:shadow-lg"
                >
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-neutral-800 group-hover:text-primary-600">
                      {workflow.title}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Updated:{" "}
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-neutral-500">
                      Created:{" "}
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotification({
                          isOpen: true,
                          type: "warning",
                          title: "Delete Workflow",
                          message:
                            "Are you sure you want to delete this workflow? This action cannot be undone.",
                          onConfirm: () => {
                            deleteWorkflow(workflow.id);
                            setNotification((n) => ({ ...n, isOpen: false }));
                          },
                        });
                      }}
                      className="rounded-lg p-2 text-neutral-400 transition-colors duration-200 hover:bg-red-50 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Workflow Generator Modal */}
        {/* <AIWorkflowGenerator
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onGenerate={handleAIGeneratedWorkflow}
          apiToken={apiKey}
        /> */}

        {/* Create workflow modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Workflow"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateWorkflow();
            }}
          >
            <TextField
              label="Workflow Title"
              value={newWorkflowTitle}
              onChange={(e) => {
                setNewWorkflowTitle(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              error={error}
              placeholder="Enter workflow title"
              fullWidth
              autoFocus
            />
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Workflow</Button>
            </div>
          </form>
        </Modal>

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
    </div>
  );
};

export default WorkflowListPage;
