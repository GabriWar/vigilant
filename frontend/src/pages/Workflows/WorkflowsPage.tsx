import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { Card } from '@components/atoms/Card/Card';
import { ConfirmModal } from '@components/molecules/ConfirmModal/ConfirmModal';
import { workflowsApi, Workflow } from '@services/api/workflows';
import './WorkflowsPage.css';

export const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<number | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);

  // Fetch workflows
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.getAll(),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: workflowsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setDeleteWorkflowId(null);
    },
  });

  // Execute mutation
  const executeMutation = useMutation({
    mutationFn: (id: number) => workflowsApi.execute(id),
    onSuccess: (_, id) => {
      alert('Workflow executed successfully!');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setExecutingId(null);
    },
    onError: () => {
      alert('Failed to execute workflow');
      setExecutingId(null);
    },
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'partial':
        return <Badge variant="warning">Partial</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      default:
        return <Badge variant="secondary">Never Run</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="workflows-loading">
        <Icon name="loader" size="lg" />
        <p>Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="workflows-page">
      <div className="workflows-header">
        <div>
          <h1 className="workflows-title">Workflows</h1>
          <p className="workflows-subtitle">
            Chain requests with dynamic variables
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/workflows/create')}>
          <Icon name="plus" size="sm" />
          Create Workflow
        </Button>
      </div>

      <div className="workflows-stats">
        <div className="workflows-stat">
          <Icon name="workflow" size="sm" />
          <span>{workflows?.length || 0} Total</span>
        </div>
        <div className="workflows-stat">
          <Icon name="check-circle" size="sm" />
          <span>
            {workflows?.filter((w) => w.is_active).length || 0} Active
          </span>
        </div>
      </div>

        {!workflows || workflows.length === 0 ? (
          <Card>
            <div className="workflows-empty">
              <Icon name="workflow" size="xl" />
              <h3>No workflows yet</h3>
              <p>Create your first workflow to chain requests with variables</p>
              <Button variant="primary" onClick={() => navigate('/workflows/create')}>
                <Icon name="plus" size="sm" />
                Create Workflow
              </Button>
            </div>
          </Card>
        ) : (
          <div className="workflows-grid">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="workflow-card">
                <div className="workflow-card-header">
                  <div className="workflow-card-title">
                    <h3>{workflow.name}</h3>
                    {!workflow.is_active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <div className="workflow-card-actions">
                    <button
                      className="workflow-action-btn"
                      onClick={() => {
                        setExecutingId(workflow.id);
                        executeMutation.mutate(workflow.id);
                      }}
                      disabled={executingId === workflow.id}
                      title="Execute workflow"
                    >
                      <Icon
                        name={executingId === workflow.id ? 'loader' : 'play'}
                        size="sm"
                      />
                    </button>
                    <button
                      className="workflow-action-btn"
                      onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                      title="Edit workflow"
                    >
                      <Icon name="edit" size="sm" />
                    </button>
                    <button
                      className="workflow-action-btn workflow-action-btn-danger"
                      onClick={() => setDeleteWorkflowId(workflow.id)}
                      title="Delete workflow"
                    >
                      <Icon name="trash" size="sm" />
                    </button>
                  </div>
                </div>

                {workflow.description && (
                  <p className="workflow-card-description">{workflow.description}</p>
                )}

                <div className="workflow-card-info">
                  <div className="workflow-info-item">
                    <Icon name="list" size="sm" />
                    <span>{workflow.steps?.length || 0} steps</span>
                  </div>
                  {workflow.schedule_enabled && (
                    <div className="workflow-info-item">
                      <Icon name="clock" size="sm" />
                      <span>Every {workflow.schedule_interval}s</span>
                    </div>
                  )}
                </div>

                <div className="workflow-card-stats">
                  <div className="workflow-stat-item">
                    <span className="workflow-stat-label">Executions</span>
                    <span className="workflow-stat-value">{workflow.execution_count}</span>
                  </div>
                  <div className="workflow-stat-item">
                    <span className="workflow-stat-label">Success</span>
                    <span className="workflow-stat-value workflow-stat-success">
                      {workflow.success_count}
                    </span>
                  </div>
                  <div className="workflow-stat-item">
                    <span className="workflow-stat-label">Failed</span>
                    <span className="workflow-stat-value workflow-stat-error">
                      {workflow.failure_count}
                    </span>
                  </div>
                </div>

                {workflow.last_executed_at && (
                  <div className="workflow-card-footer">
                    <div className="workflow-last-execution">
                      <span className="workflow-last-execution-label">Last Run:</span>
                      <span className="workflow-last-execution-time">
                        {new Date(workflow.last_executed_at).toLocaleString()}
                      </span>
                      {getStatusBadge(workflow.last_execution_status)}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      <ConfirmModal
        isOpen={deleteWorkflowId !== null}
        onClose={() => setDeleteWorkflowId(null)}
        onConfirm={() => deleteWorkflowId && deleteMutation.mutate(deleteWorkflowId)}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
