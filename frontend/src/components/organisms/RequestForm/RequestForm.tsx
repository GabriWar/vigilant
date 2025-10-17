/**
 * RequestForm Organism Component
 * Form for creating/editing requests
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@components/atoms/Card/Card';
import { Input } from '@components/atoms/Input/Input';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import { TestResultModal } from '@components/molecules';
import { useTestRequest } from '@hooks/useTestRequest';
import { parseFetchCode, ParsedFetchData } from '@utils/fetchParser';
import './RequestForm.css';

export interface RequestFormData {
  name: string;
  url: string;
  method: string;
  headers: string;
  body: string;
  save_cookies: boolean;
  watch_interval: number | null;
  is_active: boolean;
}

export interface RequestFormProps {
  initialData?: Partial<RequestFormData>;
  onSubmit: (data: RequestFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const RequestForm: React.FC<RequestFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<RequestFormData>({
    name: initialData?.name || '',
    url: initialData?.url || '',
    method: initialData?.method || 'POST',
    headers: initialData?.headers || '{\n  "Content-Type": "application/json"\n}',
    body: initialData?.body || '{\n  "username": "",\n  "password": ""\n}',
    save_cookies: initialData?.save_cookies ?? true,
    watch_interval: initialData?.watch_interval || null,
    is_active: initialData?.is_active ?? true,
  });

  const [useFetchCode, setUseFetchCode] = useState(false);
  const [fetchCode, setFetchCode] = useState('');
  const [parsedData, setParsedData] = useState<ParsedFetchData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({});
  const [showTestResult, setShowTestResult] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const testRequest = useTestRequest();

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
        method: initialData.method || 'POST',
        headers: initialData.headers || '{\n  "Content-Type": "application/json"\n}',
        body: initialData.body || '{\n  "username": "",\n  "password": ""\n}',
        save_cookies: initialData.save_cookies ?? true,
        watch_interval: initialData.watch_interval || null,
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RequestFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Se estiver usando fetch code, usar dados parseados para validação
    if (useFetchCode && parsedData) {
      if (!parsedData.url.trim()) {
        newErrors.url = 'URL is required';
      } else {
        try {
          new URL(parsedData.url);
        } catch {
          newErrors.url = 'Invalid URL';
        }
      }
    } else {
      if (!formData.url.trim()) {
        newErrors.url = 'URL is required';
      } else {
        try {
          new URL(formData.url);
        } catch {
          newErrors.url = 'Invalid URL';
        }
      }

      // Validate JSON in headers (apenas no modo manual)
      if (formData.headers.trim()) {
        try {
          JSON.parse(formData.headers);
        } catch {
          newErrors.headers = 'Invalid JSON format';
        }
      }

      // Validate JSON in body (apenas no modo manual)
      if (formData.body.trim() && ['POST', 'PUT', 'PATCH'].includes(formData.method)) {
        try {
          JSON.parse(formData.body);
        } catch {
          newErrors.body = 'Invalid JSON format';
        }
      }
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

  const handleChange = (field: keyof RequestFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTest = async () => {
    if (!validateForm()) {
      return;
    }

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
          headers: JSON.parse(formData.headers),
          body: formData.body ? JSON.parse(formData.body) : undefined,
        };
      }

      const result = await testRequest.mutateAsync(testData);
      setTestResult({
        ...result,
        requestData: testData
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
          headers: JSON.parse(formData.headers),
          body: formData.body ? JSON.parse(formData.body) : undefined,
        },
        status: error.status,
        statusText: error.statusText
      });
      setShowTestResult(true);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="request-form">
      <form onSubmit={handleSubmit}>
        <div className="request-form-header">
          <h2>
            <Icon name="settings" size="md" />
            {initialData ? 'Edit Request' : 'Create Request'}
          </h2>
          <p>Configure request to retrieve cookies</p>
        </div>

        <div className="request-form-body">
          <Input
            label="Request Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Login to Admin Panel"
            fullWidth
            required
          />

          {/* Toggle para alternar entre modo manual e fetch code */}
          <div className="request-form-toggle">
            <label className="request-form-toggle-label">
              <input
                type="checkbox"
                checked={useFetchCode}
                onChange={toggleInputMode}
                className="request-form-toggle-input"
              />
              <span className="request-form-toggle-text">
                <Icon name="settings" size="sm" />
                Usar Fetch Code (cole o fetch do DevTools)
              </span>
            </label>
          </div>

          {useFetchCode ? (
            <div className="request-form-field">
              <label className="request-form-label">
                Fetch Code do DevTools
                {parseError && <span className="request-form-error">{parseError}</span>}
                {parsedData && <span className="request-form-success">✓ Código parseado com sucesso</span>}
              </label>
              <textarea
                value={fetchCode}
                onChange={(e) => handleFetchCodeChange(e.target.value)}
                className={`request-form-textarea ${parseError ? 'error' : ''}`}
                rows={12}
                placeholder={`fetch("https://example.com/api/login", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "x-requested-with": "XMLHttpRequest"
  },
  "referrer": "https://example.com/login/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "username=user&password=pass",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});`}
              />
              {parsedData && (
                <div className="request-form-preview">
                  <h4>Preview dos Dados Extraídos:</h4>
                  <div className="request-form-preview-content">
                    <p><strong>URL:</strong> {parsedData.url}</p>
                    <p><strong>Method:</strong> {parsedData.method}</p>
                    <p><strong>Headers:</strong> {Object.keys(parsedData.headers).length} headers</p>
                    {parsedData.body && <p><strong>Body:</strong> {parsedData.body.length} caracteres</p>}
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
                placeholder="https://example.com/api/login"
                fullWidth
                required
                icon={<Icon name="monitor" size="sm" />}
              />

              <div className="request-form-row">
                <div className="request-form-field">
                  <label className="request-form-label">HTTP Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className="request-form-select"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div className="request-form-field">
                  <label className="request-form-label">
                    <input
                      type="checkbox"
                      checked={formData.save_cookies}
                      onChange={(e) => handleChange('save_cookies', e.target.checked)}
                      className="request-form-checkbox"
                    />
                    Save Cookies
                  </label>
                </div>

                <div className="request-form-field">
                  <label className="request-form-label">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                      className="request-form-checkbox"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="request-form-field">
                <label className="request-form-label">
                  Headers (JSON)
                  {errors.headers && <span className="request-form-error">{errors.headers}</span>}
                </label>
                <textarea
                  value={formData.headers}
                  onChange={(e) => handleChange('headers', e.target.value)}
                  className={`request-form-textarea ${errors.headers ? 'error' : ''}`}
                  rows={5}
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
                <div className="request-form-field">
                  <label className="request-form-label">
                    Request Body (JSON)
                    {errors.body && <span className="request-form-error">{errors.body}</span>}
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    className={`request-form-textarea ${errors.body ? 'error' : ''}`}
                    rows={8}
                    placeholder='{"username": "your_username", "password": "your_password"}'
                  />
                </div>
              )}
            </>
          )}

          <Input
            label="Watch Interval (seconds, optional)"
            type="number"
            value={formData.watch_interval || ''}
            onChange={(e) => handleChange('watch_interval', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Leave empty to run only manually"
            fullWidth
          />
        </div>

        <div className="request-form-footer">
          <div className="request-form-footer-left">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTest}
              disabled={testRequest.isPending}
              className="request-form-test-button"
            >
              <Icon name="refresh" size="sm" />
              {testRequest.isPending ? 'Testing...' : 'Test Request'}
            </Button>
          </div>
          
          <div className="request-form-footer-right">
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
