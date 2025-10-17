/**
 * RequestCard Organism Component
 * Displays request information with actions
 */

import React from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { Button } from '@components/atoms/Button/Button';
import { Request } from '@types/request';
import './RequestCard.css';

// Re-export Request type for convenience
export type { Request } from '@types/request';

export interface RequestCardProps {
  request: Request;
  onExecute?: (request: Request) => void;
  onEdit?: (request: Request) => void;
  onDelete?: (request: Request) => void;
  onClick?: (request: Request) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onExecute,
  onEdit,
  onDelete,
  onClick,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRequestInfo = () => {
    try {
      const data = JSON.parse(request.request_data);
      return {
        url: data.url || 'No URL',
        method: data.method || 'GET',
      };
    } catch {
      return { url: 'Invalid data', method: 'N/A' };
    }
  };

  const requestInfo = getRequestInfo();

  const handleCardClick = () => {
    if (onClick) onClick(request);
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card variant="elevated" padding="md" className="request-card" onClick={handleCardClick}>
      <div className="request-card-header">
        <div className="request-card-title-section">
          <div className="request-card-icon">
            <Icon name="settings" size="md" />
          </div>
          <div>
            <h3 className="request-card-title">{request.name}</h3>
            <div className="request-card-url">
              <Icon name="monitor" size="xs" />
              <span className="text-ellipsis">{requestInfo.url}</span>
            </div>
          </div>
        </div>

        <div className="request-card-actions" onClick={stopPropagation}>
          {onExecute && (
            <Button
              size="sm"
              onClick={() => onExecute(request)}
              title="Execute request"
            >
              <Icon name="refresh" size="sm" />
              Execute
            </Button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(request)}
              className="request-card-action"
              title="Edit"
            >
              <Icon name="edit" size="sm" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(request)}
              className="request-card-action request-card-action-danger"
              title="Delete"
            >
              <Icon name="trash" size="sm" />
            </button>
          )}
        </div>
      </div>

      <div className="request-card-body">
        <div className="request-card-badges">
          <Badge variant={request.is_active ? 'success' : 'gray'} size="sm">
            <Icon name={request.is_active ? 'check' : 'x'} size="xs" />
            {request.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="primary" size="sm">
            {requestInfo.method}
          </Badge>
          {request.save_cookies && (
            <Badge variant="warning" size="sm">
              <Icon name="settings" size="xs" />
              Saves Cookies
            </Badge>
          )}
          {request.watch_interval && (
            <Badge variant="gray" size="sm">
              <Icon name="clock" size="xs" />
              {request.watch_interval}s
            </Badge>
          )}
        </div>
      </div>

      <div className="request-card-footer">
        <div className="request-card-timestamp">
          <Icon name="calendar" size="xs" />
          <span>Created: {formatDate(request.created_at)}</span>
        </div>
        {request.last_executed_at && (
          <div className="request-card-timestamp request-card-executed">
            <Icon name="refresh" size="xs" />
            <span>Last run: {formatDate(request.last_executed_at)}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
