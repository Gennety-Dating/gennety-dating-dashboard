/**
 * DEV-ONLY fixtures for `VITE_PULSE_FIXTURES=1`.
 *
 * Shapes follow ./pulse-types.ts (and the activity / onboarding-funnel types in
 * ./api.ts). The numbers are invented, small-sample on purpose — that is what
 * production looks like today — and contain no real user data. Only loaded via
 * a dynamic import behind the build-time flag, so it never ships to Vercel.
 */
import type { ActivitySeriesData, OnboardingFunnelData } from "./api";
import type {
  PulseBriefResponse,
  PulseDataFreshness,
  PulseFunnelsResponse,
  PulseInsight,
  PulseInsightsResponse,
  PulseJourney,
  PulseJourneyResponse,
  PulseJourneysResponse,
  PulsePoint,
  PulseScreenDay,
  PulseScreenDetailResponse,
  PulseScreenSummary,
  PulseScreensResponse,
  PulseScreenWindow,
} from "./pulse-types";

const NOW = Date.now();
const iso = (hoursAgo: number) => new Date(NOW - hoursAgo * 3_600_000).toISOString();
const dayKey = (daysAgo: number) => new Date(NOW - daysAgo * 86_400_000).toISOString().slice(0, 10);

/** Deterministic PRNG so screenshots are stable. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const freshness: PulseDataFreshness = {
  lastEventAt: iso(0.2),
  lastRollupAt: iso(7.5),
  rollupStale: false,
  clientEventsEnabled: true,
  optInShare: 0.41,
  optInN: 34,
};

const env = { generatedAt: iso(0.05), dataFreshness: freshness };
const asOf = dayKey(1);

// ── Insights ────────────────────────────────────────────────────

const insights: PulseInsight[] = [
  {
    id: "f1a0c3b2-0000-4000-8000-000000000001",
    key: "stuck_people:city",
    kind: "stuck_people",
    severity: 3,
    scope: "city",
    title: "6 человек без движения больше 48 ч: «Город»",
    value: 6, baseline: null, n: 6, smallSample: true,
    evidence: { screen: "city", users: 6 },
    codeHint: "ios:App/Features/Onboarding/CityView.swift",
    firstSeenAt: iso(80), lastSeenAt: iso(7.5), resolvedAt: null, weight: 18,
  },
  {
    id: "f1a0c3b2-0000-4000-8000-000000000002",
    key: "funnel_drop:onboarding_ios:city",
    kind: "funnel_drop",
    severity: 3,
    scope: "onboarding_ios:city",
    title: "Онбординг iOS: после «Город» до «Анкета: основное» дошли 6 из 11 за 7 дней; за 4 недели до этого — 18 из 20",
    value: 0.4545, baseline: 0.1, n: 11, smallSample: true,
    evidence: { funnel: "onboarding_ios", from: "city", to: "interview_basics", entered: 11, passed: 6 },
    codeHint: "ios:App/Features/Onboarding/CityView.swift",
    firstSeenAt: iso(56), lastSeenAt: iso(7.5), resolvedAt: null, weight: 33,
  },
  {
    id: "f1a0c3b2-0000-4000-8000-000000000003",
    key: "screen_friction:paywall",
    kind: "screen_friction",
    severity: 2,
    scope: "paywall",
    title: "«Пейвол»: 4 касания мимо и 2 серии ярости на 20 показов за 7 дней",
    value: 12.5, baseline: 4.1, n: 20, smallSample: true,
    evidence: { views: 20, deadTaps: 4, rageTaps: 2 },
    codeHint: "ios:App/Features/Premium/Paywall/PaywallView.swift",
    firstSeenAt: iso(30), lastSeenAt: iso(7.5), resolvedAt: null, weight: 40,
  },
  {
    id: "f1a0c3b2-0000-4000-8000-000000000004",
    key: "slow_decision:today_calendar",
    kind: "slow_decision",
    severity: 2,
    scope: "today_calendar",
    title: "«Выбор времени»: до первого касания 14 с против обычных 5 с",
    value: 14000, baseline: 5000, n: 9, smallSample: true,
    evidence: { firstActionP50Ms: 14000, baselineMs: 5000 },
    codeHint: "ios:App/Features/Scheduling/CalendarView.swift",
    firstSeenAt: iso(29), lastSeenAt: iso(7.5), resolvedAt: null, weight: 18,
  },
  {
    id: "f1a0c3b2-0000-4000-8000-000000000005",
    key: "unseen:today:wingman_teaser",
    kind: "unseen",
    severity: 1,
    scope: "today:wingman_teaser",
    title: "Блок «wingman_teaser» на «Сегодня» видели ≥1 с только 3 из 17 открывших",
    value: 0.18, baseline: null, n: 17, smallSample: true,
    evidence: { seen: 3, viewerDays: 17 },
    codeHint: "ios:App/Features/Today/TodayView.swift",
    firstSeenAt: iso(150), lastSeenAt: iso(7.5), resolvedAt: null, weight: 17,
  },
  {
    id: "f1a0c3b2-0000-4000-8000-000000000006",
    key: "anomaly:dau:miniapp",
    kind: "anomaly",
    severity: 1,
    scope: "dau:miniapp",
    title: "DAU Mini App вчера 2 при обычных 7 ± 2 для этого дня недели",
    value: 2, baseline: 7, n: 2, smallSample: true,
    evidence: { value: 2, median: 7, mad: 2 },
    codeHint: null,
    firstSeenAt: iso(8), lastSeenAt: iso(7.5), resolvedAt: null, weight: 2,
  },
];

const byWeight = [...insights].sort((a, b) => b.weight - a.weight);

const brief: PulseBriefResponse = {
  ...env,
  asOf,
  thisWeek: { from: dayKey(7), to: dayKey(1) },
  lastWeek: { from: dayKey(14), to: dayKey(8) },
  kpis: [
    { key: "new_users", label: "Новые аккаунты", thisWeek: 9, lastWeek: 6, unit: "people", smallSample: true },
    { key: "onboarding_completed", label: "Закончили анкету (сервер: бот + iOS)", thisWeek: 5, lastWeek: 4, unit: "people", smallSample: true },
    { key: "dates_scheduled", label: "Пары, согласовавшие время (по дню создания пары)", thisWeek: 1, lastWeek: 2, unit: "matches", smallSample: true },
    { key: "revenue_usd", label: "Выручка, $ (оценка, Stars по курсу)", thisWeek: 16.98, lastWeek: 8.49, unit: "usd", smallSample: false },
  ],
  insights: byWeight.slice(0, 5).map(({ id, kind, severity, scope, title, n, smallSample, codeHint, weight }) => ({
    id, kind, severity, scope, title, n, smallSample, codeHint, weight,
  })),
  openInsights: insights.length,
  next: [{ endpoint: "/admin/pulse/funnels", why: "Онбординг по платформам и путь свидания — где теряем людей" }],
};

const insightsRes: PulseInsightsResponse = { ...env, status: "open", insights: byWeight };

// ── Screens ─────────────────────────────────────────────────────

function win(views: number, f: Partial<PulseScreenWindow> = {}): PulseScreenWindow {
  const quickBack = f.quickBack ?? Math.round(views * 0.08);
  const deadTaps = f.deadTaps ?? Math.round(views * 0.05);
  const rageTaps = f.rageTaps ?? 0;
  const exits = f.exits ?? Math.round(views * 0.05);
  const friction =
    views > 0 ? +(((0.35 * rageTaps + 0.25 * deadTaps + 0.2 * quickBack + 0.2 * exits) / views) * 100).toFixed(1) : null;
  return {
    views,
    viewerDays: Math.round(views * 0.7),
    left: Math.max(0, views - 1),
    dwellP50Ms: 3200,
    dwellP90Ms: 14000,
    firstActionP50Ms: 1900,
    quickBack,
    deadTaps,
    rageTaps,
    exits,
    exitShare: views >= 30 ? +(exits / Math.max(1, views - 1)).toFixed(2) : null,
    friction,
    smallSample: views < 30,
    ...f,
  };
}

const screenRows: PulseScreenSummary[] = [
  { screen: "paywall", title: "Пейвол", platform: "ios", known: true, codeHint: "ios:App/Features/Premium/Paywall/PaywallView.swift",
    d7: win(20, { quickBack: 2, deadTaps: 4, rageTaps: 2, exits: 2, dwellP50Ms: 4200, dwellP90Ms: 15000, firstActionP50Ms: 2600 }),
    d28: win(61, { quickBack: 5, deadTaps: 9, rageTaps: 3, exits: 4 }) },
  { screen: "city", title: "Город", platform: "ios", known: true, codeHint: "ios:App/Features/Onboarding/CityView.swift",
    d7: win(14, { quickBack: 1, deadTaps: 3, rageTaps: 1, exits: 3, dwellP50Ms: 9100, dwellP90Ms: 112000 }),
    d28: win(47, { quickBack: 2, deadTaps: 6, rageTaps: 1, exits: 6, dwellP50Ms: 7400, dwellP90Ms: 64000 }) },
  { screen: "today_calendar", title: "Выбор времени", platform: "ios", known: true, codeHint: "ios:App/Features/Scheduling/CalendarView.swift",
    d7: win(9, { quickBack: 1, deadTaps: 1, exits: 1, dwellP50Ms: 21000, dwellP90Ms: 70000, firstActionP50Ms: 14000 }),
    d28: win(31, { quickBack: 2, deadTaps: 3, exits: 2 }) },
  { screen: "mini_onb_email", title: "Mini: почта", platform: "miniapp", known: true, codeHint: "backend:apps/webapp/src/onboarding.tsx",
    d7: win(12, { quickBack: 2, deadTaps: 0, exits: 1, dwellP50Ms: 26000, dwellP90Ms: 90000 }),
    d28: win(40, { quickBack: 4, deadTaps: 1, exits: 4 }) },
  { screen: "consent", title: "Согласие", platform: "ios", known: true, codeHint: "ios:App/Features/Onboarding/ConsentView.swift",
    d7: win(16, { quickBack: 0, deadTaps: 1, exits: 1, dwellP50Ms: 6100 }),
    d28: win(52, { quickBack: 1, deadTaps: 2, exits: 2 }) },
  { screen: "today", title: "Сегодня", platform: "ios", known: true, codeHint: "ios:App/Features/Today/TodayView.swift",
    d7: win(88, { quickBack: 3, deadTaps: 2, exits: 6, dwellP50Ms: 11000, dwellP90Ms: 62000 }),
    d28: win(301, { quickBack: 9, deadTaps: 8, exits: 21 }) },
  { screen: "map", title: "Карта", platform: "ios", known: true, codeHint: "ios:App/Features/Canvas/CanvasView.swift",
    d7: win(64, { quickBack: 2, deadTaps: 0, exits: 4, dwellP50Ms: 18000, dwellP90Ms: 140000 }),
    d28: win(240, { quickBack: 6, deadTaps: 1, exits: 13 }) },
  { screen: "mini_canvas", title: "Mini: карта", platform: "miniapp", known: true, codeHint: "backend:apps/webapp/src/canvas.ts",
    d7: win(22, { quickBack: 1, deadTaps: 0, exits: 0 }),
    d28: win(70, { quickBack: 2, deadTaps: 0, exits: 2 }) },
  { screen: "profile_v2", title: "profile_v2", platform: null, known: false, codeHint: null,
    d7: win(3, { quickBack: 0, deadTaps: 0, exits: 0 }),
    d28: win(3, { quickBack: 0, deadTaps: 0, exits: 0 }) },
];

const screens: PulseScreensResponse = { ...env, asOf, screens: screenRows };

function tapCloud(seed: number, n: number, spots: Array<[number, number, number]>): PulsePoint[] {
  const r = rng(seed);
  const out: PulsePoint[] = [];
  for (let i = 0; i < n; i++) {
    const [cx, cy, spread] = spots[Math.floor(r() * spots.length)];
    const x = Math.min(0.98, Math.max(0.02, cx + (r() - 0.5) * spread));
    const y = Math.min(0.98, Math.max(0.02, cy + (r() - 0.5) * spread * 0.6));
    out.push([+x.toFixed(3), +y.toFixed(3)]);
  }
  return out;
}

function screenDetail(screen: string): PulseScreenDetailResponse | undefined {
  const row = screenRows.find((s) => s.screen === screen);
  if (!row) return undefined;
  const r = rng(screen.length * 97);
  const days: PulseScreenDay[] = [];
  for (let i = 28; i >= 1; i--) {
    if (r() < 0.2) continue; // days without data are absent
    const views = Math.round(r() * (row.d28.views / 14));
    days.push({
      day: dayKey(i), views, left: views, dwellP50Ms: 3000 + Math.round(r() * 6000), dwellP90Ms: 12000,
      firstActionP50Ms: 2000, quickBack: r() < 0.3 ? 1 : 0, exits: r() < 0.2 ? 1 : 0,
      taps: views * 2, deadTaps: r() < 0.35 ? Math.ceil(r() * 2) : 0, rageTaps: r() < 0.1 ? 1 : 0,
    });
  }
  // Buttons near the bottom, a list in the middle, a back chevron top-left.
  const points = tapCloud(screen.length * 13, 160, [
    [0.5, 0.88, 0.5], [0.5, 0.45, 0.8], [0.08, 0.07, 0.06], [0.5, 0.62, 0.6],
  ]);
  const dead = tapCloud(screen.length * 7, 18, [[0.82, 0.3, 0.12], [0.5, 0.75, 0.3]]);
  const rage = tapCloud(screen.length * 5, 7, [[0.83, 0.31, 0.04]]);
  return {
    ...env,
    screen: row.screen,
    title: row.title,
    platform: row.platform,
    codeHint: row.codeHint,
    tracksTaps: row.known,
    d7: row.d7,
    d28: row.d28,
    days,
    taps: { points: [...points, ...dead], dead, rage, total: points.length + dead.length, truncated: false },
    elements: [
      { element: "continue", taps: 41 },
      { element: "city_kyiv", taps: 23 },
      { element: "city_berlin", taps: 11 },
      { element: "back", taps: 6 },
      { element: "waitlist_link", taps: 2 },
    ],
    versions: [
      { appVersion: "6.5", views: Math.round(row.d28.views * 0.6), quickBack: 1, deadTaps: 2 },
      { appVersion: "6.4", views: Math.round(row.d28.views * 0.4), quickBack: 2, deadTaps: 5 },
    ],
    items: [
      { item: "city_list", seen: 13, viewerDays: 14 },
      { item: "waitlist_hint", seen: 1, viewerDays: 9 },
    ],
  };
}

// ── Journeys ────────────────────────────────────────────────────

const UID = [
  "0b8f2c1e-6a3d-4e1f-9c2a-7d5e8f1a2b3c",
  "4c2d9e7a-1b5f-4a8c-b3d6-2e9f0a1c4d5e",
  "9e1a7b3c-5d2f-4c6e-8a0b-1f3d5e7a9c2b",
  "c7d3e5f1-2a4b-4c6d-9e8f-0a1b2c3d4e5f",
];

function journey(i: number): PulseJourney {
  const stuck = [
    { since: iso(70), where: "city", whereTitle: "Город", phase: "onboarding" as const },
    { since: iso(55), where: "mini_onb_email", whereTitle: "Mini: почта", phase: "onboarding" as const },
    { since: iso(50), where: "today_calendar", whereTitle: "Выбор времени", phase: "date" as const },
    { since: iso(49), where: "city", whereTitle: "Город", phase: "onboarding" as const },
  ][i];
  const platform = ["ios", "miniapp", "ios", "bot"][i];
  return {
    userId: UID[i],
    platform,
    signupDate: dayKey(6 - i),
    stuck,
    truncated: false,
    items: [
      { at: `${dayKey(6 - i)}T00:00:00.000Z`, kind: "server_milestone", label: "Регистрация (день)" },
      { at: iso(73), kind: "screen", screen: "language", dwellMs: 4100, label: "Язык — 4 с, выход: next" },
      { at: iso(72.9), kind: "screen", screen: "phone_login", dwellMs: 38000, label: "Вход — 38 с, выход: next" },
      { at: iso(72.5), kind: "server_milestone", label: "Номер подтверждён" },
      { at: iso(72.4), kind: "screen", screen: "consent", dwellMs: 6100, label: "Согласие — 6 с, выход: next" },
      { at: iso(70.2), kind: "screen", screen: "city", dwellMs: 112000, label: "Город — 2 мин, выход: background" },
      { at: iso(70.1), kind: "tap_cluster", screen: "city", label: "4 касания, мимо: 3, ярость: 1" },
      { at: iso(52), kind: "screen", screen: "city", dwellMs: 9000, label: "Город — 9 с, выход: background" },
    ],
  };
}

const journeys: PulseJourneysResponse = {
  ...env,
  stuckOnly: true,
  journeys: [0, 1, 2, 3].map(journey),
};

// ── Funnels ─────────────────────────────────────────────────────

const funnels: PulseFunnelsResponse = {
  ...env,
  asOf,
  funnels: [
    {
      id: "onboarding_ios", title: "Онбординг iOS", enteredD7: 11, enteredD28: 40, smallSample: true,
      steps: [
        { step: "language", title: "Язык", d7: 11, d28: 40, conversionD7: null, conversionD28: null },
        { step: "phone_login", title: "Вход", d7: 11, d28: 38, conversionD7: null, conversionD28: 0.95 },
        { step: "consent", title: "Согласие", d7: 11, d28: 36, conversionD7: null, conversionD28: 0.95 },
        { step: "city", title: "Город", d7: 11, d28: 35, conversionD7: null, conversionD28: 0.97 },
        { step: "interview_basics", title: "Анкета: основное", d7: 6, d28: 26, conversionD7: null, conversionD28: 0.74 },
        { step: "interview_chat", title: "Анкета: разговор", d7: 5, d28: 22, conversionD7: null, conversionD28: 0.85 },
        { step: "photos", title: "Фото", d7: 4, d28: 19, conversionD7: null, conversionD28: 0.86 },
        { step: "verification", title: "Проверка лица", d7: 3, d28: 15, conversionD7: null, conversionD28: 0.79 },
        { step: "push_prompt", title: "Уведомления", d7: 3, d28: 14, conversionD7: null, conversionD28: 0.93 },
      ],
    },
    {
      id: "onboarding_bot", title: "Анкета в боте (сервер)", enteredD7: 14, enteredD28: 58, smallSample: true,
      steps: [
        { step: "started", title: "Начали", d7: 14, d28: 58, conversionD7: null, conversionD28: null },
        { step: "basics", title: "Основное", d7: 12, d28: 49, conversionD7: null, conversionD28: 0.84 },
        { step: "interview", title: "Разговор", d7: 9, d28: 37, conversionD7: null, conversionD28: 0.76 },
        { step: "completed", title: "Закончили", d7: 6, d28: 31, conversionD7: null, conversionD28: 0.84 },
      ],
    },
    {
      id: "date", title: "Путь свидания (пары)", enteredD7: 4, enteredD28: 17, smallSample: true,
      steps: [
        { step: "matched", title: "Пара создана", d7: 4, d28: 17, conversionD7: null, conversionD28: null },
        { step: "both_accepted", title: "Оба «иду»", d7: 2, d28: 9, conversionD7: null, conversionD28: null },
        { step: "time_agreed", title: "Время согласовано", d7: 1, d28: 6, conversionD7: null, conversionD28: null },
        { step: "venue_booked", title: "Место выбрано", d7: 1, d28: 5, conversionD7: null, conversionD28: null },
        { step: "completed", title: "Встреча прошла", d7: 0, d28: 3, conversionD7: null, conversionD28: null },
      ],
    },
  ],
  money: [
    { dim: "paywall:today", shown: 12, dismissed: 10 },
    { dim: "ticket_gate:pitch", shown: 5, dismissed: 3 },
  ],
};

// ── Activity + bot onboarding (existing endpoints, fixture for preview) ──

const activity: ActivitySeriesData = (() => {
  const r = rng(42);
  const series = Array.from({ length: 30 }, (_, i) => ({
    date: dayKey(30 - i),
    dau: Math.round(9 + i * 0.25 + (r() - 0.5) * 6),
  }));
  return {
    generatedAt: iso(0.1),
    timezone: "UTC",
    from: series[0].date,
    to: series[series.length - 1].date,
    includeTest: false,
    summary: {
      date: series[series.length - 1].date,
      dau: series[series.length - 1].dau,
      wau: 31,
      mau: 64,
      stickinessPct: +((series[series.length - 1].dau / 64) * 100).toFixed(1),
      dauByPlatform: { ios: 9, bot: 4, miniapp: 3 },
      mauByPlatform: { ios: 34, bot: 21, miniapp: 15 },
      windows: { wauDays: 7, mauDays: 30 },
    },
    series,
  };
})();

const onboardingFunnel: OnboardingFunnelData = {
  generatedAt: iso(0.3),
  usersEntered: 58,
  usersStillOnboarding: 19,
  steps: [
    ["name", 58, 56, 1, 1400, 6000],
    ["age", 56, 55, 0, 1800, 5200],
    ["gender", 55, 54, 0, 1200, 3900],
    ["university", 54, 47, 4, 9200, 41000],
    ["hobbies", 47, 41, 3, 22000, 95000],
    ["ideal_date", 41, 36, 5, 31000, 160000],
    ["photos", 36, 33, 2, 48000, 300000],
    ["verification", 33, 26, 4, 12000, 90000],
  ].map(([step, reached, advanced, stuckHere, med, p90], order) => ({
    step: step as string,
    order,
    reached: reached as number,
    answered: advanced as number,
    skipped: 0,
    advanced: advanced as number,
    stuckHere: stuckHere as number,
    dropOffRate: +(((reached as number) - (advanced as number)) / (reached as number)).toFixed(2),
    dwellSamples: advanced as number,
    dwellMsMedian: med as number,
    dwellMsP90: p90 as number,
  })),
  topDropOffSteps: [],
  slowestSteps: [],
  tail: { finalizedOnboarding: 31, verified: 22, pendingVerification: 7, rejectedOrReview: 2, active: 27 },
};

/** Return a fixture for `path`, or undefined to fall through to the network. */
export function pulseFixture(path: string): unknown {
  const [p, qs = ""] = path.split("?");
  const q = new URLSearchParams(qs);
  if (p === "/admin/pulse/brief") return brief;
  if (p === "/admin/pulse/insights") return insightsRes;
  if (p === "/admin/pulse/screens") return screens;
  if (p.startsWith("/admin/pulse/screens/")) {
    const key = decodeURIComponent(p.slice("/admin/pulse/screens/".length));
    return screenDetail(key) ?? screenDetail("city");
  }
  if (p === "/admin/pulse/journeys") {
    return q.get("stuck") === "1" ? journeys : { ...journeys, stuckOnly: false };
  }
  if (p.startsWith("/admin/pulse/journeys/")) {
    const id = decodeURIComponent(p.slice("/admin/pulse/journeys/".length));
    const i = Math.max(0, UID.indexOf(id));
    const res: PulseJourneyResponse = { ...env, journey: journey(i) };
    return res;
  }
  if (p === "/admin/pulse/funnels") return funnels;
  if (p === "/admin/pulse/catalog") return { ...env, metrics: [], thresholds: {}, screens: [] };
  if (p === "/admin/analytics/active") return activity;
  if (p === "/admin/analytics/onboarding-funnel") return onboardingFunnel;
  return undefined;
}
