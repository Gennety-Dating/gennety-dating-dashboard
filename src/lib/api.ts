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

// ── Cities ────────────────────────────────────────────────────

export interface CityRow {
  cityKey: string;
  city: string;
  countryCode: string | null;
  total: number;
  male: number;
  female: number;
  unknown: number;
  /** How many of this city's users were placed by their date departure pin. */
  fromDeparture: number;
}

export interface CitiesData {
  totalUsers: number;
  attribution: { byDeparture: number; byMatchingCity: number; unknown: number };
  cities: CityRow[];
}

// ── Audience ──────────────────────────────────────────────────

export interface AudienceData {
  totalUsers: number;
  age: Array<{ bucket: string; count: number }>;
  majorClusters: Array<{ cluster: string; count: number }>;
  topHobbies: Array<{ name: string; count: number }>;
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
  /**
   * Free-text on the backend (`Profile.partnerPreferences` is a String column),
   * NOT an array — declaring it `string[]` is what let a `.map` call ship and
   * blank the profile drawer. Render these through `toTagList()`.
   */
  partnerPreferences: string | string[] | null;
  /** Not returned by `/admin/users/:id` today; kept optional, never assumed. */
  visualPreferences?: string | string[] | null;
  psychologicalSummary: string | null;
  /** Free-text on the backend, same as `partnerPreferences`. */
  negativeConstraints: string | string[] | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  photos: string[];
  /**
   * Face-match score per photo, strictly 1:1 with `photos` — `photos[i]` was
   * scored `photoFaceScores[i]` against the liveness selfie.
   */
  photoFaceScores?: number[];
  /**
   * The attractiveness league. Seeded at verification from the AI vision pass
   * (0..100 → Elo 200..800) and read by the match engine's `V_league`
   * multiplier, so this is the single number that decides who a user is shown
   * to. 500 is the un-seeded default.
   */
  eloScore?: number;
  eloMatchesPlayed?: number;
  eloSeededAt?: string | null;
  homeCity?: string | null;
  homeCityKey?: string | null;
}

/** Everything `/admin/users/:id` adds on top of the list payload. */
export interface UserProfileDetail extends UserProfile {
  /** Per-photo audit behind `eloScore` — the vision model's own breakdown. */
  eloSeedDetails?: unknown;
  matchRadius?: string | null;
  timeZone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lastMatchedAt?: string | null;
  standbyCount?: number;
  missedWeeks?: number;
  lastMissedAt?: string | null;
  silentIgnoreCount?: number;
  /** True while the profile is withheld from the pool pending a re-embed. */
  embeddingDirty?: boolean;
  embeddingDirtyAt?: string | null;
  fridayVibeText?: string | null;
  vibeFocusText?: string | null;
  energyAxis?: number | null;
  orientationAxis?: number | null;
  socialRole?: string | null;
  anchorTags?: string[];
  appearanceTags?: unknown;
  typeRadarCompletedAt?: string | null;
  updatedAt?: string | null;
}

// ── Account health ────────────────────────────────────────────
// Mirrors apps/bot/src/admin/utils/user-health.ts. The classification is
// computed server-side and is NOT stored on the user row, so the dashboard
// must never re-derive it from status/verification — it would drift.

export type UserHealthClass =
  | "test"
  | "suspicious"
  | "stuck_onboarding"
  | "cold_open_unengaged"
  | "inactive"
  | "live"
  | "other";

export interface UserHealthBadge {
  classification: UserHealthClass | null;
  /** For `stuck_onboarding`: the step the user stopped at. */
  subclass: string | null;
  matchmaking_eligible: boolean;
}

export interface UserHealthSummary {
  byClass: Record<UserHealthClass, number>;
  matchmaking_eligible: { count: number; of_total: number };
  total: number;
  /** Real users = total minus test accounts. Every conversion divides by this. */
  real: number;
  verified_real: number;
  scanned: number;
  truncated: boolean;
  config: {
    inactive_days: number;
    cold_open_hours: number;
    suspicious_min_messages: number;
    suspicious_max_response_sec: number;
    bot_batch_window_min: number;
    bot_batch_min_users: number;
  };
}

export interface OnboardingHealthFunnel {
  registered_real: number;
  gave_consent: number;
  completed_onboarding: number;
  active_verified: number;
  conversion_consent_to_active_pct: number | null;
  conversion_registered_to_active_pct: number | null;
}

/**
 * Net Match → Date Ticket conversion.
 *
 * Every field is DERIVED server-side from columns the product already writes
 * — there is no event table — which is why it is populated across the whole
 * match history rather than starting on a deploy date.
 *
 * Two things a reader has to hold onto:
 *
 *  - `null` means "no data" (empty denominator), NOT 0%. A measured zero and
 *    an absent measurement are different claims, and only one of them is an
 *    argument for changing the product.
 *  - `deductions` is the UNION of no-show / ghost / refund intersected with
 *    paid matches, never their sum: a no-show is usually also a refund, so
 *    adding them subtracts one ruined date twice.
 */
