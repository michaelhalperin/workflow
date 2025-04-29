import { useState } from 'react';
import WorkflowListPage from './pages/workflow/WorkflowListPage';
import WorkflowPage from './pages/workflow/WorkflowPage';
import { Workflow } from './types/workflow';
import useWorkflowStorage from './hooks/workflow/useWorkflowStorage';

// Define possible page states
type AppPage = 'list' | 'edit';

function App() {
  // State for navigation
  const [currentPage, setCurrentPage] = useState<AppPage>('list');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  
  // Get workflow storage hooks
  const { saveWorkflow } = useWorkflowStorage();

  // Navigate to workflow editor with a specific workflow
  const handleSelectWorkflow = (workflowId: string) => {
    setCurrentWorkflowId(workflowId);
    setCurrentPage('edit');
  };

  // Create a new workflow
  const handleCreateWorkflow = () => {
    // We don't need to create a workflow here - it will be created
    // when the first save happens in the editor
    setCurrentWorkflowId(null);
    setCurrentPage('edit');
  };

  // Return to workflow list
  const handleBackToList = () => {
    setCurrentPage('list');
  };

  return (
    <div className="h-screen flex flex-col">
      {currentPage === 'list' ? (
        <WorkflowListPage 
          onSelectWorkflow={handleSelectWorkflow}
          onCreateWorkflow={handleCreateWorkflow}
        />
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-3 bg-white border-b border-neutral-200 flex items-center shadow-sm">
            <button 
              onClick={handleBackToList}
              className="mr-4 text-neutral-600 hover:text-neutral-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h1 className="text-lg font-medium">
              {currentWorkflowId ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
          </div>
          <WorkflowPage workflowId={currentWorkflowId || undefined} />
        </div>
      )}
    </div>
  );
}

export default App; 