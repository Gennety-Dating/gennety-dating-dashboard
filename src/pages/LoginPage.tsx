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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Ambient background glow elements */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-[400px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-slate-900/60 p-8 shadow-2xl shadow-violet-950/20 backdrop-blur-2xl ring-1 ring-white/10 transition-all"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/25">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            Gennety Admin
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Enter your Admin API key to access dashboard
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-300 ring-1 ring-red-500/20">
            {error}
          </p>
        )}

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-300">
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
            className="w-full rounded-xl bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all duration-200 focus:ring-2 focus:ring-violet-500/80 focus:shadow-lg focus:shadow-violet-500/10"
          />
        </div>

        <button
          type="submit"
          className="group relative w-full cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99]"
        >
          <span className="relative z-10">Sign In</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </form>
    </div>
  );
}