export interface MatchConversion {
  /** Denominator: both sides said yes. Synthetic and test pairs removed. */
  confirmed: number;
  /** Numerator before deductions: BOTH ticket slots settled. */
  ticketsPurchased: number;
  /** One slot of two — not a date yet, and never counted as half a sale. */
  ticketsPartial: number;
  noShow: number;
  ghostDuringScheduling: number;
  refunded: number;
  deductions: number;
  netPct: number | null;
  grossPct: number | null;
  noShowRateOfPaidPct: number | null;
  ghostRateOfPaidPct: number | null;
  excludedSynthetic: number;
  excludedTest: number;
}

/**
 * Gender split of the real user base.
 *
 * `unknown` is not noise — gender is asked early in onboarding, so everyone
 * who abandoned before that step lands here. Rendering the male share without
 * naming that number describes a fraction of the base as the whole base.
 */
export interface GenderRatio {
  male: number;
  female: number;
  unknown: number;
  total: number;
  malePctOfKnown: number | null;
  femalePctOfKnown: number | null;
  unknownPctOfTotal: number | null;
}

/** Mirrors GET /admin/stats. */
export interface AdminStatsData {
  users: { total: number; byStatus: Record<string, number> };
  onboarding: { byStep: Record<string, number> };
  verification: { byStatus: Record<string, number> };
  matches: { total: number; byStatus: Record<string, number>; live: number };
  reports: { total: number; byTier: Record<string, number>; unreviewedTier3: number };
  userHealth: UserHealthSummary;
  funnel: OnboardingHealthFunnel;
  conversion: MatchConversion;
  genderRatio: GenderRatio;
  generatedAt: string;
}

/**
 * The daily "Core metrics" block — GET /admin/dashboard.
 *
 * A superset of /admin/stats plus `derived`. The money-per-acquisition trio
 * (cacPerPayingUsdCents / cacPerActiveUsdCents / ltvCac / roas) is computed
 * from ad spend entered on the /ad-spend page (AD_SPEND_TRACKING_DESIGN.md in
 * the backend repo). It renders `null`, never zero, whenever the underlying
 * spend or cohort is empty — "no data" and "acquired for free" are different
 * claims, and only the first one is ever true here.
 */
export interface AdminDashboardDerived {
  /** North Star: dates whose SECOND ticket slot settled in the last 7 days. */
  weeklyPaidDates: number;
  matchToTicketConversionPct: number | null;
  matchToTicketGrossPct: number | null;
  matchNoShowRatePct: number | null;
  matchGhostRatePct: number | null;
  /**
   * Named for what it measures. Installs are tracked nowhere — iOS has not
   * shipped, and the channel is recorded at registration — so calling this
   * "install → match" would put one metric's name over another's number.
   */
  registeredToMatchRate7dPct: number | null;
  registeredReal7d: number;
  matchedLast7Days: number;
  cacPerPayingUsdCents: number | null;
  cacPerActiveUsdCents: number | null;
  ltvCac: number | null;
  roas: number | null;
  /** All spend entered, including content_production/agency/unattributed — the founder's own P&L total, wider than what CAC is computed from. */
  totalMarketingSpendUsdCents: number;
  adSpendByChannel: ChannelAcquisitionCostRow[];
  signupsLast7Days: number;
  activeRate: number;
  verifiedRate: number;
  matchAcceptanceRate: number;
}

export interface AdminDashboardData extends AdminStatsData {
  derived: AdminDashboardDerived;
}

/** One account's classification plus WHICH rule fired. */
export interface UserHealthDetail {
  user_id: string;
  classification: UserHealthClass;
  subclass: string | null;
  reason: string;
  rules_fired: string[];
  matchmaking_eligible: boolean;
  user_summary: {
    first_name: string | null;
    status: string;
    onboarding_step: string;
    verification_status: string;
    message_count_in: number;
    created_at: string;
    last_message_at: string | null;
    days_since_last_message: number | null;
  };
  signals: {
    photo_count: number;
    face_match_score: number | null;
    face_matched_at: string | null;
    median_response_sec: number | null;
    response_samples: number;
    registration_burst_size: number;
  };
}

