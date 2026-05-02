const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3100";

// ── Response types ──────────────────────────────────────────────

export interface DemographicsData {
  totalUsers: number;
  genderSplit: Record<string, number>;
  byUniversity: Array<{
    domain: string | null;
    count: number;
    activeCount: number;
    activeRate: number;
  }>;
}

// ── Audience ──────────────────────────────────────────────────

export interface AudienceData {
  totalUsers: number;
  age: Array<{ bucket: string; count: number }>;
  majorClusters: Array<{ cluster: string; count: number }>;
  topHobbies: Array<{ name: string; count: number }>;
  ethnicity: Array<{ name: string; count: number }>;
  socialEnergy: Array<{ value: string; count: number }>;
  attachmentStyle: Array<{ value: string; count: number }>;
  humorStyle: Array<{ value: string; count: number }>;
  communicationStyle: Array<{ value: string; count: number }>;
  matchRadius: { campus_only: number; citywide: number; unknown: number };
  geo: { known: number; unknown: number; knownPct: number };
}

export interface HeatmapData {
  cellCount: number;
  totalUsers: number;
  totalAggregated: number;
  cells: Array<{ lat: number; lng: number; count: number }>;
}

// ── Algorithm ─────────────────────────────────────────────────

export interface CalibrationRow {
  bucket: string;
  decisions: number;
  accepts: number;
  acceptRate: number | null;
}

export interface ComponentMeans {
  explicit: { accepted: number | null; declined: number | null };
  research: { accepted: number | null; declined: number | null };
  league: { accepted: number | null; declined: number | null };
  penalty: { accepted: number | null; declined: number | null };
}

export interface HistogramBin {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface AlgorithmData {
  synergyCalibration: CalibrationRow[];
  pitchLengthCalibration: CalibrationRow[];
  componentMeans: ComponentMeans;
  componentHistograms: {
    explicit: HistogramBin[];
    research: HistogramBin[];
    league: HistogramBin[];
    penalty: HistogramBin[];
    embeddingDistance: HistogramBin[];
  };
  responseHeatmap: Array<Array<{ accept: number; decline: number }>>;
  topRejectionWords: Array<{ word: string; count: number }>;
  totalScoreLogged: number;
  totalMatches: number;
}

// ── Gender ────────────────────────────────────────────────────

export interface WaitTimeStats {
  n: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  mean: number | null;
  censored: number;
}

export interface GenderData {
  weeklyRegistrations: Array<{ week: string; male: number; female: number; unknown: number }>;
  funnel: Record<"male" | "female" | "unknown", { onboarding: number; active: number; gotMatch: number }>;
  waitTime: Record<"male" | "female" | "unknown", WaitTimeStats>;
  noMatchPctByGender: Record<"male" | "female" | "unknown", number>;
  preferenceMatrix: Record<"male" | "female" | "unknown", { men: number; women: number; both: number; unknown: number }>;
  skewedUniversities: Array<{
    domain: string;
    male: number;
    female: number;
    total: number;
    malePct: number;
  }>;
  staleActive: { male: number; female: number; unknown: number };
  staleActiveThresholdDays: number;
}

// ── Retention ────────────────────────────────────────────────

export interface CohortRow {
  cohort: string;
  size: number;
  retained: Record<string, number | null>;
}

export interface RetentionData {
  totalUsers: number;
  cohorts: CohortRow[];
  statusBreakdown: Record<string, number>;
  avgMatchesPerUser: number;
  reEngagementFunnel: Record<string, number>;
  weeklyRegistrations: Array<{ week: string; count: number }>;
  platformSplit: Array<{ platform: string; total: number; active: number; activeRate: number }>;
  topReferralSources: Array<{ source: string; count: number }>;
  referralUnknown: number;
}

// ── Dates ────────────────────────────────────────────────────

export interface DatesData {
  scheduledCount: number;
  completedCount: number;
  cancelledCount: number;
  completionRate: number;
  matchToDate: { n: number; median: number | null; p25: number | null; p75: number | null; mean: number | null };
  feedbackSentiment: Array<{ sentiment: string; count: number }>;
  chemistry: { positive: number; negative: number; ratio: number | null };
  silentIgnoreHistogram: HistogramBin[];
  totalSilentIgnores: number;
}

// ── Verification ─────────────────────────────────────────────

export interface VerificationData {
  funnel: Record<string, number>;
  totalUsers: number;
  faceMatchScoreHistogram: HistogramBin[];
  faceMatchSummary: { n: number; median: number | null; p25: number | null; p75: number | null; mean: number | null };
  skipped: number;
  skipRate: number;
  stuckPendingReview: Array<{
    id: string;
    telegramId: string;
    firstName: string | null;
    faceMatchScore: number | null;
    stuckSince: string;
    daysStuck: number;
  }>;
  stuckThresholdDays: number;
  reportsWeekly: Array<{ week: string; tier1: number; tier2: number; tier3: number }>;
  tierTotals: { 1: number; 2: number; 3: number };
  processingTime: Record<"tier1" | "tier2" | "tier3", { n: number; median: number | null; p25: number | null; p75: number | null; mean: number | null }>;
  falsePositiveProxy: number;
  falsePositiveRate: number | null;
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

// ── Report types ───────────────────────────────────────────────

export interface ReportUserRef {
  id: string;
  firstName: string;
  surname: string | null;
  telegramId: string;
  status?: string;
  strikes?: number;
}

export interface ReportListItem {
  id: string;
  tier: number;
  rawText: string;
  reasonSummary: string | null;
  adminReviewed: boolean;
  createdAt: string;
  reporter: ReportUserRef;
  reported: ReportUserRef;
  match: { id: string; status: string };
}

export interface ReportsListResponse {
  data: ReportListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReportsStatsData {
  total: number;
  byTier: Record<number, number>;
  unreviewedTier3: number;
}

// ── Fetcher ─────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem("admin_api_key");
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
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

export const getAudience = () =>
  apiFetch<AudienceData>("/admin/analytics/audience");

export const getHeatmap = () =>
  apiFetch<HeatmapData>("/admin/analytics/audience/heatmap");

export const getAlgorithm = () =>
  apiFetch<AlgorithmData>("/admin/analytics/algorithm");

export const getGenderAnalytics = () =>
  apiFetch<GenderData>("/admin/analytics/gender");

export const getRetention = () =>
  apiFetch<RetentionData>("/admin/analytics/retention");

export const getDates = () =>
  apiFetch<DatesData>("/admin/analytics/dates");

export const getVerification = () =>
  apiFetch<VerificationData>("/admin/analytics/verification");

export const getUsers = (limit = 20, offset = 0) =>
  apiFetch<UsersListResponse>(`/admin/users?limit=${limit}&offset=${offset}`);

export const getUserDetail = (id: string) =>
  apiFetch<UserDetail>(`/admin/users/${encodeURIComponent(id)}`);

// ── Reports ────────────────────────────────────────────────────

export const getReportsStats = () =>
  apiFetch<ReportsStatsData>("/admin/reports/stats");

export function getReports(
  limit = 20,
  offset = 0,
  filters?: { tier?: number; reviewed?: boolean },
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (filters?.tier !== undefined) params.set("tier", String(filters.tier));
  if (filters?.reviewed !== undefined)
    params.set("reviewed", String(filters.reviewed));
  return apiFetch<ReportsListResponse>(`/admin/reports?${params}`);
}

export const markReportReviewed = (id: string) =>
  apiFetch<{ ok: boolean }>(`/admin/reports/${encodeURIComponent(id)}/review`, {
    method: "PATCH",
  });
