const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3100";

// ── Response types ──────────────────────────────────────────────

export interface DemographicsData {
  totalUsers: number;
  genderSplit: Record<string, number>;
  byUniversity: Array<{ domain: string | null; count: number }>;
}

export interface FunnelData {
  byStatus: Record<string, number>;
  byOnboardingStep: Record<string, number>;
}

export interface MatchesData {
  totalProposed: number;
  accepted: number;
  acceptanceRate: number;
  scheduled: number;
  cancelled: number;
  completed: number;
}

export interface UserProfile {
  height: number | null;
  hobbies: string[];
  partnerPreferences: string[];
  visualPreferences: string[];
  psychologicalSummary: string | null;
  negativeConstraints: string[];
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  photos: string[];
}

export interface UserListItem {
  id: string;
  telegramId: string;
  firstName: string;
  surname: string | null;
  age: number | null;
  gender: string | null;
  preference: string | null;
  major: string | null;
  language: string | null;
  status: string;
  onboardingStep: string;
  universityDomain: string | null;
  email: string | null;
  createdAt: string;
  profile: UserProfile | null;
}

export interface UsersListResponse {
  data: UserListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ChatMessage {
  role?: string;
  content?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

export interface UserDetail extends UserListItem {
  messageHistory: ChatMessage[] | null;
}

// ── Fetcher ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const token = sessionStorage.getItem("admin_api_key");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    sessionStorage.removeItem("admin_api_key");
    throw new Error("Invalid API key");
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Endpoint functions ──────────────────────────────────────────

export const getDemographics = () =>
  apiFetch<DemographicsData>("/admin/analytics/demographics");

export const getFunnel = () =>
  apiFetch<FunnelData>("/admin/analytics/funnel");

export const getMatches = () =>
  apiFetch<MatchesData>("/admin/analytics/matches");

export const getUsers = (limit = 20, offset = 0) =>
  apiFetch<UsersListResponse>(`/admin/users?limit=${limit}&offset=${offset}`);

export const getUserDetail = (id: string) =>
  apiFetch<UserDetail>(`/admin/users/${encodeURIComponent(id)}`);
