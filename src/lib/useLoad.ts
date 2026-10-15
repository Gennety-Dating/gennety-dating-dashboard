import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface LoadState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * One request, settled on its own.
 *
 * Every section of the analytics page owns its fetch through this hook, so a
 * failing endpoint shows an inline error in that section and nowhere else —
 * the old page awaited fifteen requests in one `Promise.all` and a single 500
 * blanked everything.
 *
 * `key` identifies the request (include the refresh token in it); loading is
 * derived from "the settled key is not the current key" instead of being set
 * inside the effect.
 */
export function useLoad<T>(key: string | null, load: () => Promise<T>): LoadState<T> {
  const navigate = useNavigate();
  const loadRef = useRef(load);
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null } | null>(
    null,
  );

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ key, data, error: null });
      },
      (err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
        if (msg === "Invalid API key" || msg === "Not authenticated") {
          navigate("/login", { replace: true });
          return;
        }
        setState({ key, data: null, error: msg });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, navigate]);

  const current = key !== null && state?.key === key ? state : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: key !== null && current === null,
  };
}

/** «API error: 404» → a line a founder can act on. */
export function describeError(msg: string): string {
  if (msg.endsWith(": 404")) return "Сервер ещё не отдаёт этот раздел (404) — бэкенд не обновлён.";
  if (msg.startsWith("API error")) return `Ошибка сервера (${msg.replace("API error: ", "")}).`;
  if (msg === "Failed to fetch" || msg.includes("NetworkError")) return "Сервер недоступен.";
  return msg;
}
