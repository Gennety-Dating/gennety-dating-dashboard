import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setApiKey } from "../lib/auth";

export default function LoginPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter an API key.");
      return;
    }
    setApiKey(trimmed);
    navigate("/", { replace: true });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#121316] px-4">
      {/* Ambient Deep Cherry background glow elements */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[650px] -translate-x-1/2 rounded-full bg-rose-950/30 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-[450px] w-[550px] rounded-full bg-rose-900/20 blur-[120px]" />

      <form
        onSubmit={handleSubmit}
        className="glass-card-borderless w-full max-w-sm rounded-3xl p-8 transition-all"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-900 via-rose-700 to-rose-500 shadow-xl shadow-rose-950/50 [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.15)]">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <h1 className="bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            Gennety Admin
          </h1>
          <p className="mt-1.5 text-xs font-medium text-rose-200/70">
            Enter your Admin API key to access dashboard
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-rose-950/50 px-3.5 py-2.5 text-xs font-medium text-rose-300 [box-shadow:inset_0_1px_1px_rgba(244,63,94,0.3),inset_0_0_10px_rgba(244,63,94,0.1)]">
            {error}
          </p>
        )}

        <div className="mb-6">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError("");
            }}
            placeholder="sk-admin-..."
            className="w-full rounded-2xl bg-[#17181c] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none [box-shadow:inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_0_8px_rgba(255,255,255,0.04)] focus:[box-shadow:inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_0_14px_rgba(244,63,94,0.25)] transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          className="inner-glow-cherry group relative w-full cursor-pointer overflow-hidden rounded-2xl py-3.5 text-xs font-bold tracking-wide uppercase text-white shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <span className="relative z-10">Sign In</span>
          <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </form>
    </div>
  );
}
