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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Gennety Admin</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your Admin API key to continue
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <label className="mb-1.5 block text-sm font-medium text-slate-300">
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
          className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />

        <button
          type="submit"
          className="w-full cursor-pointer rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
