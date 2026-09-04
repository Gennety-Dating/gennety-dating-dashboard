import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import {
  getAdminStats,
  getCityCatalog,
  getUsers,
  getWaitlist,
  type AdminStatsData,
  type CityCatalogEntry,
  type UserListItem,
  type WaitlistData,
} from "../lib/api";
import UsersTable from "../components/users/UsersTable";
import UserProfileDrawer from "../components/users/UserProfileDrawer";
import SectionHeader from "../components/SectionHeader";
import HealthSection from "../components/users/HealthSection";
import HealthTabs, { type HealthTab } from "../components/users/HealthTabs";
import CityFilter, { type CityStatusFilter } from "../components/users/CityFilter";
import ErrorBanner from "../components/ErrorBanner";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    page: number;
    users: UserListItem[];
    total: number;
    error: string;
  } | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [healthTab, setHealthTab] = useState<HealthTab>("all");
  // Тестовые аккаунты по умолчанию скрыты: они портят любую цифру на экране.
  // API их по умолчанию отдаёт, поэтому флаг всегда шлём явно.
  const [includeTest, setIncludeTest] = useState(false);
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  // Город и его статус — два независимых среза списка. Оба уходят в запрос,
  // а не фильтруют страницу на клиенте: иначе «12 из 480» и пролистывание
  // почти пустых экранов.
  const [cityKey, setCityKey] = useState("");
  const [cityStatus, setCityStatus] = useState<CityStatusFilter>("");
  const [catalog, setCatalog] = useState<CityCatalogEntry[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistData | null>(null);

  const loading = result === null || result.page !== page;
  const users = result?.users ?? [];
  const total = result?.total ?? 0;
  const error = result?.error ?? "";

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((res) => {
        if (!cancelled) setStats(res);
      })
      .catch(() => {
        // Здоровье базы — дополнение к списку. Если оно не загрузилось,
        // список должен работать дальше, а не падать целиком.
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Каталог городов и счётчики ожидания — вспомогательные данные для фильтра.
  // Если их нет (сервер на деплой отстал), фильтр по статусу продолжает
  // работать, а выпадающий список городов просто остаётся пустым.
  useEffect(() => {
    let cancelled = false;
    getCityCatalog()
      .then((res) => {
        if (!cancelled) setCatalog(res.cities);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    getWaitlist()
      .then((res) => {
        if (!cancelled) setWaitlist(res);
      })
      .catch(() => {
        if (!cancelled) setWaitlist(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getUsers(PAGE_SIZE, page * PAGE_SIZE, {
      health: healthTab,
      includeTest,
      cityKey,
      cityStatus,
    })
      .then((res) => {
        if (cancelled) return;
        setResult({ page, users: res.data, total: res.total, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setResult({ page, users: [], total: 0, error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [page, navigate, healthTab, includeTest, cityKey, cityStatus]);

  // Смена вкладки/чекбокса меняет выборку целиком — остаться на 5-й странице
  // отфильтрованного списка нельзя, поэтому пагинация сбрасывается вместе с
  // фильтром (в обработчике, а не в эффекте — иначе лишний каскадный рендер).
  function handleHealthTabChange(tab: HealthTab) {
    setHealthTab(tab);
    setPage(0);
  }

  // Смена города/статуса меняет выборку целиком — пагинация сбрасывается
  // вместе с фильтром, ровно как у вкладок здоровья выше.
  function handleCityKeyChange(next: string) {
    setCityKey(next);
    setPage(0);
  }

  function handleCityStatusChange(next: CityStatusFilter) {
    setCityStatus(next);
    setPage(0);
  }

  function handleIncludeTestChange(next: boolean) {
    setIncludeTest(next);
    // Скрыли тестовые, стоя на их вкладке — уводим на «Все», иначе экран
    // окажется пустым без объяснения.
    if (!next && healthTab === "test") setHealthTab("all");
    setPage(0);
  }

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-canvas px-4 py-5 sm:px-6 lg:px-8">
      <AppHeader />

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="User Profiles"
        />

        {error && (
          <ErrorBanner className="mb-4" message={error} />
        )}

        <HealthSection stats={stats} loading={stats === null} />

        <HealthTabs
          active={healthTab}
          onChange={handleHealthTabChange}
          includeTest={includeTest}
          onIncludeTestChange={handleIncludeTestChange}
          stats={stats}
        />

        <CityFilter
          catalog={catalog}
          waitlist={waitlist}
          cityKey={cityKey}
          cityStatus={cityStatus}
          onCityKeyChange={handleCityKeyChange}
          onCityStatusChange={handleCityStatusChange}
        />

        <UsersTable
          users={users}
          loading={loading}
          onRowClick={setSelectedUserId}
        />

        <div className="panel mt-5 flex items-center justify-between rounded-lg p-3.5 text-xs text-slate-400">
          <div>
            {total > 0 ? (
              <>
                Showing <span className="font-semibold text-white">{from}</span>–
                <span className="font-semibold text-white">{to}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> users
              </>
            ) : (
              !loading && "0 users"
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="btn cursor-pointer rounded-md px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400/80">
              Page <span className="font-semibold text-white">{page + 1}</span> / {maxPage + 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page >= maxPage || loading}
              className="btn cursor-pointer rounded-md px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <UserProfileDrawer
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}
