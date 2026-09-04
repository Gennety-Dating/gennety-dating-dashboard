import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm rounded-lg p-6">
        <div className="mb-5 flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <h1 className="text-base font-semibold tracking-tight text-white">
            Gennety Admin
          </h1>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300"
          >
            {error}
          </p>
        )}

        <label
          htmlFor="api-key"
          className="mb-1.5 block text-[11px] font-medium tracking-wide text-slate-500 uppercase"
        >
          API key
        </label>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError("");
          }}
          placeholder="sk-admin-…"
          className="mb-5 w-full rounded-md border border-white/10 bg-canvas px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-white/30"
        />

        <button
          type="submit"
          className="btn-primary w-full cursor-pointer rounded-md py-2.5 text-xs font-medium"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
