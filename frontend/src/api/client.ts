// Простая обёртка над fetch

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  isFormData?: boolean;
}

const TOKEN_KEY = 'resumehelper-session-token';

export function setSessionToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const headers: Record<string, string> = {};

  const token = getSessionToken();
  if (token) {
    headers['X-Session-Token'] = token;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (isFormData) {
      payload = body as FormData;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(path, { method, headers, body: payload });

  if (response.status === 204) return undefined as T;

  let data: any = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    if (response.status === 401) {
      setSessionToken(null);
    }
    const detail = data?.detail || data?.message || response.statusText || 'Ошибка запроса';
    const detailStr = Array.isArray(detail)
      ? detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ')
      : String(detail);
    throw new ApiError(response.status, detailStr);
  }

  return data as T;
}

export function downloadUrl(path: string): string {
  const token = getSessionToken();
  if (!token) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}token=${encodeURIComponent(token)}`;
}