export interface UserListItem {
  id: string;
  telegramId: string;
  telegramUsername?: string | null;
  firstName: string;
  surname: string | null;
  age: number | null;
  gender: string | null;
  preference: string | null;
  major: string | null;
  language: string | null;
  platform?: string;
  status: string;
  onboardingStep: string;
  registrationTrack?: string | null;
  universityDomain: string | null;
  email: string | null;
  createdAt: string;
  lastMessageAt?: string | null;
  verificationStatus?: string;
  verifiedAt?: string | null;
  verifiedSelfiePath?: string | null;
  faceMatchScore?: number | null;
  faceMatchedAt?: string | null;
  profile: UserProfile | null;
  /**
   * Where this person is, and whether we can match them there. Computed
   * server-side from whichever of the two places their city lives — a launched
   * dating city on the profile, or a city-waitlist row — so the dashboard never
   * has to know which keys are launched. `null` = they have not answered the
   * city step yet, which is a third thing and reads as a dash.
   */
  city?: UserCity | null;
  /** Spend summary, batched server-side for the whole page (no N+1). */
  purchaseSummary?: UserPurchaseSummary;
  /** Account-health badge, classified server-side. */
  health?: UserHealthBadge;
}

/** `active` = matchable here. `waitlist` = waiting for the city to open. */
export type CityStatus = "active" | "waitlist";

export interface UserCity {
  cityKey: string;
  city: string;
  countryCode: string | null;
  status: CityStatus;
}

// ── City catalog + waitlist ───────────────────────────────────
// Mirrors GET /admin/cities and GET /admin/analytics/waitlist. Distinct from
// `CitiesData` (/admin/analytics/cities), which distributes the EXISTING user
// base across cities: nobody on the waitlist has a matching city to be
// distributed by, so "people we serve here" and "people who want us here" are
// two numbers, not one.

export interface CityCatalogEntry {
  cityKey: string;
  city: string;
  countryCode: string;
  status: CityStatus;
}

export interface CityCatalogData {
  cities: CityCatalogEntry[];
}

export interface WaitlistCityRow extends CityCatalogEntry {
  total: number;
  male: number;
  female: number;
  unknown: number;
  firstJoinedAt: string | null;
  lastJoinedAt: string | null;
}

export interface WaitlistData {
  totalWaiting: number;
  /** Every waitlist city, including the empty ones, busiest first. */
  cities: WaitlistCityRow[];
  /** Rows on a key the catalog no longer has. Normally empty. */
  orphaned: Array<{ cityKey: string; total: number }>;
}

// ── Purchases ─────────────────────────────────────────────────
// Mirrors GET /admin/purchases. The backend unifies four tables (ticket
// ledger, subscription ledger, rematch purchases, venue-change purchases)
// into one row shape — see apps/bot/src/services/purchases.ts.

export type PurchaseKind = "tickets" | "date_ticket" | "premium" | "rematch" | "venue_change";
export type PurchaseStatus = "settled" | "processing" | "refunded" | "refund_failed";
export type PurchaseProvider = "telegram_stars" | "app_store" | "mock" | "unknown";

/** The payer, inlined on every purchase row so the list needs no second call. */
export interface PurchasePayer {
  id: string;
  firstName: string | null;
  surname: string | null;
  age: number | null;
  gender: string | null;
  telegramId: string;
  telegramUsername: string | null;
  phone: string | null;
  email: string | null;
  platform: string;
  status: string;
  ticketBalance: number;
  premiumUntil: string | null;
  /** A mobile-only account carries a synthetic NEGATIVE Telegram id. */
  isMobileOnlyId: boolean;
}

export interface PurchaseRow {
  id: string;
  source: string;
  kind: PurchaseKind;
  userId: string;
  provider: PurchaseProvider;
  status: PurchaseStatus;
  /** The source table's own status/reason string, unmapped. */
  rawStatus: string;
  amountStars: number | null;
  amountCents: number | null;
  currency: string | null;
  /** Exact when the rail reports a price; a Stars estimate otherwise. */
  usdCents: number | null;
  amountIsEstimate: boolean;
  detail: string | null;
  matchId: string | null;
  externalPaymentId: string | null;
  createdAt: string;
  user: PurchasePayer | null;
}

export interface PurchaseTotals {
  count: number;
  stars: number;
  usdCents: number;
  refundedCount: number;
}

export interface PurchasesResponse {
  data: PurchaseRow[];
  total: number;
  limit: number;
  offset: number;
  totals: PurchaseTotals;
  byKind: Array<{ kind: PurchaseKind; count: number; stars: number; usdCents: number }>;
}

// ── Ad spend (GET/POST/DELETE /admin/ad-spend) ───────────────────
// The founder's own record of acquisition spend — what /admin/dashboard's
// CAC/LTV:CAC/ROAS fields are computed from (AD_SPEND_TRACKING_DESIGN.md in
// the backend repo). Entered by hand, roughly weekly, so this is unpaginated
// unlike PurchasesResponse.

