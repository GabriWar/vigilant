/**
 * MonitorForm Organism Component
 * Form for creating/editing monitors
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Input } from '@components/atoms/Input/Input';
import { Button } from '@components/atoms/Button/Button';
import { Icon } from '@components/atoms/Icon/Icon';
import { TestResultModal } from '@components/molecules';
import { useTestRequest } from '@hooks/useTestRequest';
import { useAllCookies } from '@hooks/useCookies';
import { parseFetchCode, ParsedFetchData } from '@utils/fetchParser';
import './MonitorForm.css';

export interface MonitorFormData {
  name: string;
  url: string;
  monitor_type: 'webpage' | 'api';
  method: string;
  headers: string;
  body: string;
  save_cookies: boolean;
  use_cookies: boolean;
  cookie_request_id?: number;
  watch_interval: number;
  is_active: boolean;
}

export interface MonitorFormProps {
  initialData?: Partial<MonitorFormData>;
  onSubmit: (data: MonitorFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const MonitorForm: React.FC<MonitorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<MonitorFormData>({
    name: initialData?.name || '',
    url: initialData?.url || '',
    monitor_type: initialData?.monitor_type || 'webpage',
    method: initialData?.method || 'GET',
    headers: initialData?.headers || '{\n  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"\n}',
    body: initialData?.body || '',
    save_cookies: initialData?.save_cookies ?? false,
    use_cookies: initialData?.use_cookies ?? false,
    cookie_request_id: initialData?.cookie_request_id,
    watch_interval: initialData?.watch_interval || 60,
    is_active: initialData?.is_active ?? true,
  });

  const [useFetchCode, setUseFetchCode] = useState(false);
  const [fetchCode, setFetchCode] = useState('');
  const [parsedData, setParsedData] = useState<ParsedFetchData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof MonitorFormData, string>>>({});
  const [showTestResult, setShowTestResult] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const testRequest = useTestRequest();
  const { data: allCookies } = useAllCookies();

  // Função para parsear o fetch code
  const handleFetchCodeChange = (code: string) => {
    setFetchCode(code);
    setParseError(null);
    
    if (code.trim()) {
      const result = parseFetchCode(code);
      if (result.success && result.data) {
        setParsedData(result.data);
        // Preencher automaticamente os campos do formulário
        setFormData(prev => ({
          ...prev,
          url: result.data!.url,
          method: result.data!.method,
          headers: JSON.stringify(result.data!.headers, null, 2),
          body: result.data!.body ? result.data!.body : prev.body
        }));
      } else {
        setParseError(result.error || 'Erro ao parsear código fetch');
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  };

  // Função para alternar entre modos
  const toggleInputMode = () => {
    setUseFetchCode(!useFetchCode);
    if (!useFetchCode) {
      // Limpar dados parseados quando voltar ao modo manual
      setParsedData(null);
      setParseError(null);
      setFetchCode('');
    }
  };

  // Update form data when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        url: initialData.url || '',
        monitor_type: initialData.monitor_type || 'webpage',
        method: initialData.method || 'GET',
        headers: initialData.headers || '{\n  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"\n}',
        body: initialData.body || '',
        save_cookies: initialData.save_cookies ?? false,
        use_cookies: initialData.use_cookies ?? false,
        cookie_request_id: initialData.cookie_request_id,
        watch_interval: initialData.watch_interval || 60,
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof MonitorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MonitorFormData, string>> = {};

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

    // Validate headers JSON
    if (formData.headers.trim()) {
      try {
        JSON.parse(formData.headers);
      } catch {
        newErrors.headers = 'Headers must be valid JSON';
      }
    }

    // Validate body JSON (if provided)
    if (formData.body.trim()) {
      try {
        JSON.parse(formData.body);
      } catch {
        // If it's not JSON, that's okay for body (could be form data, etc.)
      }
    }

    if (formData.watch_interval < 10) {
      newErrors.watch_interval = 'Watch interval must be at least 10 seconds';
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
    try {
      let testData;
      
      if (useFetchCode && parsedData) {
        // Usar dados parseados do fetch code
        testData = {
          url: parsedData.url,
          method: parsedData.method,
          headers: parsedData.headers,
          body: parsedData.body || undefined,
        };
      } else {
        // Usar dados do formulário manual
        testData = {
          url: formData.url,
          method: formData.method,
          headers: JSON.parse(formData.headers || '{}'),
          body: formData.body ? JSON.parse(formData.body) : undefined,
        };
      }

      // Adicionar cookies se use_cookies estiver ativado
      let cookiesToSend: Record<string, string> | undefined;
      if (formData.use_cookies && formData.cookie_request_id && allCookies) {
        // Buscar cookies da request selecionada
        const requestCookies = allCookies.filter(cookie => cookie.request_id === formData.cookie_request_id);
        if (requestCookies.length > 0) {
          cookiesToSend = {};
          requestCookies.forEach(cookie => {
            cookiesToSend![cookie.name] = cookie.value;
          });
        }
      }

      const result = await testRequest.mutateAsync({
        ...testData,
        cookies: cookiesToSend
      });
      setTestResult({
        ...result,
        requestData: {
          ...testData,
          cookies: cookiesToSend
        }
      });
      setShowTestResult(true);
    } catch (error: any) {
      setTestResult({
        error: error.error || error.message || 'Test failed',
        errorDetails: error.errorDetails,
        requestData: useFetchCode && parsedData ? {
          url: parsedData.url,
          method: parsedData.method,
          headers: parsedData.headers,
          body: parsedData.body || undefined,
        } : {
          url: formData.url,
          method: formData.method,
          headers: JSON.parse(formData.headers || '{}'),
          body: formData.body ? JSON.parse(formData.body) : undefined,
        },
        status: error.status,
        statusText: error.statusText
      });
      setShowTestResult(true);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="monitor-form">
      <form onSubmit={handleSubmit}>
        <div className="monitor-form-header">
          <h2>
            <Icon name="monitor" size="md" />
            {initialData ? 'Edit Monitor' : 'Create Monitor'}
          </h2>
          <p>Configure monitor to track website or API changes</p>
        </div>

        <div className="monitor-form-body">
          <Input
            label="Monitor Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Homepage Monitor"
            fullWidth
            required
          />

          {/* Toggle para alternar entre modo manual e fetch code */}
          <div className="monitor-form-toggle">
            <label className="monitor-form-toggle-label">
              <input
                type="checkbox"
                checked={useFetchCode}
                onChange={toggleInputMode}
                className="monitor-form-toggle-input"
              />
              <span className="monitor-form-toggle-text">
                <Icon name="settings" size="sm" />
                Use Fetch Code (paste DevTools fetch)
              </span>
            </label>
          </div>

          {useFetchCode ? (
            <div className="monitor-form-field">
              <label className="monitor-form-label">
                DevTools Fetch Code
                {parseError && <span className="monitor-form-error">{parseError}</span>}
                {parsedData && <span className="monitor-form-success">✓ Code parsed successfully</span>}
              </label>
              <textarea
                value={fetchCode}
                onChange={(e) => handleFetchCodeChange(e.target.value)}
                className={`monitor-form-textarea ${parseError ? 'error' : ''}`}
                rows={12}
                placeholder={`fetch("https://example.com/api/data", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "content-type": "application/json",
    "authorization": "Bearer your-token"
  },
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});`}
              />
              {parsedData && (
                <div className="monitor-form-preview">
                  <h4>Extracted Data Preview:</h4>
                  <div className="monitor-form-preview-content">
                    <p><strong>URL:</strong> {parsedData.url}</p>
                    <p><strong>Method:</strong> {parsedData.method}</p>
                    <p><strong>Headers:</strong> {Object.keys(parsedData.headers).length} headers</p>
                    {parsedData.body && <p><strong>Body:</strong> {parsedData.body.length} characters</p>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Input
                label="URL"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                error={errors.url}
                placeholder="https://example.com"
                fullWidth
                required
                icon={<Icon name="monitor" size="sm" />}
              />

              <div className="monitor-form-row">
                <div className="monitor-form-field">
                  <label className="monitor-form-label">Monitor Type</label>
                  <select
                    value={formData.monitor_type}
                    onChange={(e) => handleChange('monitor_type', e.target.value)}
                    className="monitor-form-select"
                  >
                    <option value="webpage">Webpage</option>
                    <option value="api">API</option>
                  </select>
                </div>

                <div className="monitor-form-field">
                  <label className="monitor-form-label">HTTP Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className="monitor-form-select"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="monitor-form-field">
                  <label className="monitor-form-label">
                    <input
                      type="checkbox"
                      checked={formData.save_cookies}
                      onChange={(e) => handleChange('save_cookies', e.target.checked)}
                      className="monitor-form-checkbox"
                    />
                    Save Cookies
                  </label>
                </div>
              </div>

              {/* Cookie Configuration */}
              <div className="monitor-form-row">
                <div className="monitor-form-field">
                  <label className="monitor-form-label">
                    <input
                      type="checkbox"
                      checked={formData.use_cookies}
                      onChange={(e) => handleChange('use_cookies', e.target.checked)}
                      className="monitor-form-checkbox"
                    />
                    Use Cookies in Request
                  </label>
                </div>

                {formData.use_cookies && (
                  <div className="monitor-form-field">
                    <label className="monitor-form-label">
                      Select Request with Cookies
                      {errors.cookie_request_id && <span className="monitor-form-error">{errors.cookie_request_id}</span>}
                    </label>
                    <select
                      value={formData.cookie_request_id || ''}
                      onChange={(e) => handleChange('cookie_request_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="monitor-form-select"
                    >
                      <option value="">Select a request...</option>
                      {allCookies?.map((cookie) => (
                        <option key={cookie.id} value={cookie.request_id}>
                          Request #{cookie.request_id} - {cookie.name} ({cookie.domain || 'No domain'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="monitor-form-row">
                <div className="monitor-form-field">
                  <label className="monitor-form-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="monitor-form-checkbox"
                    />
                    Active
                  </label>
                </div>

                <div className="monitor-form-field">
                  <Input
                    label="Watch Interval (seconds)"
                    type="number"
                    value={formData.watch_interval}
                    onChange={(e) => handleChange('watch_interval', parseInt(e.target.value) || 60)}
                    error={errors.watch_interval}
                    placeholder="60"
                    min="10"
                    required
                  />
                </div>
              </div>

              <div className="monitor-form-field">
                <label className="monitor-form-label">
                  Headers (JSON)
                  {errors.headers && <span className="monitor-form-error">{errors.headers}</span>}
                </label>
                <textarea
                  value={formData.headers}
                  onChange={(e) => handleChange('headers', e.target.value)}
                  className={`monitor-form-textarea ${errors.headers ? 'error' : ''}`}
                  rows={5}
                  placeholder='{"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}'
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
                <div className="monitor-form-field">
                  <label className="monitor-form-label">
                    Request Body (JSON)
                    {errors.body && <span className="monitor-form-error">{errors.body}</span>}
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    className={`monitor-form-textarea ${errors.body ? 'error' : ''}`}
                    rows={8}
                    placeholder='{"key": "value", "data": "example"}'
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="monitor-form-footer">
          <div className="monitor-form-footer-left">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTest}
              disabled={testRequest.isPending}
              className="monitor-form-test-button"
            >
              <Icon name="refresh" size="sm" />
              {testRequest.isPending ? 'Testing...' : 'Test Monitor'}
            </Button>
          </div>
          
          <div className="monitor-form-footer-right">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </form>

      <TestResultModal
        isOpen={showTestResult}
        onClose={() => setShowTestResult(false)}
        result={testResult}
        isLoading={testRequest.isPending}
      />
    </Card>
  );
};
