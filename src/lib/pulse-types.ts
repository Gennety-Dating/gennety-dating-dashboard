/**
 * Response shapes of `GET /admin/pulse/*`, copied by hand from the backend.
 *
 * SOURCE OF TRUTH: Gennety Dating repo,
 *   apps/bot/src/admin/utils/pulse-types.ts
 * (`PulseMetricDef` from apps/bot/src/services/pulse/metrics-catalog.ts).
 * Keep this file a verbatim mirror — when a field moves there, move it here in
 * the same change. Times are ISO-8601 UTC strings; days are `YYYY-MM-DD` UTC.
 */

export type PulseSeverity = 1 | 2 | 3;

export type PulseInsightKind =
  | "stuck_people"
  | "funnel_drop"
  | "screen_friction"
  | "slow_decision"
  | "anomaly"
  | "unseen";

export type PulseMetricUnit = "count" | "people" | "ms" | "share" | "matches";

export interface PulseMetricDef {
  name: string;
  description: string;
  unit: PulseMetricUnit;
  grain: "day";
  dims: string;
  nMeans: string;
  minSample: number;
  thresholds?: Record<string, number>;
  anomaly?: true;
  source: string;
}

/** How much to trust the numbers before reading them. In every response. */
export interface PulseDataFreshness {
  lastEventAt: string | null;
  lastRollupAt: string | null;
  rollupStale: boolean;
  clientEventsEnabled: boolean;
  optInShare: number | null;
  optInN: number;
}

export interface PulseEnvelope {
  generatedAt: string;
  dataFreshness: PulseDataFreshness;
}

export interface PulseInsight {
  id: string;
  key: string;
  kind: PulseInsightKind;
  severity: PulseSeverity;
  scope: string;
  title: string;
  value: number | null;
  baseline: number | null;
  n: number;
  smallSample: boolean;
  evidence: Record<string, unknown>;
  codeHint: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  weight: number;
}

export type PulseBriefInsight = Pick<
  PulseInsight,
  "id" | "kind" | "severity" | "scope" | "title" | "n" | "smallSample" | "codeHint" | "weight"
>;

export interface PulseKpi {
  key: "new_users" | "onboarding_completed" | "dates_scheduled" | "revenue_usd";
  label: string;
  thisWeek: number | null;
  lastWeek: number | null;
  unit: "people" | "matches" | "usd";
  smallSample: boolean;
}

export interface PulseNextHint {
  endpoint: string;
  why: string;
}

export interface PulseBriefResponse extends PulseEnvelope {
  asOf: string;
  thisWeek: { from: string; to: string };
  lastWeek: { from: string; to: string };
  kpis: PulseKpi[];
  insights: PulseBriefInsight[];
  openInsights: number;
  next: PulseNextHint[];
}

export interface PulseScreenWindow {
  views: number;
  viewerDays: number;
  left: number;
  dwellP50Ms: number | null;
  dwellP90Ms: number | null;
  firstActionP50Ms: number | null;
  quickBack: number;
  deadTaps: number;
  rageTaps: number;
  exits: number;
  exitShare: number | null;
  friction: number | null;
  smallSample: boolean;
}

export type PulsePlatform = "ios" | "miniapp";

export interface PulseScreenSummary {
  screen: string;
  title: string;
  platform: PulsePlatform | null;
  codeHint: string | null;
  known: boolean;
  d7: PulseScreenWindow;
  d28: PulseScreenWindow;
}

export interface PulseScreensResponse extends PulseEnvelope {
  asOf: string;
  screens: PulseScreenSummary[];
}

export interface PulseScreenDay {
  day: string;
  views: number;
  left: number;
  dwellP50Ms: number | null;
  dwellP90Ms: number | null;
  firstActionP50Ms: number | null;
  quickBack: number;
  exits: number;
  taps: number;
  deadTaps: number;
  rageTaps: number;
}

export type PulsePoint = [number, number];

export interface PulseScreenDetailResponse extends PulseEnvelope {
  screen: string;
  title: string;
  platform: PulsePlatform | null;
  codeHint: string | null;
  tracksTaps: boolean;
  d7: PulseScreenWindow;
  d28: PulseScreenWindow;
  days: PulseScreenDay[];
  taps: {
    points: PulsePoint[];
    dead: PulsePoint[];
    rage: PulsePoint[];
    total: number;
    truncated: boolean;
  };
  elements: Array<{ element: string; taps: number }>;
  versions: Array<{ appVersion: string; views: number; quickBack: number; deadTaps: number }>;
  items: Array<{ item: string; seen: number; viewerDays: number }>;
}

export interface PulseJourneyItem {
  at: string;
  kind: "screen" | "tap_cluster" | "server_milestone";
  screen?: string;
  dwellMs?: number;
  label: string;
}

export interface PulseJourney {
  userId: string;
  platform: string;
  signupDate: string;
  stuck: { since: string; where: string; whereTitle: string; phase: "onboarding" | "date" } | null;
  items: PulseJourneyItem[];
  truncated: boolean;
}

export interface PulseJourneysResponse extends PulseEnvelope {
  stuckOnly: boolean;
  journeys: PulseJourney[];
}

export interface PulseJourneyResponse extends PulseEnvelope {
  journey: PulseJourney;
}

export interface PulseCatalogResponse extends PulseEnvelope {
  metrics: PulseMetricDef[];
  thresholds: Record<string, unknown>;
  screens: Array<{
    screen: string;
    title: string;
    platform: PulsePlatform;
    codeHint: string;
    tracksTaps: boolean;
    onboardingOrder: number | null;
  }>;
}

export interface PulseFunnelStep {
  step: string;
  title: string;
  d7: number;
  d28: number;
  conversionD7: number | null;
  conversionD28: number | null;
}

export interface PulseFunnel {
  id: string;
  title: string;
  enteredD7: number;
  enteredD28: number;
  smallSample: boolean;
  steps: PulseFunnelStep[];
}

export interface PulseFunnelsResponse extends PulseEnvelope {
  asOf: string;
  funnels: PulseFunnel[];
  money: Array<{ dim: string; shown: number; dismissed: number }>;
}

export interface PulseInsightsResponse extends PulseEnvelope {
  status: "open" | "all";
  insights: PulseInsight[];
}