export const AD_SPEND_CATEGORIES = [
  "performance_ads",
  "influencer",
  "offline_event",
  "content_production",
  "agency",
  "other",
] as const;
export type AdSpendCategory = (typeof AD_SPEND_CATEGORIES)[number];

/** Spend with no channel to attribute — content shoots, agency retainers. */
export const AD_SPEND_UNATTRIBUTED_CHANNEL = "unattributed";

/**
 * Days past the spend period a conversion still counts toward it. `null` =
 * no plausible signal at all, excluded from per-channel CAC (still counted
 * in the P&L total). Mirrors admin/utils/ad-spend.ts in the backend repo —
 * these are tunable defaults there, not a contract, so keep the two in sync
 * by eye rather than assuming this file is authoritative.
 */
export const AD_SPEND_ATTRIBUTION_WINDOW_DAYS: Record<AdSpendCategory, number | null> = {
  performance_ads: 3,
  influencer: 14,
  offline_event: 28,
  content_production: null,
  agency: null,
  other: 7,
};

/** content_production/agency buy no trackable acquisition — the server enforces this too; this is only for the form's own validation message. */
export function categoryRequiresUnattributed(category: AdSpendCategory): boolean {
  return category === "content_production" || category === "agency";
}

export interface AdSpendRow {
  id: string;
  channel: string;
  category: AdSpendCategory;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  amountUsdCents: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdSpendListResponse {
  data: AdSpendRow[];
  total: number;
}

export interface AdSpendUpsertInput {
  channel: string;
  category: AdSpendCategory;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  amountUsdCents: number;
  note?: string | null;
}

/**
 * One channel's slice of /admin/dashboard's derived CAC block. `matured` is
 * true only once every entry's attribution window has fully elapsed — a
 * channel still inside its window reports real-so-far numbers with
 * `matured: false`, never a hidden "wait and see" gap.
 */
export interface ChannelAcquisitionCostRow {
  channel: string;
  spendUsdCents: number;
  signups: number;
  newPayers: number;
  newActive: number;
  cplUsdCents: number | null;
  cacPerPayingUsdCents: number | null;
  matured: boolean;
}

// ── Monetization (GET /admin/analytics/monetization) ────────────
// The conversion view. NOT the same thing as /admin/purchases: that one is
// the LEDGER (which payments happened), this one is the RATE (what share of
// people pay). The ledger has no denominator; this has no individual rows.
//
// Every denominator here excludes test/synthetic accounts, so `registeredReal`
// is deliberately smaller than `AdminStatsData.users.total` — mirrors
// apps/bot/src/admin/utils/monetization.ts.

/** One conversion: payers / base. `pct` is null when the base is empty. */
export interface ConversionSlice {
  payers: number;
  base: number;
  pct: number | null;
}

export interface MonetizationRevenue {
  allTimeUsdCents: number;
  thisWeekUsdCents: number;
  lastWeekUsdCents: number;
  growthPct: number | null;
  stars: number;
  /** Revenue per real user. */
  arpuUsdCents: number | null;
  /** Revenue per paying user. */
  arppuUsdCents: number | null;
  avgOrderUsdCents: number | null;
  /** Money that went through test accounts and is NOT in the figures above. */
  excludedTestUsdCents: number;
  /**
   * Always true — Telegram publishes no Stars→USD rate, so dollar figures come
   * from a documented constant. The UI is required to say so on screen.
   */
  usdIsEstimate: true;
}

export interface MonetizationKindRow {
  kind: PurchaseKind;
  /** Distinct payers, not rows. */
  payers: number;
  purchases: number;
  usdCents: number;
}

export interface MonetizationCohortRow {
  /** ISO date of the Monday of the signup week. */
  weekStart: string;
  size: number;
  payers: number;
  payingRatePct: number | null;
  /** Too young to have converted yet — a low % here is absence, not a result. */
  censored: boolean;
}

export interface MonetizationSegmentRow {
  key: string;
  users: number;
  payers: number;
  payingRatePct: number | null;
  usdCents: number;
}

export interface MonetizationData {
  headline: {
    payers: number;
    registeredReal: number;
    payingRatePct: number | null;
    ofRegistered: ConversionSlice;
    ofActivated: ConversionSlice;
    ofPaywallReached: ConversionSlice;
    newPayersThisWeek: number;
    newPayersLastWeek: number;
  };
  revenue: MonetizationRevenue;
  byKind: MonetizationKindRow[];
  cohorts: MonetizationCohortRow[];
  segments: {
    byChannel: MonetizationSegmentRow[];
    byGender: MonetizationSegmentRow[];
    byCity: MonetizationSegmentRow[];
    byTrack: MonetizationSegmentRow[];
  };
  repeat: {
    oncePayers: number;
    repeatPayers: number;
    repeatRatePct: number | null;
    purchasesPerPayer: number | null;
  };
  timing: {
    medianDaysToFirstPayment: number | null;
    p90DaysToFirstPayment: number | null;
  };
  /** Paid and got it all back: not payers, but not nobody either. */
  refundedOnlyPayers: number;
  excludedTestUsers: number;
  cohortMaturityDays: number;
  truncated: boolean;
}

/** Per-user spend summary carried by the user list and the user card. */
export interface UserPurchaseSummary {
  count: number;
  stars: number;
  usdCents: number;
  refundedCount: number;
  lastPurchaseAt: string | null;
}

/** One pairing this user has been in, either side. */
export interface UserMatchRow {
  id: string;
  status: string;
  source: string | null;
  createdAt: string;
  agreedTime: string | null;
  venueName: string | null;
  synergyScore: number | null;
  partnerId: string | null;
  partnerName: string | null;
  /** `null` = never answered — the difference between a pass and a ghost. */
  myDecision: boolean | null;
  partnerDecision: boolean | null;
}

export interface UserProfilerAnswer {
  questionId: string;
  priority: string;
  answerText: string | null;
  skipped: boolean;
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
  profile: UserProfileDetail | null;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  isEmailVerified?: boolean;
  verificationSkippedAt?: string | null;
  theme?: string | null;
  researchOptIn?: boolean;
  termsAcceptedAt?: string | null;
  aiMemoryExportPreference?: string | null;
  referralSource?: string | null;
  ticketBalance?: number;
  premiumUntil?: string | null;
  premiumProvider?: string | null;
  strikes?: number;
  suspendedUntil?: string | null;
  matches?: UserMatchRow[];
  profilerAnswers?: UserProfilerAnswer[];
  /** Everything this person ever paid for, newest first. */
  purchases?: PurchaseRow[];
  purchaseSummary?: UserPurchaseSummary;
}

// ── Conversation viewer ─────────────────────────────────────────
// Mirrors GET /admin/users/:id/conversation. Merges both backend stores
// (Telegram messageHistory + mobile-chat Message rows) into one normalized
// transcript; profile photos come back as a separate gallery.

export type MediaType = "telegram" | "photo" | "chat";

export interface ConversationToolCall {
  name: string;
  arguments: string;
}

export interface ConversationImage {
  type: "chat";
  ref: string;
}

export interface ConversationMessage {
  id: string;
  source: "telegram" | "mobile";
  role: string;
  text: string | null;
  createdAt: string | null;
  technical: boolean;
  toolCalls?: ConversationToolCall[];
  image?: ConversationImage;
}

export interface ConversationPhoto {
  type: "photo";
  ref: string;
}

// ── Dialogs (GET /admin/dialogs) ────────────────────────────────
// The richer conversation reader. Unlike /admin/users/:id/conversation
// (agent + mobile only), this merges a THIRD store — `chat_events` — so the
// transcript shows what the bot actually SENT from its ~276 non-agent call
// sites, which buttons were on offer, and what the user tapped.

export type DialogSource = "agent" | "mobile" | "timeline";
export type DialogDirection = "in" | "out";

/** A button that was on offer with an outbound message. */
export interface DialogAction {
  label: string;
  data?: string;
  webApp?: string;
}

/**
 * An attachment the transcript can actually render.
 *
 * `ref` is a Telegram `file_id` streamed through `GET /admin/media?type=
 * telegram` — a different media type from the mobile `image` below (a Supabase
 * object path), which is why it gets its own field. Moving formats (video,
 * video note, animation, sticker) carry their POSTER frame, since the proxy
 * streams images. `ref` is absent when Telegram gave us nothing renderable — a
 * voice note, a thumbnail-less document — and the row is still worth showing
 * as a labelled placeholder.
 */
export interface DialogMedia {
  type: "telegram";
  kind: string;
  ref?: string;
}

export interface DialogMessage {
  id: string;
  source: DialogSource;
  direction: DialogDirection;
  role: string;
  text: string | null;
  createdAt: string | null;
  technical: boolean;
  /** agent rows only */
  toolCalls?: ConversationToolCall[];
  /** mobile-chat rows only */
  image?: ConversationImage;
  /** timeline rows only */
  kind?: string;
  surface?: string | null;
  actions?: DialogAction[] | null;
  media?: DialogMedia[] | null;
  matchId?: string | null;
}

export interface DialogParticipant {
  userId: string;
  displayName: string | null;
  telegramId: string;
  telegramUsername: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  cityKey: string | null;
  language: string | null;
  platform: string;
  status: string;
  onboardingStep: string;
  registrationTrack: string | null;
  verificationStatus: string;
  createdAt: string;
}

export interface DialogCounts {
  total: number;
  agent: number;
  mobile: number;
  timeline: number;
}

/**
 * The list row's preview. NOTE: `lastMessage` is an OBJECT, not a string —
 * only its `text` field is the ≤200-char preview. Rendering the object
 * directly throws "Objects are not valid as a React child" and blanks the
 * page, so always read `.text`.
 */
export interface DialogPreview {
  source: DialogSource;
  direction: DialogDirection;
  text: string | null;
  createdAt: string | null;
}

export interface DialogListRow {
  id: string;
  participant: DialogParticipant;
  counts: DialogCounts;
  lastMessageAt: string | null;
  lastMessage: DialogPreview | null;
  messages?: DialogMessage[];
}

export interface DialogsListResponse {
  data: DialogListRow[];
  total: number;
  limit: number;
  offset: number;
  sources: Record<DialogSource, boolean>;
}

export interface DialogDetail {
  id: string;
  participant: DialogParticipant;
  counts: DialogCounts;
  sources: Record<DialogSource, boolean>;
  messages: DialogMessage[];
  photos: ConversationPhoto[];
}

export interface DialogFilters {
  status?: string;
  platform?: string;
  search?: string;
  activeSince?: string;
}

export interface UserConversation {
  userId: string;
  telegramId: string;
  displayName: string | null;
  messages: ConversationMessage[];
  photos: ConversationPhoto[];
}

// ── Report types ───────────────────────────────────────────────

export interface ReportUserRef {
  id: string;
  firstName: string | null;
  surname: string | null;
  telegramId: string;
  email: string | null;
  status: string;
  verificationStatus: string;
  isEmailVerified: boolean;
  strikes: number;
  profile: {
    height: number | null;
    hobbies: string[];
    /** Free-text on the backend — see `UserProfile`. Render via `toTagList()`. */
    partnerPreferences: string | string[] | null;
    psychologicalSummary: string | null;
    /** Free-text on the backend — see `UserProfile`. Render via `toTagList()`. */
    negativeConstraints: string | string[] | null;
    ageRangeMin: number | null;
    ageRangeMax: number | null;
    photos: string[];
  } | null;
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

// ── Weekly matches (founder report parity) ──────────────────────

export interface WeeklyMatchesUserCard {
  userId: string;
  firstName: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  verificationStatus: string;
  /** 0..100 vision attractiveness score (null until the Elo vision seed ran). */
  attractiveness: number | null;
  /** Telegram file_id / Supabase path refs (served via /admin/media). */
  photoRefs: string[];
}

export interface WeeklyMatchesPair {
  matchId: string;
  status: string;
  synergyScore: number | null;
  synergyReason: string | null;
  createdAtIso: string;
  users: [WeeklyMatchesUserCard, WeeklyMatchesUserCard];
}

export interface WeeklyMatchesData {
  weekOf: string;
  pairs: WeeklyMatchesPair[];
}

// ── Fetcher ─────────────────────────────────────────────────────

/**
 * When the analytics data on screen was actually computed.
 *
 * The backend serves the heavy endpoints from a cache with TTLs up to 30
 * minutes, so "the page just loaded" and "these numbers are current" are two
 * different claims. It reports the real generation time on every cached
 * response (`X-Data-Generated-At`), and the last one seen is recorded here for
 * the header to show — without threading a return shape through every caller.
 */
let lastGeneratedAt: string | null = null;

export function getDataGeneratedAt(): string | null {
  return lastGeneratedAt;
}

/**
 * Ask the server to bypass its cache for this call.
 *
 * A Refresh button that re-serves the same cached payload is worse than none:
 * it asserts the numbers are current when they may be half an hour old.
 */
export function fresh(path: string): string {
  return path.includes("?") ? `${path}&fresh=1` : `${path}?fresh=1`;
}

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
    // The status rides along so a caller can tell "this server does not serve
    // this endpoint yet" (404, i.e. the backend is a deploy behind the client)
    // from a real failure. The message is deliberately unchanged, so every
    // existing consumer behaves exactly as before.
    const err = new Error(`API error: ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // Exposed via CORS `exposedHeaders`; absent on the uncached endpoints, which
  // must not clobber a real stamp from a cached one.
  const generatedAt = res.headers.get("X-Data-Generated-At");
  if (generatedAt) lastGeneratedAt = generatedAt;

  return res.json() as Promise<T>;
}

// ── Endpoint functions ──────────────────────────────────────────

export const getDemographics = () =>
  apiFetch<DemographicsData>("/admin/analytics/demographics");

export const getFunnel = () =>
  apiFetch<FunnelData>("/admin/analytics/funnel");

export const getMatches = () =>
  apiFetch<MatchesData>("/admin/analytics/matches");

export const getWeeklyMatches = (weekOf?: string) =>
  apiFetch<WeeklyMatchesData>(
    `/admin/analytics/weekly-matches${weekOf ? `?weekOf=${encodeURIComponent(weekOf)}` : ""}`,
  );

export const getAudience = (force = false) =>
  apiFetch<AudienceData>(force ? fresh("/admin/analytics/audience") : "/admin/analytics/audience");

export const getCities = (force = false) =>
  apiFetch<CitiesData>(force ? fresh("/admin/analytics/cities") : "/admin/analytics/cities");

export const getHeatmap = (force = false) =>
  apiFetch<HeatmapData>(force ? fresh("/admin/analytics/audience/heatmap") : "/admin/analytics/audience/heatmap");

export const getAlgorithm = (force = false) =>
  apiFetch<AlgorithmData>(force ? fresh("/admin/analytics/algorithm") : "/admin/analytics/algorithm");

export const getGenderAnalytics = (force = false) =>
  apiFetch<GenderData>(force ? fresh("/admin/analytics/gender") : "/admin/analytics/gender");

export const getRetention = (force = false) =>
  apiFetch<RetentionData>(force ? fresh("/admin/analytics/retention") : "/admin/analytics/retention");

export const getDates = (force = false) =>
  apiFetch<DatesData>(force ? fresh("/admin/analytics/dates") : "/admin/analytics/dates");

export const getVerification = (force = false) =>
  apiFetch<VerificationData>(force ? fresh("/admin/analytics/verification") : "/admin/analytics/verification");

/**
 * Paying-user conversion. Server-cached for 15 minutes like the other
 * analytics tabs — unlike `/admin/purchases`, which is a ledger and is
 * deliberately uncached.
 */
export const getMonetization = (force = false) =>
  apiFetch<MonetizationData>(
    force ? fresh("/admin/analytics/monetization") : "/admin/analytics/monetization",
  );

export const getUsers = (
  limit = 20,
  offset = 0,
  opts: {
    health?: UserHealthClass | "all";
    includeTest?: boolean;
    /** One city, whichever side it lives on. Empty = every city. */
    cityKey?: string;
    /** `active` | `waitlist` | `none`. Empty = no status filter. */
    cityStatus?: CityStatus | "none" | "";
  } = {},
) => {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (opts.health && opts.health !== "all") params.set("health", opts.health);
  // The API defaults to including test accounts; the dashboard defaults to
  // hiding them, so the flag is sent explicitly rather than assumed.
  if (opts.includeTest === false) params.set("includeTest", "false");
  // Both filters are applied in SQL, so `total` and the pagination stay true
  // to them rather than describing the unfiltered base.
  if (opts.cityKey) params.set("cityKey", opts.cityKey);
  if (opts.cityStatus) params.set("cityStatus", opts.cityStatus);
  return apiFetch<UsersListResponse>(`/admin/users?${params.toString()}`);
};

/** The city catalog — launched markets first, then the expansion list. */
export const getCityCatalog = () => apiFetch<CityCatalogData>("/admin/cities");

/**
 * How many people are waiting per unlaunched city. Uncached server-side: the
 * one thing a demand signal must not be is half an hour old.
 */
export const getWaitlist = () => apiFetch<WaitlistData>("/admin/analytics/waitlist");

/**
 * Headline counters + account health + the onboarding funnel, in one call.
 * Uncached server-side, so it always reflects the database right now.
 */
export const getAdminStats = () => apiFetch<AdminStatsData>("/admin/stats");

/**
 * The daily Core-metrics superset. Uncached server-side like /admin/stats,
 * so Refresh is honest here without a `force` parameter.
 */
export const getAdminDashboard = () =>
  apiFetch<AdminDashboardData>("/admin/dashboard");

/** One account's health verdict, with the rules that produced it. */
export const getUserHealth = (userId: string) =>
  apiFetch<UserHealthDetail>(`/admin/users/${userId}/health`);

/**
 * One page of the purchase ledger. Deliberately uncached server-side — a
 * founder checking whether a payment landed must not be shown a stale answer.
 */
export const getPurchases = (params: {
  limit?: number;
  offset?: number;
  kind?: PurchaseKind | "";
  status?: PurchaseStatus | "";
  userId?: string;
  since?: string;
  until?: string;
}) => {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? 50));
  query.set("offset", String(params.offset ?? 0));
  if (params.kind) query.set("kind", params.kind);
  if (params.status) query.set("status", params.status);
  if (params.userId) query.set("userId", params.userId);
  if (params.since) query.set("since", params.since);
  if (params.until) query.set("until", params.until);
  return apiFetch<PurchasesResponse>(`/admin/purchases?${query.toString()}`);
};

// ── Ad spend ───────────────────────────────────────────────────
// Unpaginated — this is a founder-entered log, not a high-volume ledger.

export const getAdSpend = (params?: {
  channel?: string;
  category?: AdSpendCategory | "";
  from?: string;
  to?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.channel) query.set("channel", params.channel);
  if (params?.category) query.set("category", params.category);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  const qs = query.toString();
  return apiFetch<AdSpendListResponse>(`/admin/ad-spend${qs ? `?${qs}` : ""}`);
};

/** The channel picker's options — real users' first-touch channels union logged spend channels union "unattributed". */
export const getAdSpendChannels = () =>
  apiFetch<{ channels: string[] }>("/admin/ad-spend/channels");

/** Upsert on (channel, category, periodStart, periodEnd) — re-submitting the same key updates the row instead of duplicating it. */
export const upsertAdSpend = (body: AdSpendUpsertInput) =>
  apiFetch<AdSpendRow>("/admin/ad-spend", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const deleteAdSpend = (id: string) =>
  apiFetch<{ ok: boolean }>(`/admin/ad-spend/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const getUserDetail = (id: string) =>
  apiFetch<UserDetail>(`/admin/users/${encodeURIComponent(id)}`);

export const getUserConversation = (id: string) =>
  apiFetch<UserConversation>(
    `/admin/users/${encodeURIComponent(id)}/conversation`,
  );

// ── Dialogs ────────────────────────────────────────────────────

export function getDialogs(limit = 25, offset = 0, filters?: DialogFilters) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.platform) params.set("platform", filters.platform);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.activeSince) params.set("activeSince", filters.activeSince);
  return apiFetch<DialogsListResponse>(`/admin/dialogs?${params}`);
}

