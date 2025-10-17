import React, { useState, useEffect } from 'react';
import { WatcherCreate, WatcherUpdate, ExecutionMode, ContentType } from '@/types/watcher';
import { Card } from '@components/atoms/Card/Card';
import { Input } from '@components/atoms/Input/Input';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { ExecutionModeBadge } from '@components/atoms/ExecutionModeBadge';
import { useWatchers } from '@/hooks/useWatchers';
import './WatcherForm.css';

export interface WatcherFormData {
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  content_type: ContentType;
  execution_mode: ExecutionMode;
  watch_interval?: number;
  is_active: boolean;
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_watcher_id?: number;
  comparison_mode: string;
}

export interface WatcherFormProps {
  initialData?: Partial<WatcherFormData>;
  onSubmit: (data: WatcherFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export const WatcherForm: React.FC<WatcherFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<WatcherFormData>({
    name: initialData?.name || '',
    url: initialData?.url || '',
    method: initialData?.method || 'GET',
    headers: initialData?.headers || '{\n  "User-Agent": "Vigilant/2.0"\n}',
    body: initialData?.body || '',
    content_type: initialData?.content_type || ContentType.AUTO,
    execution_mode: initialData?.execution_mode || ExecutionMode.SCHEDULED,
    watch_interval: initialData?.watch_interval || 300,
    is_active: initialData?.is_active ?? true,
    save_cookies: initialData?.save_cookies ?? false,
    use_cookies: initialData?.use_cookies ?? false,
    cookie_watcher_id: initialData?.cookie_watcher_id,
    comparison_mode: initialData?.comparison_mode || 'hash'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState(false);

  // Get available watchers for cookie selection
  const { data: watchers } = useWatchers({ limit: 100 });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (formData.execution_mode === ExecutionMode.SCHEDULED || formData.execution_mode === ExecutionMode.BOTH) {
      if (!formData.watch_interval || formData.watch_interval < 30) {
        newErrors.watch_interval = 'Watch interval must be at least 30 seconds';
      }
    }

    if (formData.use_cookies && !formData.cookie_watcher_id) {
      newErrors.cookie_watcher_id = 'Please select a watcher to use cookies from';
    }

    try {
      if (formData.headers.trim()) {
        JSON.parse(formData.headers);
      }
    } catch {
      newErrors.headers = 'Headers must be valid JSON';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleTest = async () => {
    if (!validateForm()) return;
    
    setIsTesting(true);
    try {
      // Test the watcher configuration
      const testData = {
        url: formData.url,
        method: formData.method,
        headers: formData.headers ? JSON.parse(formData.headers) : {},
        body: formData.body || undefined
      };

      const response = await fetch('/api/test/ping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Test successful! Configuration is valid.');
      } else {
        alert('Test failed. Please check your configuration.');
      }
    } catch (error) {
      alert('Test failed: ' + (error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  const updateFormData = (field: keyof WatcherFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="watcher-form">
      <div className="watcher-form-header">
        <h2>{mode === 'create' ? 'Create New Watcher' : 'Edit Watcher'}</h2>
        <ExecutionModeBadge mode={formData.execution_mode} />
      </div>

      <form onSubmit={handleSubmit} className="watcher-form-content">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>
          
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter watcher name"
              error={errors.name}
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">URL *</label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => updateFormData('url', e.target.value)}
              placeholder="https://example.com/api/endpoint"
              error={errors.url}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="method">Method</label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) => updateFormData('method', e.target.value)}
                className="form-select"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content_type">Content Type</label>
              <select
                id="content_type"
                value={formData.content_type}
                onChange={(e) => updateFormData('content_type', e.target.value as ContentType)}
                className="form-select"
              >
                <option value={ContentType.AUTO}>Auto Detect</option>
                <option value={ContentType.TEXT}>Text</option>
                <option value={ContentType.JSON}>JSON</option>
                <option value={ContentType.HTML}>HTML</option>
                <option value={ContentType.XML}>XML</option>
                <option value={ContentType.IMAGE}>Image</option>
                <option value={ContentType.PDF}>PDF</option>
              </select>
            </div>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="form-section">
          <h3>Execution Settings</h3>
          
          <div className="form-group">
            <label htmlFor="execution_mode">Execution Mode</label>
            <select
              id="execution_mode"
              value={formData.execution_mode}
              onChange={(e) => updateFormData('execution_mode', e.target.value as ExecutionMode)}
              className="form-select"
            >
              <option value={ExecutionMode.SCHEDULED}>Scheduled Only</option>
              <option value={ExecutionMode.MANUAL}>Manual Only</option>
              <option value={ExecutionMode.BOTH}>Both Scheduled & Manual</option>
            </select>
          </div>

          {(formData.execution_mode === ExecutionMode.SCHEDULED || formData.execution_mode === ExecutionMode.BOTH) && (
            <div className="form-group">
              <label htmlFor="watch_interval">Watch Interval (seconds) *</label>
              <Input
                id="watch_interval"
                type="number"
                value={formData.watch_interval || ''}
                onChange={(e) => updateFormData('watch_interval', parseInt(e.target.value) || undefined)}
                placeholder="300"
                min="30"
                error={errors.watch_interval}
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateFormData('is_active', e.target.checked)}
              />
              <span>Active</span>
            </label>
          </div>
        </div>

        {/* HTTP Configuration */}
        <div className="form-section">
          <h3>HTTP Configuration</h3>
          
          <div className="form-group">
            <label htmlFor="headers">Headers (JSON)</label>
            <textarea
              id="headers"
              value={formData.headers}
              onChange={(e) => updateFormData('headers', e.target.value)}
              placeholder='{\n  "User-Agent": "Vigilant/2.0",\n  "Authorization": "Bearer token"\n}'
              className="form-textarea"
              rows={4}
            />
            {errors.headers && <span className="error-text">{errors.headers}</span>}
          </div>

          {(formData.method === 'POST' || formData.method === 'PUT' || formData.method === 'PATCH') && (
            <div className="form-group">
              <label htmlFor="body">Request Body</label>
              <textarea
                id="body"
                value={formData.body}
                onChange={(e) => updateFormData('body', e.target.value)}
                placeholder="Request body content"
                className="form-textarea"
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Cookie Settings */}
        <div className="form-section">
          <h3>Cookie Settings</h3>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.save_cookies}
                onChange={(e) => updateFormData('save_cookies', e.target.checked)}
              />
              <span>Save cookies from response</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.use_cookies}
                onChange={(e) => updateFormData('use_cookies', e.target.checked)}
              />
              <span>Use cookies from another watcher</span>
            </label>
          </div>

          {formData.use_cookies && (
            <div className="form-group">
              <label htmlFor="cookie_watcher_id">Cookie Source Watcher</label>
              <select
                id="cookie_watcher_id"
                value={formData.cookie_watcher_id || ''}
                onChange={(e) => updateFormData('cookie_watcher_id', parseInt(e.target.value) || undefined)}
                className="form-select"
              >
                <option value="">Select a watcher</option>
                {watchers?.map(watcher => (
                  <option key={watcher.id} value={watcher.id}>
                    {watcher.name}
                  </option>
                ))}
              </select>
              {errors.cookie_watcher_id && <span className="error-text">{errors.cookie_watcher_id}</span>}
            </div>
          )}
        </div>

        {/* Change Detection */}
        <div className="form-section">
          <h3>Change Detection</h3>
          
          <div className="form-group">
            <label htmlFor="comparison_mode">Comparison Mode</label>
            <select
              id="comparison_mode"
              value={formData.comparison_mode}
              onChange={(e) => updateFormData('comparison_mode', e.target.value)}
              className="form-select"
            >
              <option value="hash">Hash Comparison</option>
              <option value="content_aware">Content Aware</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || isLoading}
          >
            <Icon name="play" />
            {isTesting ? 'Testing...' : 'Test Configuration'}
          </Button>

          <div className="form-actions-right">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
            >
              <Icon name="save" />
              {isLoading ? 'Saving...' : (mode === 'create' ? 'Create Watcher' : 'Update Watcher')}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};
