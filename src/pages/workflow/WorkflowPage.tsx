import React from 'react';
import WorkflowCanvas from '../../components/workflow/WorkflowCanvas';
import { Workflow } from '../../types/workflow';
import useWorkflowStorage from '../../hooks/workflow/useWorkflowStorage';

interface WorkflowPageProps {
  workflowId?: string;
}

const WorkflowPage: React.FC<WorkflowPageProps> = ({ workflowId }) => {
  const { loadWorkflow, saveWorkflow } = useWorkflowStorage();
  
  // Load the workflow if ID is provided, handling the null case
  const workflow = workflowId ? (loadWorkflow(workflowId) || undefined) : undefined;
  
  // Handle saving the workflow
  const handleSave = (updatedWorkflow: Workflow) => {
    saveWorkflow(updatedWorkflow);
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <WorkflowCanvas 
        initialWorkflow={workflow} 
        onSave={handleSave} 
      />
    </div>
  );
};

export default WorkflowPage; 