/**
 * `:id` is the USER id — a dialog is user↔bot and has exactly one human.
 * `includeTechnical` surfaces system/tool turns, hidden by default.
 */
export function getDialog(
  id: string,
  opts?: { limit?: number; order?: "asc" | "desc"; includeTechnical?: boolean },
) {
  const params = new URLSearchParams({
    limit: String(opts?.limit ?? 300),
    order: opts?.order ?? "asc",
  });
  if (opts?.includeTechnical) params.set("includeTechnical", "true");
  return apiFetch<DialogDetail>(
    `/admin/dialogs/${encodeURIComponent(id)}?${params}`,
  );
}

/**
 * Build the authenticated image-proxy URL. The Bearer key is NEVER put in the
 * query string — callers fetch this URL with the Authorization header and
 * convert the response to a blob URL (see <AuthedImage>).
 */
export function mediaUrl(type: MediaType, ref: string): string {
  return `${BASE_URL}/admin/media?type=${type}&ref=${encodeURIComponent(ref)}`;
}

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

// ── Cohort retention ─────────────────────────────────────────
/**
 * "Of the people who registered in one bucket, how many were still active N
 * days later" — the classic cohort question, sliced by acquisition channel so
 * it can be read beside CAC.
 *
 * Deliberately NOT the same thing as `RetentionData` above, which is a
 * SURVIVAL curve (last activity ≥ N weeks out) and therefore always reads
 * higher. Both are kept because they answer different questions; do not
 * compare their numbers to each other.
 */
