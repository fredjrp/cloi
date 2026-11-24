/**
 * Typed client for the CloiDm mobile API.
 *
 * Every request goes through `request()`, which attaches the bearer token and
 * normalises errors. The token is a signed, 30-day value issued by the backend at
 * login - there is no refresh dance because it expires on its own and the user
 * simply logs in again.
 *
 * Nothing here trusts the client: the backend scopes every query to the workspace
 * carried in the token, so a tampered app can only ever read its own data.
 */

import { clearToken, getToken } from './auth';

/** Base URL. In the APK this is baked in at build time via VITE_API_BASE. */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, '') ||
  'https://app.cloidm.online';

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const h: Record<string, string> = {
    Accept: 'application/json',
    ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
    ...((headers as Record<string, string>) || {}),
  };

  if (auth) {
    const token = await getToken();
    if (!token) throw new ApiError(401, 'Not signed in');
    h.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...rest, headers: h });
  } catch {
    // Network failure is distinct from an API error: show it as such so the user
    // does not think their password was wrong.
    throw new ApiError(0, 'Cannot reach the server. Check your connection.');
  }

  if (res.status === 401 && auth) {
    await clearToken();
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, String(detail));
  }
  return data as T;
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- shapes

export interface LoginResult {
  token: string;
  expires_in: number;
  email: string;
  workspace_id: string;
  workspace_name: string;
}

export interface Account {
  connected: boolean;
  ig_handle: string;
  account_name: string;
  avatar_url: string;
  platform: string;
  webhook_healthy: boolean;
}

export interface RuleMetrics {
  comments_triggered: number;
  dms_sent: number;
  followers_gained: number;
  emails_captured: number;
  link_clicks: number;
}

export interface Rule {
  id: string;
  name: string;
  keywords: string;
  match_type: 'whole' | 'contains' | 'partial';
  status: 'active' | 'paused';
  follow_gate_enabled: boolean;
  follow_gate_prompt: string;
  follow_gate_button_label: string;
  public_reply: string;
  dm_text: string;
  destination_url: string;
  destination_button_label: string;
  email_capture_mode: 'none' | 'in_dm' | 'external_link';
  email_collection_url: string;
  email_prompt: string;
  ig_handle: string;
  updated_at: string;
  metrics: RuleMetrics;
}

export interface Funnel {
  leads: number;
  clicked: number;
  emails: number;
  followed: number;
  open_leads: number;
  click_rate: number;
  email_rate: number;
  follow_rate: number;
  active_rules: number;
  total_rules: number;
  window_days: number;
}

export interface RuleInput {
  name: string;
  keywords: string;
  destination_url: string;
  match_type?: string;
  follow_gate_enabled?: boolean;
  follow_gate_prompt?: string;
  follow_gate_button_label?: string;
  public_reply?: string;
  dm_text?: string;
  email_capture_mode?: string;
  email_collection_url?: string;
  email_prompt?: string;
}

export interface FunnelStep {
  step: string;
  sessions: number;
  drop_from_previous_pct: number | null;
}

export interface ChurnFunnel {
  window_days: number;
  steps: FunnelStep[];
  worst_drop: FunnelStep | null;
}

export interface Post {
  id: string;
  title: string;
  caption: string;
  published_at: string;
  thumbnail_url: string;
}

// ---------------------------------------------------------------- endpoints

export const api = {
  login(email: string, password: string) {
    return request<LoginResult>('/api/mobile/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  },

  /** Create an account. The backend makes the workspace and membership for us. */
  signup(email: string, password: string, name: string) {
    return request<LoginResult>('/api/mobile/auth/signup', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password, name }),
    });
  },

  me() {
    return request<Account>('/api/mobile/me');
  },

  metrics() {
    return request<Funnel>('/api/mobile/metrics');
  },

  campaigns() {
    return request<Rule[]>('/api/mobile/campaigns');
  },

  posts() {
    return request<Post[]>('/api/mobile/posts');
  },

  /** Journey funnel: how many installs reached each step, and where they left. */
  funnel(days = 30) {
    return request<ChurnFunnel>(`/api/mobile/events/funnel?days=${days}`);
  },

  createCampaign(body: RuleInput) {
    return request<Rule>('/api/mobile/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCampaign(id: string, body: Partial<RuleInput> & { status?: string }) {
    return request<Rule>(`/api/mobile/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  toggleCampaign(id: string) {
    return request<Rule>(`/api/mobile/campaigns/${id}/toggle`, { method: 'POST' });
  },

  deleteCampaign(id: string) {
    return request<{ ok: boolean; message: string }>(`/api/mobile/campaigns/${id}`, {
      method: 'DELETE',
    });
  },
};
