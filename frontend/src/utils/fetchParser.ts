/**
 * Parser para extrair dados de código fetch do DevTools
 */

export interface ParsedFetchData {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  referrer?: string;
  referrerPolicy?: string;
  mode?: string;
  credentials?: string;
  cache?: string;
  redirect?: string;
  integrity?: string;
  keepalive?: boolean;
  signal?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedFetchData;
  error?: string;
}

/**
 * Parseia código fetch do DevTools e extrai os dados
 */
export const parseFetchCode = (fetchCode: string): ParseResult => {
  try {
    // Limpar o código (remover quebras de linha desnecessárias)
    const cleanCode = fetchCode.trim().replace(/\s+/g, ' ');
    
    // Verificar se é um fetch válido
    if (!cleanCode.startsWith('fetch(')) {
      return {
        success: false,
        error: 'Código deve começar com "fetch("'
      };
    }

    // Extrair URL (primeiro parâmetro)
    const urlMatch = cleanCode.match(/fetch\s*\(\s*["'`]([^"'`]+)["'`]/);
    if (!urlMatch) {
      return {
        success: false,
        error: 'Não foi possível extrair a URL do fetch'
      };
    }

    const url = urlMatch[1];

    // Extrair o objeto de opções (segundo parâmetro)
    const optionsMatch = cleanCode.match(/fetch\s*\(\s*["'`][^"'`]+["'`]\s*,\s*(\{[\s\S]*\})\s*\)/);
    if (!optionsMatch) {
      return {
        success: false,
        error: 'Não foi possível extrair as opções do fetch'
      };
    }

    const optionsString = optionsMatch[1];

    // Parsear o objeto de opções
    const parsedData: ParsedFetchData = {
      url,
      method: 'GET', // padrão
      headers: {}
    };

    // Extrair method
    const methodMatch = optionsString.match(/"method"\s*:\s*["'`]([^"'`]+)["'`]/);
    if (methodMatch) {
      parsedData.method = methodMatch[1].toUpperCase();
    }

    // Extrair headers
    const headersMatch = optionsString.match(/"headers"\s*:\s*(\{[\s\S]*?\})/);
    if (headersMatch) {
      const headersString = headersMatch[1];
      const headerMatches = headersString.matchAll(/"([^"]+)"\s*:\s*["'`]([^"'`]*)["'`]/g);
      
      for (const match of headerMatches) {
        const key = match[1];
        const value = match[2];
        parsedData.headers[key] = value;
      }
    }

    // Extrair body
    const bodyMatch = optionsString.match(/"body"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (bodyMatch) {
      parsedData.body = bodyMatch[1];
    }

    // Extrair outras propriedades
    const referrerMatch = optionsString.match(/"referrer"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (referrerMatch) {
      parsedData.referrer = referrerMatch[1];
    }

    const referrerPolicyMatch = optionsString.match(/"referrerPolicy"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (referrerPolicyMatch) {
      parsedData.referrerPolicy = referrerPolicyMatch[1];
    }

    const modeMatch = optionsString.match(/"mode"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (modeMatch) {
      parsedData.mode = modeMatch[1];
    }

    const credentialsMatch = optionsString.match(/"credentials"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (credentialsMatch) {
      parsedData.credentials = credentialsMatch[1];
    }

    const cacheMatch = optionsString.match(/"cache"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (cacheMatch) {
      parsedData.cache = cacheMatch[1];
    }

    const redirectMatch = optionsString.match(/"redirect"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (redirectMatch) {
      parsedData.redirect = redirectMatch[1];
    }

    const integrityMatch = optionsString.match(/"integrity"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (integrityMatch) {
      parsedData.integrity = integrityMatch[1];
    }

    const keepaliveMatch = optionsString.match(/"keepalive"\s*:\s*(true|false)/);
    if (keepaliveMatch) {
      parsedData.keepalive = keepaliveMatch[1] === 'true';
    }

    const signalMatch = optionsString.match(/"signal"\s*:\s*["'`]([^"'`]*)["'`]/);
    if (signalMatch) {
      parsedData.signal = signalMatch[1];
    }

    return {
      success: true,
      data: parsedData
    };

  } catch (error) {
    return {
      success: false,
      error: `Erro ao parsear código fetch: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
};

/**
 * Converte dados parseados para formato do backend
 */
export const convertToBackendFormat = (parsedData: ParsedFetchData) => {
  return {
    url: parsedData.url,
    method: parsedData.method,
    headers: parsedData.headers,
    body: parsedData.body ? JSON.parse(parsedData.body) : undefined
  };
};

/**
 * Valida se o código fetch é válido
 */
export const validateFetchCode = (fetchCode: string): boolean => {
  const result = parseFetchCode(fetchCode);
  return result.success;
};