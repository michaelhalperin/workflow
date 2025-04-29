import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TextField from '../../components/ui/TextField';
import useWorkflowStorage from '../../hooks/workflow/useWorkflowStorage';

interface WorkflowListPageProps {
  onSelectWorkflow: (workflowId: string) => void;
  onCreateWorkflow: () => void;
}

const WorkflowListPage: React.FC<WorkflowListPageProps> = ({ 
  onSelectWorkflow,
  onCreateWorkflow
}) => {
  const { workflowsList, deleteWorkflow } = useWorkflowStorage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState('');
  const [error, setError] = useState('');

  // Handle workflow creation
  const handleCreateWorkflow = () => {
    if (!newWorkflowTitle.trim()) {
      setError('Workflow title is required');
      return;
    }
    
    // Close modal
    setIsCreateModalOpen(false);
    setNewWorkflowTitle('');
    setError('');
    
    // Trigger workflow creation
    onCreateWorkflow();
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold text-neutral-900">Visual Workflow Builder</h1>
        <p className="text-lg text-neutral-600">
          Create, visualize, and manage your workflows with our interactive builder
        </p>
      </header>

      {/* Create workflow button */}
      <div className="mb-8 flex justify-center">
        <Button 
          size="lg" 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8"
        >
          Create New Workflow
        </Button>
      </div>

      {/* Workflows list */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-xl font-medium text-neutral-800">Your Workflows</h2>
        
        {workflowsList.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
            <p className="mb-3 text-neutral-600">You haven't created any workflows yet</p>
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>Create your first workflow</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflowsList.map(workflow => (
              <div 
                key={workflow.id} 
                onClick={() => onSelectWorkflow(workflow.id)}
                className="flex cursor-pointer flex-col justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <h3 className="mb-1 text-base font-medium text-neutral-800">{workflow.title}</h3>
                  <p className="text-xs text-neutral-500">
                    Updated: {new Date(workflow.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this workflow?')) {
                        deleteWorkflow(workflow.id);
                      }
                    }}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Create workflow modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workflow"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateWorkflow(); }}>
          <TextField
            label="Workflow Title"
            value={newWorkflowTitle}
            onChange={(e) => {
              setNewWorkflowTitle(e.target.value);
              if (e.target.value.trim()) setError('');
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
            <Button type="submit">
              Create Workflow
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkflowListPage; 