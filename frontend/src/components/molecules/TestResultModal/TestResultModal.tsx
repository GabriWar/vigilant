import React from 'react';
import { Modal } from '@components/atoms/Modal/Modal';
import { Button } from '@components/atoms/Button/Button';
import { Badge } from '@components/atoms/Badge/Badge';
import { Icon } from '@components/atoms/Icon/Icon';
import './TestResultModal.css';

interface CookieDetail {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  max_age?: number;
  secure?: boolean;
  http_only?: boolean;
  same_site?: string;
  is_expired?: boolean;
  expires_in_seconds?: number;
}

interface TestResult {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  cookies?: CookieDetail[];
  error?: string;
  requestData?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  responseTime?: number;
  errorDetails?: {
    code?: string;
    message?: string;
    details?: any;
  };
}

interface TestResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult | null;
  isLoading: boolean;
}

export const TestResultModal: React.FC<TestResultModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading
}) => {
  const getStatusBadgeVariant = (status?: number) => {
    if (!status) return 'secondary';
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400) return 'error';
    return 'secondary';
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => (
      <div key={key} className="test-result-header">
        <strong>{key}:</strong> {value}
      </div>
    ));
  };

  const formatExpirationTime = (expiresInSeconds?: number) => {
    if (expiresInSeconds === undefined || expiresInSeconds === null) return null;

    if (expiresInSeconds < 0) {
      return 'Expired';
    }

    const days = Math.floor(expiresInSeconds / 86400);
    const hours = Math.floor((expiresInSeconds % 86400) / 3600);
    const minutes = Math.floor((expiresInSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${expiresInSeconds}s`;
  };

  const getExpirationBadgeVariant = (expiresInSeconds?: number, isExpired?: boolean) => {
    if (isExpired) return 'error';
    if (expiresInSeconds === undefined || expiresInSeconds === null) return 'secondary';
    if (expiresInSeconds < 3600) return 'warning'; // Less than 1 hour
    if (expiresInSeconds < 86400) return 'warning'; // Less than 1 day
    return 'success';
  };

  const formatCookies = (cookies: CookieDetail[]) => {
    return cookies.map((cookie, index) => (
      <div key={index} className={`test-result-cookie ${cookie.is_expired ? 'expired' : ''}`}>
        <div className="test-result-cookie-header">
          <div className="test-result-cookie-name">{cookie.name}</div>
          <div className="test-result-cookie-badges">
            {cookie.is_expired !== undefined && (
              <Badge variant={getExpirationBadgeVariant(cookie.expires_in_seconds, cookie.is_expired)}>
                {cookie.is_expired ? 'Expired' : formatExpirationTime(cookie.expires_in_seconds)}
              </Badge>
            )}
            {cookie.secure && <Badge variant="secondary">Secure</Badge>}
            {cookie.http_only && <Badge variant="secondary">HttpOnly</Badge>}
            {cookie.same_site && <Badge variant="secondary">{cookie.same_site}</Badge>}
          </div>
        </div>
        <div className="test-result-cookie-value">{cookie.value}</div>
        {(cookie.domain || cookie.path || cookie.expires || cookie.max_age !== undefined) && (
          <div className="test-result-cookie-details">
            {cookie.domain && (
              <div className="test-result-cookie-detail">
                <strong>Domain:</strong> {cookie.domain}
              </div>
            )}
            {cookie.path && (
              <div className="test-result-cookie-detail">
                <strong>Path:</strong> {cookie.path}
              </div>
            )}
            {cookie.expires && (
              <div className="test-result-cookie-detail">
                <strong>Expires:</strong> {new Date(cookie.expires).toLocaleString()}
              </div>
            )}
            {cookie.max_age !== undefined && (
              <div className="test-result-cookie-detail">
                <strong>Max-Age:</strong> {cookie.max_age}s
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  const extractTokensFromHeaders = (headers: Record<string, string>) => {
    const tokens: Array<{ name: string; value: string; type: string }> = [];

    // Check for Authorization header
    if (headers['authorization'] || headers['Authorization']) {
      const authHeader = headers['authorization'] || headers['Authorization'];
      if (authHeader.startsWith('Bearer ')) {
        tokens.push({
          name: 'Authorization Bearer Token',
          value: authHeader.substring(7),
          type: 'Bearer'
        });
      } else if (authHeader.startsWith('Basic ')) {
        tokens.push({
          name: 'Authorization Basic Token',
          value: authHeader.substring(6),
          type: 'Basic'
        });
      } else {
        tokens.push({
          name: 'Authorization Token',
          value: authHeader,
          type: 'Custom'
        });
      }
    }

    // Check for other token headers
    const tokenHeaders = ['x-api-key', 'x-auth-token', 'x-access-token', 'api-key', 'token'];
    tokenHeaders.forEach(header => {
      const headerValue = headers[header] || headers[header.toUpperCase()] || headers[header.toLowerCase()];
      if (headerValue) {
        tokens.push({
          name: header,
          value: headerValue,
          type: 'API Key'
        });
      }
    });

    return tokens;
  };

  const extractTokensFromCookies = (cookies: CookieDetail[]) => {
    const tokenCookies = cookies.filter(cookie => {
      const lowerName = cookie.name.toLowerCase();
      return lowerName.includes('token') ||
             lowerName.includes('auth') ||
             lowerName.includes('session') ||
             lowerName.includes('jwt');
    });

    return tokenCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      type: 'Cookie'
    }));
  };

  const formatTokens = (tokens: Array<{ name: string; value: string; type: string }>) => {
    if (tokens.length === 0) return null;

    return (
      <div className="test-result-section">
        <h4>Tokens Detected</h4>
        <div className="test-result-tokens">
          {tokens.map((token, index) => (
            <div key={index} className="test-result-token">
              <div className="test-result-token-header">
                <span className="test-result-token-name">{token.name}</span>
                <Badge variant="secondary">{token.type}</Badge>
              </div>
              <div className="test-result-token-value">{token.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Test Result"
      size="lg"
    >
      <div className="test-result-modal">
        {isLoading ? (
          <div className="test-result-loading">
            <Icon name="loader" size="lg" />
            <p>Testing request...</p>
          </div>
        ) : result ? (
          <div className="test-result-content">
            {/* Sempre mostrar status da resposta */}
            <div className="test-result-status">
              <h3>Response Status</h3>
              <Badge variant={getStatusBadgeVariant(result.status)}>
                {result.status || 'Unknown'} {result.statusText || ''}
              </Badge>
              {result.responseTime && (
                <span className="test-result-time">
                  ({result.responseTime}ms)
                </span>
              )}
            </div>

            {/* Mostrar tokens detectados */}
            {result.headers && (() => {
              const headerTokens = extractTokensFromHeaders(result.headers);
              const cookieTokens = result.cookies ? extractTokensFromCookies(result.cookies) : [];
              const allTokens = [...headerTokens, ...cookieTokens];
              return formatTokens(allTokens);
            })()}

            {/* Mostrar detalhes da requisição */}
            {result.requestData && (
              <div className="test-result-section">
                <h4>Request Details</h4>
                <div className="test-result-request">
                  <div className="test-result-request-item">
                    <strong>URL:</strong> {result.requestData.url}
                  </div>
                  <div className="test-result-request-item">
                    <strong>Method:</strong> {result.requestData.method}
                  </div>
                  {result.requestData.headers && Object.keys(result.requestData.headers).length > 0 && (
                    <div className="test-result-request-item">
                      <strong>Headers:</strong>
                      <pre className="test-result-request-headers">
                        {JSON.stringify(result.requestData.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  {result.requestData.body && (
                    <div className="test-result-request-item">
                      <strong>Body:</strong>
                      <pre className="test-result-request-body">
                        {JSON.stringify(result.requestData.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mostrar headers da resposta */}
            {result.headers && Object.keys(result.headers).length > 0 && (
              <div className="test-result-section">
                <h4>Response Headers</h4>
                <div className="test-result-headers">
                  {formatHeaders(result.headers)}
                </div>
              </div>
            )}

            {/* Mostrar cookies */}
            {result.cookies && result.cookies.length > 0 && (
              <div className="test-result-section">
                <h4>Cookies Received</h4>
                <div className="test-result-cookies">
                  {formatCookies(result.cookies)}
                </div>
              </div>
            )}

            {/* Mostrar body da resposta */}
            {result.body && (
              <div className="test-result-section">
                <h4>Response Body</h4>
                <pre className="test-result-body">
                  {result.body}
                </pre>
              </div>
            )}

            {/* Mostrar informações de erro se houver */}
            {result.error && (
              <div className="test-result-section">
                <h4>Error Information</h4>
                <div className="test-result-error-info">
                  <p className="test-result-error-message">{result.error}</p>
                  
                  {result.errorDetails && (
                    <div className="test-result-error-details">
                      {result.errorDetails.code && (
                        <div className="test-result-error-item">
                          <strong>Error Code:</strong> {result.errorDetails.code}
                        </div>
                      )}
                      {result.errorDetails.message && (
                        <div className="test-result-error-item">
                          <strong>Message:</strong> {result.errorDetails.message}
                        </div>
                      )}
                      {result.errorDetails.details && (
                        <div className="test-result-error-item">
                          <strong>Details:</strong>
                          <pre className="test-result-error-details-json">
                            {JSON.stringify(result.errorDetails.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="test-result-actions">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};