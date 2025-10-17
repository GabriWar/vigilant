import React, { useState } from 'react';
import { Modal } from '@components/atoms/Modal/Modal';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { Header, HeaderCreate, HeaderUpdate } from '@services/api/headers';
import { useCreateHeader, useUpdateHeader, useDeleteHeader } from '@hooks/useHeaders';

interface HeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  header?: Header | null;
  mode: 'create' | 'edit';
}

export const HeaderModal: React.FC<HeaderModalProps> = ({
  isOpen,
  onClose,
  header,
  mode
}) => {
  const [formData, setFormData] = useState({
    name: header?.name || '',
    value: header?.value || '',
    description: header?.description || '',
    is_active: header?.is_active ?? true,
  });

  const createHeader = useCreateHeader();
  const updateHeader = useUpdateHeader();
  const deleteHeader = useDeleteHeader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'create') {
        await createHeader.mutateAsync(formData);
      } else if (header) {
        await updateHeader.mutateAsync({ id: header.id, data: formData });
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving header:', error);
    }
  };

  const handleDelete = async () => {
    if (!header) return;
    
    if (window.confirm('Are you sure you want to delete this header?')) {
      try {
        await deleteHeader.mutateAsync(header.id);
        onClose();
        resetForm();
      } catch (error) {
        console.error('Error deleting header:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      description: '',
      is_active: true,
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="header-modal">
        <div className="header-modal-header">
          <h2 className="header-modal-title">
            {mode === 'create' ? 'Create Header' : 'Edit Header'}
          </h2>
          <Button variant="secondary" onClick={handleClose}>
            <Icon name="x" size="sm" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="header-modal-form">
          <div className="header-modal-field">
            <label className="header-modal-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="header-modal-input"
              placeholder="e.g., User-Agent"
            />
          </div>

          <div className="header-modal-field">
            <label className="header-modal-label">Value</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              className="header-modal-textarea"
              placeholder="e.g., Mozilla/5.0..."
              rows={3}
            />
          </div>

          <div className="header-modal-field">
            <label className="header-modal-label">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="header-modal-input"
              placeholder="Brief description of this header"
            />
          </div>

          <div className="header-modal-field">
            <label className="header-modal-checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="header-modal-checkbox"
              />
              <span className="header-modal-checkbox-text">Active</span>
            </label>
          </div>

          <div className="header-modal-actions">
            <Button type="submit" disabled={createHeader.isPending || updateHeader.isPending}>
              <Icon name="save" size="sm" />
              {createHeader.isPending || updateHeader.isPending ? 'Saving...' : 'Save'}
            </Button>
            
            {mode === 'edit' && (
              <Button 
                type="button" 
                variant="danger" 
                onClick={handleDelete}
                disabled={deleteHeader.isPending}
              >
                <Icon name="trash" size="sm" />
                {deleteHeader.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

