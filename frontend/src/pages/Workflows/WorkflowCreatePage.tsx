import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { Card } from '@components/atoms/Card/Card';
import { Badge } from '@components/atoms/Badge/Badge';
import { workflowsApi } from '@services/api/workflows';
import { requestApi } from '@services/api/requests';
import { ROUTES } from '@constants/routes';
import './WorkflowCreatePage.css';

interface WorkflowStep {
  order: number;
  request_id: number;
  continue_on_error: boolean;
  extract_variables: string[];
}

export const WorkflowCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [showAddStep, setShowAddStep] = useState(false);

  // Fetch requests for step selection
  const { data: requests } = useQuery({
    queryKey: ['requests'],
    queryFn: () => requestApi.getAll(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => workflowsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(ROUTES.WORKFLOWS);
    },
  });

  const handleAddStep = (requestId: number) => {
    const newStep: WorkflowStep = {
      order: steps.length + 1,
      request_id: requestId,
      continue_on_error: false,
      extract_variables: [],
    };
    setSteps([...steps, newStep]);
    setShowAddStep(false);
  };

  const handleRemoveStep = (order: number) => {
    const updatedSteps = steps
      .filter(s => s.order !== order)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    setSteps(updatedSteps);
  };

  const handleMoveStep = (order: number, direction: 'up' | 'down') => {
    const currentIndex = steps.findIndex(s => s.order === order);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === steps.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newSteps = [...steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];

    const reorderedSteps = newSteps.map((step, idx) => ({
      ...step,
      order: idx + 1,
    }));

    setSteps(reorderedSteps);
  };

  const handleToggleContinueOnError = (order: number) => {
    setSteps(steps.map(s =>
      s.order === order ? { ...s, continue_on_error: !s.continue_on_error } : s
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
        steps: steps,
        schedule_enabled: false,
        schedule_interval: null,
      });
    } catch (error) {
      console.error('Failed to create workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const getRequestName = (id: number) => {
    return requests?.find(ar => ar.id === id)?.name || `Request #${id}`;
  };

  return (
    <div className="workflow-create-page">
      <div className="workflow-create-header">
        <div>
          <h1 className="workflow-create-title">Create Workflow</h1>
          <p className="workflow-create-subtitle">
            Chain requests with dynamic variables
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate(ROUTES.WORKFLOWS)}>
          <Icon name="arrow-left" size="sm" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="workflow-create-form">
        <Card>
          <div className="workflow-form-section">
            <h3 className="workflow-section-title">Basic Information</h3>

            <div className="workflow-form-group">
              <label htmlFor="name" className="workflow-form-label">
                Name <span className="workflow-form-required">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="workflow-form-input"
                placeholder="e.g., Login and Fetch User Data"
                required
              />
            </div>

            <div className="workflow-form-group">
              <label htmlFor="description" className="workflow-form-label">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="workflow-form-textarea"
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>

            <div className="workflow-form-group">
              <label className="workflow-form-checkbox">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active (workflow can be executed)</span>
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <div className="workflow-form-section">
            <div className="workflow-section-header">
              <h3 className="workflow-section-title">
                Workflow Steps ({steps.length})
              </h3>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowAddStep(true)}
              >
                <Icon name="plus" size="sm" />
                Add Step
              </Button>
            </div>

            {steps.length === 0 && !showAddStep && (
              <div className="workflow-steps-empty">
                <Icon name="list" size="lg" />
                <p>No steps added yet</p>
                <p className="workflow-steps-empty-hint">
                  Click "Add Step" to start building your workflow
                </p>
              </div>
            )}

            {showAddStep && (
              <Card className="workflow-add-step-card">
                <div className="workflow-add-step-header">
                  <h4>Select Request</h4>
                  <button
                    type="button"
                    className="workflow-close-btn"
                    onClick={() => setShowAddStep(false)}
                  >
                    <Icon name="x" size="sm" />
                  </button>
                </div>
                <div className="workflow-request-list">
                  {requests && requests.length > 0 ? (
                    requests.map((authReq) => (
                      <button
                        key={authReq.id}
                        type="button"
                        className="workflow-request-item"
                        onClick={() => handleAddStep(authReq.id)}
                      >
                        <div className="workflow-request-info">
                          <Icon name="settings" size="sm" />
                          <div>
                            <div className="workflow-request-name">{authReq.name}</div>
                            <div className="workflow-request-meta">
                              ID: {authReq.id}
                              {authReq.is_active && (
                                <Badge variant="success" size="sm">Active</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Icon name="plus" size="sm" />
                      </button>
                    ))
                  ) : (
                    <p className="workflow-no-requests">
                      No requests available. Create one first.
                    </p>
                  )}
                </div>
              </Card>
            )}

            <div className="workflow-steps-list">
              {steps.map((step, index) => (
                <Card key={step.order} className="workflow-step-card">
                  <div className="workflow-step-header">
                    <div className="workflow-step-order">
                      <Badge variant="secondary">Step {step.order}</Badge>
                    </div>
                    <div className="workflow-step-actions">
                      <button
                        type="button"
                        className="workflow-step-action-btn"
                        onClick={() => handleMoveStep(step.order, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <Icon name="arrow-up" size="sm" />
                      </button>
                      <button
                        type="button"
                        className="workflow-step-action-btn"
                        onClick={() => handleMoveStep(step.order, 'down')}
                        disabled={index === steps.length - 1}
                        title="Move down"
                      >
                        <Icon name="arrow-down" size="sm" />
                      </button>
                      <button
                        type="button"
                        className="workflow-step-action-btn workflow-step-action-btn-danger"
                        onClick={() => handleRemoveStep(step.order)}
                        title="Remove step"
                      >
                        <Icon name="trash" size="sm" />
                      </button>
                    </div>
                  </div>

                  <div className="workflow-step-content">
                    <div className="workflow-step-request">
                      <Icon name="settings" size="sm" />
                      <span className="workflow-step-request-name">
                        {getRequestName(step.request_id)}
                      </span>
                    </div>

                    <label className="workflow-form-checkbox">
                      <input
                        type="checkbox"
                        checked={step.continue_on_error}
                        onChange={() => handleToggleContinueOnError(step.order)}
                      />
                      <span>Continue workflow even if this step fails</span>
                    </label>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>

        <div className="workflow-form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(ROUTES.WORKFLOWS)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Icon name="loader" size="sm" />
                Creating...
              </>
            ) : (
              <>
                <Icon name="check" size="sm" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