export type CohortBucket = "day" | "week" | "month";

/** Why a cell has no number. `no-data` never becomes `ok` with time. */
export type CohortCellStatus = "ok" | "immature" | "no-data";

export interface RetentionMilestone {
  day: number;
  windowDays: number;
}

export interface CohortCell {
  day: number;
  windowDays: number;
  status: CohortCellStatus;
  retained: number | null;
  retainedPct: number | null;
  churnedPct: number | null;
}

export interface CohortAverageCell extends CohortCell {
  cohorts: number;
  users: number;
}

export interface CohortMatrixRow {
  cohort: string;
  cohortStart: string;
  cohortEnd: string;
  size: number;
  lowSample: boolean;
  cells: CohortCell[];
}

export interface ChannelRetentionRow {
  channel: string;
  signups: number;
  cells: CohortAverageCell[];
}

export interface CohortRetentionData {
  generatedAt: string;
  timezone: string;
  bucket: CohortBucket;
  from: string;
  to: string;
  includeTest: boolean;
  milestones: RetentionMilestone[];
  coverage: {
    /** First UTC day the activity table can speak for; null = empty table. */
    activityFrom: string | null;
    lastCompleteDay: string;
  };
  overall: {
    bucket: CohortBucket;
    milestones: RetentionMilestone[];
    rows: CohortMatrixRow[];
    average: CohortAverageCell[];
    totalUsers: number;
  };
  byChannel: ChannelRetentionRow[];
  excludedTestUsers: number;
}

export const getCohortRetention = (bucket: CohortBucket, force = false) => {
  const path = `/admin/analytics/cohort-retention?bucket=${bucket}`;
  return apiFetch<CohortRetentionData>(force ? fresh(path) : path);
};
