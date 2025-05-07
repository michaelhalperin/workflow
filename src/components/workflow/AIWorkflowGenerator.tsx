import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';

interface AIWorkflowGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (workflowData: any) => void;
  apiToken: string;
}

const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({
  isOpen,
  onClose,
  onGenerate,
  apiToken,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the workflow you want to create');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a workflow generation assistant. Generate a workflow based on the user's request.
              The workflow should be returned as a JSON object with the following structure:
              {
                "title": "string",
                "nodes": [
                  {
                    "id": "string",
                    "type": "task|decision|start|end|data|process|io",
                    "position": { "x": number, "y": number },
                    "data": {
                      "label": "string",
                      "description": "string"
                    }
                  }
                ],
                "edges": [
                  {
                    "id": "string",
                    "source": "string",
                    "target": "string",
                    "label": "string"
                  }
                ]
              }
              
              CRITICAL POSITIONING RULES:
              1. Node Layout:
                 - Start node: x: 100, y: 300
                 - End node: x: 800, y: 300
                 - For N middle nodes, position them evenly:
                   * x = 100 + (700 * (i + 1) / (N + 1))
                   * y = 300 (for main flow)
                   * y = 200 (for upper branches)
                   * y = 400 (for lower branches)
                 
              2. Node Sequence:
                 - First node must be type: "start" with id: "start"
                 - Last node must be type: "end" with id: "end"
                 - Middle nodes must be numbered sequentially: "node1", "node2", etc.
                 - Each node must connect to the next in sequence
                 - Decision nodes can branch to multiple nodes
                 
              3. Node Types:
                 - "start": Beginning of workflow
                 - "end": End of workflow
                 - "task": Simple process steps
                 - "decision": Branching logic (if/else)
                 - "data": Data operations
                 - "process": Complex operations
                 - "io": External interactions
                 
              4. Edge Rules:
                 - Each edge must have a clear label
                 - Decision edges must be labeled with conditions
                 - Edges must follow left-to-right flow
                 - No backward connections
                 - No disconnected nodes
                 
              Example positioning for 3 middle nodes:
              {
                "nodes": [
                  {"id": "start", "type": "start", "position": {"x": 100, "y": 300}},
                  {"id": "node1", "type": "task", "position": {"x": 275, "y": 300}},
                  {"id": "node2", "type": "decision", "position": {"x": 450, "y": 300}},
                  {"id": "node3", "type": "task", "position": {"x": 625, "y": 300}},
                  {"id": "end", "type": "end", "position": {"x": 800, "y": 300}}
                ]
              }`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();
      const workflowData = JSON.parse(data.choices[0].message.content);
      onGenerate(workflowData);
      onClose();
    } catch (err) {
      setError('Failed to generate workflow. Please try again.');
      console.error('Error generating workflow:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Workflow with AI">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Describe the workflow you want to create. The AI will generate a complete workflow with nodes and connections.
        </p>
        
        <TextArea
          label="Workflow Description"
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (e.target.value.trim()) setError('');
          }}
          placeholder="Example: Create a workflow for processing customer orders, including validation, payment processing, and shipping"
          rows={6}
          error={error}
          fullWidth
        />

        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Workflow'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AIWorkflowGenerator; 