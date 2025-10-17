/**
 * RequestsPage Component
 * Manage requests for cookie-based monitoring
 */

import React, { useState, useMemo } from 'react';
import { SearchBar } from '@components/molecules/SearchBar/SearchBar';
import { RequestCard, Request } from '@components/organisms/RequestCard/RequestCard';
import { RequestForm, RequestFormData } from '@components/organisms/RequestForm/RequestForm';
import { Spinner } from '@components/atoms/Spinner/Spinner';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { Button } from '@components/atoms/Button/Button';
import { AlertModal, ConfirmModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { useRequests, useDeleteRequest, useCreateRequest, useUpdateRequest, useExecuteRequest } from '@hooks/useRequests';
import './RequestsPage.css';

export const RequestsPage: React.FC = () => {
  const { data: requests, isLoading, error } = useRequests();
  const deleteRequest = useDeleteRequest();
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();
  const executeRequest = useExecuteRequest();
  const { showAlert, showConfirm, hideAlert, hideConfirm, handleConfirm, alertModal, confirmModal } = useModal();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((req) =>
      req.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  const handleCreateNew = () => {
    setEditingRequest(null);
    setShowForm(true);
  };

  const handleEdit = (request: Request) => {
    setEditingRequest(request);
    setShowForm(true);
  };

  const handleDelete = async (request: Request) => {
    showConfirm(
      {
        title: 'Delete Request',
        message: `Are you sure you want to delete "${request.name}"? This action cannot be undone.`,
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      },
      async () => {
        try {
          await deleteRequest.mutateAsync(request.id);
        } catch (error) {
          console.error('Error deleting request:', error);
          showAlert({
            title: 'Error',
            message: 'Failed to delete request',
            type: 'error'
          });
        }
      }
    );
  };

  const handleExecute = async (request: Request) => {
    try {
      const result = await executeRequest.mutateAsync(request.id);
      showAlert({
        title: 'Success',
        message: result.message || `Executed "${request.name}" successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error executing request:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to execute request',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (data: RequestFormData) => {
    try {
      // Parse headers - must be valid JSON
      let headers = {};
      if (data.headers && data.headers.trim()) {
        try {
          headers = JSON.parse(data.headers);
        } catch (e) {
          console.error('Error parsing headers:', e);
          showAlert({
            title: 'Error',
            message: 'Headers must be valid JSON. Example: {"Content-Type": "application/json"}',
            type: 'error'
          });
          return;
        }
      }

      // Parse body - try JSON first, if fails keep as string (for form data, plain text, etc.)
      let body = undefined;
      if (data.body && data.body.trim()) {
        try {
          body = JSON.parse(data.body);
        } catch (e) {
          // Not JSON, use as plain string (for form-urlencoded, plain text, etc.)
          body = data.body;
        }
      }

      const requestData = {
        url: data.url,
        method: data.method,
        headers: headers,
        body: body,
      };

      const payload = {
        name: data.name,
        request_data: JSON.stringify(requestData),
        save_cookies: data.save_cookies,
        watch_interval: data.watch_interval,
        is_active: data.is_active,
      };

      console.log('Submitting payload:', payload);

      if (editingRequest) {
        await updateRequest.mutateAsync({ id: editingRequest.id, data: payload });
      } else {
        await createRequest.mutateAsync(payload);
      }
      setShowForm(false);
      setEditingRequest(null);
    } catch (error: any) {
      console.error('Error saving request:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to save request';
      showAlert({
        title: 'Error',
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingRequest(null);
  };

  if (isLoading) {
    return (
      <div className="requests-loading">
        <Spinner size="xl" />
        <p>Loading requests...</p>
      </div>
    );
  }

  if (showForm) {
    const initialData = editingRequest ? (() => {
      const requestData = JSON.parse(editingRequest.request_data);
      return {
        name: editingRequest.name,
        url: requestData.url || '',
        method: requestData.method || 'POST',
        headers: JSON.stringify(requestData.headers || {}, null, 2),
        body: requestData.body ? JSON.stringify(requestData.body, null, 2) : '',
        save_cookies: editingRequest.save_cookies,
        watch_interval: editingRequest.watch_interval,
        is_active: editingRequest.is_active,
      };
    })() : undefined;

    return (
      <div className="requests-page">
        <RequestForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  return (
    <div className="requests-page">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Requests</h1>
          <p className="requests-subtitle">
            Configure requests to retrieve cookies for monitoring
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Icon name="plus" size="sm" />
              Create Request
        </Button>
      </div>

      <div className="requests-controls">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search requests by name..."
          fullWidth
        />
      </div>

      <div className="requests-content">
        {filteredRequests.length > 0 ? (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onExecute={handleExecute}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="requests-empty">
            <Icon name="settings" size="xl" />
            <h3>No requests found</h3>
            <p>
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create a request to get started!'}
            </p>
            <Button onClick={handleCreateNew}>
              <Icon name="plus" size="sm" />
              Create Request
            </Button>
          </Card>
        )}
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        type={confirmModal.options.type}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};
