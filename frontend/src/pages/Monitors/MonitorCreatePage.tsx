import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMonitor, useTestRequest } from '@hooks/useMonitors';
import { useHeaders, useCreateHeader } from '@hooks/useHeaders';
import { useAllCookies } from '@hooks/useCookies';
import { parseFetchCode, ParsedFetchData } from '@utils/fetchParser';
import { Button } from '@components/atoms/Button/Button';
import { Card } from '@components/atoms/Card/Card';
import { Icon } from '@components/atoms/Icon/Icon';
import { TestResultModal } from '@components/molecules';
import { useModal } from '@hooks/useModal';
import { AlertModal } from '@components/molecules';
import { ROUTES } from '@constants/routes';
import './MonitorCreatePage.css';

export const MonitorCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createMonitor = useCreateMonitor();
  const testRequest = useTestRequest();
  const createHeader = useCreateHeader();
  const { data: headers = [], isLoading: headersLoading, refetch: refetchHeaders } = useHeaders();
  const { data: cookies = [], isLoading: cookiesLoading } = useAllCookies();
  const { showAlert, alertModal, hideAlert } = useModal();
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    monitor_type: 'webpage' as 'webpage' | 'api',
    watch_interval: 60,
    is_active: true,
  });

  // Test configuration
  const [selectedHeaders, setSelectedHeaders] = useState<number[]>([]);
  const [selectedCookies, setSelectedCookies] = useState<{[key: string]: string}>({});
  
  // DevTools fetch state
  const [useFetchCode, setUseFetchCode] = useState(false);
  const [fetchCode, setFetchCode] = useState('');
  const [parsedData, setParsedData] = useState<ParsedFetchData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Test modal state
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isMonitorTestLoading, setIsMonitorTestLoading] = useState(false);

  // Função para parsear o fetch code
  const handleFetchCodeChange = async (code: string) => {
    setFetchCode(code);
    setParseError(null);
    
    if (code.trim()) {
      const result = parseFetchCode(code);
      if (result.success && result.data) {
        setParsedData(result.data);
        console.log('Parsed fetch data:', result.data);
        console.log('Headers extracted:', result.data.headers);
        
        // Preencher automaticamente os campos do formulário
        setFormData(prev => ({
          ...prev,
          url: result.data!.url,
        }));
        
        // Criar UM header contendo TODOS os headers do fetch
        const headerEntries = Object.entries(result.data!.headers);
        console.log(`Processing ${headerEntries.length} headers into ONE header set...`);
        
        // Criar um nome descritivo baseado na URL
        const urlObj = new URL(result.data!.url);
        const headerSetName = `Headers for ${urlObj.hostname}`;
        
        // Converter headers para formato JSON
        const headersJson = JSON.stringify(result.data!.headers, null, 2);
        
        try {
          // Verificar se já existe um header set com este nome
          const existingHeaderSet = headers.find(h => h.name === headerSetName);
          
          if (existingHeaderSet) {
            console.log(`Header set "${headerSetName}" already exists with ID ${existingHeaderSet.id}`);
            setSelectedHeaders([existingHeaderSet.id]);
            
            showAlert({
              title: 'Header Set Found',
              message: `Using existing header set "${headerSetName}" with ${headerEntries.length} headers`,
              type: 'info'
            });
          } else {
            // Criar novo header set
            console.log(`Creating new header set: ${headerSetName}`);
            const newHeaderSet = await createHeader.mutateAsync({
              name: headerSetName,
              value: headersJson,
              description: `Auto-created from DevTools fetch - Contains ${headerEntries.length} headers`,
              is_active: true
            });
            
            console.log(`Header set created successfully with ID ${newHeaderSet.id}`);
            
            // Atualizar lista de headers e selecionar o novo
            await refetchHeaders();
            setSelectedHeaders([newHeaderSet.id]);
            
            showAlert({
              title: 'Header Set Created',
              message: `Created header set "${headerSetName}" with ${headerEntries.length} headers`,
              type: 'success'
            });
          }
        } catch (error: any) {
          console.error('Failed to create header set:', error);
          console.error('Error details:', error.response?.data);
          
          showAlert({
            title: 'Failed to Create Headers',
            message: error.response?.data?.detail || 'Could not create header set. Please try again.',
            type: 'error'
          });
        }
      } else {
        setParseError(result.error || 'Erro ao parsear código fetch');
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  };

  const handleTestMonitor = async () => {
    if (!formData.url) {
      showAlert({
        title: 'Validation Error',
        message: 'Please enter a URL before testing',
        type: 'error'
      });
      return;
    }

    setIsMonitorTestLoading(true);
    setIsTestModalOpen(true);
    
    // Build headers from selected headers
    const selectedHeadersData = headers.filter(h => selectedHeaders.includes(h.id));
    const headersDict: {[key: string]: string} = {};
    
    // Add selected headers
    selectedHeadersData.forEach(header => {
      // Tentar parsear o valor como JSON (caso seja um header set completo)
      try {
        const parsedValue = JSON.parse(header.value);
        // Se for um objeto, adicionar todos os headers
        if (typeof parsedValue === 'object' && parsedValue !== null) {
          Object.assign(headersDict, parsedValue);
        } else {
          // Se não for objeto, usar como header individual
          headersDict[header.name] = header.value;
        }
      } catch {
        // Se não for JSON, usar como header individual normal
        headersDict[header.name] = header.value;
      }
    });
    
    // Add default headers only if not already present
    if (!headersDict['User-Agent']) {
      headersDict['User-Agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
    }
    
    try {
      const result = await testRequest.mutateAsync({
        url: formData.url,
        method: 'GET',
        headers: headersDict,
        cookies: selectedCookies
      });

      const formattedResult = {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
        body: result.body,
        cookies: result.cookies,
        requestData: {
          url: formData.url,
          method: 'GET',
          headers: headersDict,
          cookies: selectedCookies
        },
        responseTime: result.headers['x-response-time'] ? parseInt(result.headers['x-response-time']) : undefined,
        monitorInfo: {
          name: formData.name || 'New Monitor',
          type: formData.monitor_type,
          watchInterval: formData.watch_interval,
          isActive: formData.is_active
        }
      };
      setTestResult(formattedResult);
      showAlert({
        title: 'Monitor Test Successful',
        message: `Test completed successfully. Status: ${result.status}`,
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error testing monitor:', error);
      setTestResult({
        error: error.response?.data?.detail || 'Failed to test monitor',
        errorDetails: {
          code: error.response?.status?.toString(),
          message: error.message,
          details: error.response?.data
        },
        requestData: {
          url: formData.url,
          method: 'GET',
          headers: headersDict,
          cookies: selectedCookies
        },
        monitorInfo: {
          name: formData.name || 'New Monitor',
          type: formData.monitor_type,
          watchInterval: formData.watch_interval,
          isActive: formData.is_active
        }
      });
      showAlert({
        title: 'Monitor Test Failed',
        message: `Failed to test monitor. ${error.response?.data?.detail || error.message}`,
        type: 'error'
      });
    } finally {
      setIsMonitorTestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMonitor.mutateAsync(formData);
      showAlert({
        title: 'Success',
        message: `Monitor "${formData.name}" created successfully!`,
        type: 'success'
      });
      setTimeout(() => navigate(ROUTES.MONITORS), 1500);
    } catch (error) {
      console.error('Failed to create monitor:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to create monitor. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="monitor-create-page">
      <div className="monitor-create-header">
        <div>
          <h1 className="monitor-create-title">Create Monitor</h1>
          <p className="monitor-create-subtitle">
            Set up a new monitor to track your website or API
          </p>
        </div>
        <div className="monitor-create-header-actions">
          <Button
            variant="secondary"
            onClick={handleTestMonitor}
            disabled={isMonitorTestLoading || !formData.url}
          >
            <Icon name={isMonitorTestLoading ? "loader" : "monitor"} size="sm" />
            {isMonitorTestLoading ? 'Testing Monitor...' : 'Test Monitor'}
          </Button>
        </div>
      </div>

      {/* DevTools Fetch Section */}
      <Card padding="lg" className="monitor-create-fetch-card">
        <div className="monitor-create-fetch-header">
          <div>
            <h2 className="monitor-create-fetch-title">DevTools Fetch</h2>
            <p className="monitor-create-fetch-subtitle">
              Paste fetch code from DevTools to automatically configure headers and URL
            </p>
          </div>
        </div>

        <div className="monitor-create-fetch-toggle">
          <label className="monitor-create-fetch-toggle-label">
            <input
              type="checkbox"
              checked={useFetchCode}
              onChange={(e) => setUseFetchCode(e.target.checked)}
              className="monitor-create-fetch-toggle-input"
            />
            <span className="monitor-create-fetch-toggle-text">
              <Icon name="code" size="sm" />
              Use DevTools Fetch Code
            </span>
          </label>
        </div>

        {useFetchCode && (
          <div className="monitor-create-fetch-field">
            <label className="monitor-create-label">
              Fetch Code do DevTools
              {parseError && <span className="monitor-create-error">{parseError}</span>}
              {parsedData && <span className="monitor-create-success">✓ Código parseado com sucesso</span>}
            </label>
            <textarea
              value={fetchCode}
              onChange={(e) => handleFetchCodeChange(e.target.value)}
              className={`monitor-create-textarea ${parseError ? 'error' : ''}`}
              rows={12}
              placeholder={`fetch("https://mobile-tracker-free.com/dashboard/scripts/data/server_processing_whatsapp_messages_new.php", {
  "headers": {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "x-requested-with": "XMLHttpRequest",
    "referer": "https://mobile-tracker-free.com/dashboard/"
  },
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});`}
            />
            {parsedData && (
              <div className="monitor-create-fetch-preview">
                <h4>Preview dos Dados Extraídos:</h4>
                <div className="monitor-create-fetch-preview-content">
                  <p><strong>URL:</strong> {parsedData.url}</p>
                  <p><strong>Method:</strong> {parsedData.method}</p>
                  <p><strong>Headers:</strong> {Object.keys(parsedData.headers).length} headers</p>
                  {parsedData.body && <p><strong>Body:</strong> {parsedData.body.length} caracteres</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card padding="lg" className="monitor-create-form-card">
        <form onSubmit={handleSubmit} className="monitor-create-form">
          <div className="monitor-create-form-row">
            <div className="monitor-create-form-group">
              <label className="monitor-create-label">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="monitor-create-input"
                placeholder="Enter monitor name"
              />
            </div>

            <div className="monitor-create-form-group">
              <label className="monitor-create-label">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="monitor-create-input"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="monitor-create-form-row">
            <div className="monitor-create-form-group">
              <label className="monitor-create-label">Type</label>
              <select
                value={formData.monitor_type}
                onChange={(e) => setFormData({ ...formData, monitor_type: e.target.value as 'webpage' | 'api' })}
                className="monitor-create-select"
              >
                <option value="webpage">Webpage</option>
                <option value="api">API</option>
              </select>
            </div>

            <div className="monitor-create-form-group">
              <label className="monitor-create-label">Watch Interval (seconds)</label>
              <input
                type="number"
                value={formData.watch_interval}
                onChange={(e) => setFormData({ ...formData, watch_interval: parseInt(e.target.value) })}
                min="1"
                required
                className="monitor-create-input"
                placeholder="60"
              />
            </div>
          </div>

          {/* Headers Selection */}
          <div className="monitor-create-form-row">
            <div className="monitor-create-form-group monitor-create-selection-group">
              <label className="monitor-create-label">Headers</label>
              <div className="monitor-create-selection-container">
                {headers.map((header) => (
                  <label key={header.id} className="monitor-create-selection-item">
                    <input
                      type="checkbox"
                      checked={selectedHeaders.includes(header.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedHeaders([...selectedHeaders, header.id]);
                        } else {
                          setSelectedHeaders(selectedHeaders.filter(id => id !== header.id));
                        }
                      }}
                      className="monitor-create-checkbox"
                    />
                    <span className="monitor-create-selection-text">
                      <strong>{header.name}:</strong> {header.value}
                      {header.description && (
                        <small className="monitor-create-selection-description">
                          {header.description}
                        </small>
                      )}
                    </span>
                  </label>
                ))}
                {headers.length === 0 && (
                  <p className="monitor-create-no-items">No headers available</p>
                )}
              </div>
            </div>
          </div>

          {/* Cookies Selection */}
          <div className="monitor-create-form-row">
            <div className="monitor-create-form-group monitor-create-selection-group">
              <label className="monitor-create-label">Cookies</label>
              <div className="monitor-create-selection-container">
                {cookies.map((cookie) => (
                  <label key={cookie.id} className="monitor-create-selection-item">
                    <input
                      type="checkbox"
                      checked={selectedCookies.hasOwnProperty(cookie.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCookies({...selectedCookies, [cookie.name]: cookie.value});
                        } else {
                          const newCookies = {...selectedCookies};
                          delete newCookies[cookie.name];
                          setSelectedCookies(newCookies);
                        }
                      }}
                      className="monitor-create-checkbox"
                    />
                    <span className="monitor-create-selection-text">
                      <strong>{cookie.name}:</strong> {cookie.value}
                      {cookie.domain && (
                        <small className="monitor-create-selection-description">
                          Domain: {cookie.domain}
                        </small>
                      )}
                    </span>
                  </label>
                ))}
                {cookies.length === 0 && (
                  <p className="monitor-create-no-items">No cookies available</p>
                )}
              </div>
            </div>
          </div>

          <div className="monitor-create-form-row">
            <div className="monitor-create-form-group monitor-create-checkbox-group">
              <label className="monitor-create-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="monitor-create-checkbox"
                />
                <span className="monitor-create-checkbox-text">Active</span>
              </label>
            </div>
          </div>

          <div className="monitor-create-actions">
            <Button type="submit" disabled={createMonitor.isPending}>
              <Icon name="plus" size="sm" />
              {createMonitor.isPending ? 'Creating...' : 'Create Monitor'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.MONITORS)}>
              <Icon name="x" size="sm" />
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <TestResultModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setTestResult(null);
        }}
        result={testResult}
        isLoading={isMonitorTestLoading}
      />
    </div>
  );
};
