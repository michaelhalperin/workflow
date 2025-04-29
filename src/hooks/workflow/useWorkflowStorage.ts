import useLocalStorage from "../useLocalStorage";
import { Workflow } from "../../types/workflow";

// Key for storing workflows in localStorage
const WORKFLOWS_STORAGE_KEY = "workflow-builder-workflows";

/**
 * Custom hook for managing workflow storage
 * @returns Functions and data for workflow storage operations
 */
const useWorkflowStorage = () => {
  // Store list of all workflow ids and metadata
  const [workflowsList, setWorkflowsList] = useLocalStorage<
    {
      id: string;
      title: string;
      createdAt: number;
      updatedAt: number;
    }[]
  >(WORKFLOWS_STORAGE_KEY, []);

  // Save a workflow to localStorage
  const saveWorkflow = (workflow: Workflow) => {
    // Save the workflow data with its own key
    localStorage.setItem(
      `${WORKFLOWS_STORAGE_KEY}-${workflow.id}`,
      JSON.stringify(workflow)
    );

    // Update or add to the workflows list
    const existingIndex = workflowsList.findIndex((w) => w.id === workflow.id);
    if (existingIndex >= 0) {
      const updatedList = [...workflowsList];
      updatedList[existingIndex] = {
        id: workflow.id,
        title: workflow.title,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      };
      setWorkflowsList(updatedList);
    } else {
      setWorkflowsList([
        ...workflowsList,
        {
          id: workflow.id,
          title: workflow.title,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
        },
      ]);
    }
  };

  // Load a workflow from localStorage
  const loadWorkflow = (id: string): Workflow | null => {
    try {
      const savedWorkflow = localStorage.getItem(
        `${WORKFLOWS_STORAGE_KEY}-${id}`
      );
      return savedWorkflow ? JSON.parse(savedWorkflow) : null;
    } catch (error) {
      console.error("Error loading workflow:", error);
      return null;
    }
  };

  // Delete a workflow from localStorage
  const deleteWorkflow = (id: string) => {
    localStorage.removeItem(`${WORKFLOWS_STORAGE_KEY}-${id}`);
    setWorkflowsList(workflowsList.filter((w) => w.id !== id));
  };

  // Export workflow to JSON
  const exportWorkflow = (workflow: Workflow): string => {
    return JSON.stringify(workflow);
  };

  // Import workflow from JSON
  const importWorkflow = (json: string): Workflow | null => {
    try {
      const workflow = JSON.parse(json) as Workflow;

      // Validate minimal workflow structure
      if (
        !workflow.id ||
        !workflow.title ||
        !workflow.nodes ||
        !workflow.connections
      ) {
        throw new Error("Invalid workflow structure");
      }

      return workflow;
    } catch (error) {
      console.error("Error importing workflow:", error);
      return null;
    }
  };

  return {
    workflowsList,
    saveWorkflow,
    loadWorkflow,
    deleteWorkflow,
    exportWorkflow,
    importWorkflow,
  };
};

export default useWorkflowStorage;
