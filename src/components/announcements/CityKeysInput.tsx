import { useId, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { CityCatalogEntry } from "../../lib/api";
import { CITY_KEY_RE, MAX_CITY_KEYS } from "../../lib/announcements";

interface Props {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  /** The server's city catalog, offered as suggestions. Empty when it could not be loaded — typing still works. */
  catalog: CityCatalogEntry[];
  invalid?: boolean;
}

/**
 * City keys as chips. Enter, comma or leaving the field turns what was typed
 * into chips; a pasted "kyiv, lviv" becomes two. A key the server would refuse
 * (`CITY_KEY_RE`) stays in the box with a reason rather than vanishing.
 *
 * A key the catalog does not know is still allowed — the audience count is the
 * real test of whether anyone lives there — but it is marked, because a typo
 * here silently sends to nobody.
 */
export default function CityKeysInput({ id, value, onChange, catalog, invalid }: Props) {
  const listId = useId();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");

  const byKey = new Map(catalog.map((c) => [c.cityKey, c] as const));

  function commit(raw: string) {
    const parts = raw
      .split(/[\s,;]+/)
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length === 0) {
      setDraft("");
      return;
    }
    const rejected = parts.filter((p) => !CITY_KEY_RE.test(p));
    const next = [...value];
    for (const p of parts) {
      if (CITY_KEY_RE.test(p) && !next.includes(p)) next.push(p);
    }
    const overflow = next.length > MAX_CITY_KEYS;
    if (next.length !== value.length) onChange(next.slice(0, MAX_CITY_KEYS));
    setDraft(rejected.join(", "));
    setLocalError(
      rejected.length > 0
        ? `Not a city key: ${rejected.join(", ")}. Keys are 2–64 lowercase letters, digits, - or _.`
        : overflow
          ? `At most ${MAX_CITY_KEYS} cities.`
          : "",
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    const inputType = (e.nativeEvent as InputEvent).inputType;
    // Picking a datalist suggestion is not typing: Chrome reports it as a
    // replacement, Safari reports no input type at all. Either way the value
    // is a whole catalog key, so it becomes a chip at once.
    const picked = (inputType === undefined || inputType === "insertReplacementText") && byKey.has(next);
    if (picked || next.includes(",")) {
      commit(next);
      return;
    }
    setDraft(next);
    if (localError) setLocalError("");
  }

  return (
    <div>
      <div
        className={`flex min-h-[2.375rem] flex-wrap items-center gap-1.5 rounded-md border bg-canvas px-2 py-1.5 focus-within:border-white/30 ${
          invalid || localError ? "border-rose-500/50" : "border-white/10"
        }`}
      >
        {value.map((key) => {
          const known = byKey.get(key);
          const unknown = catalog.length > 0 && !known;
          return (
            <span
              key={key}
              title={unknown ? "Not in the city catalog — check the spelling" : known?.city}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                unknown ? "bg-amber-500/15 text-amber-300" : "bg-white/8 text-slate-200"
              }`}
            >
              {known ? `${known.city} · ${key}` : key}
              <button
                type="button"
                onClick={() => onChange(value.filter((k) => k !== key))}
                aria-label={`Remove ${key}`}
                className="cursor-pointer text-slate-500 hover:text-white"
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          id={id}
          list={listId}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => commit(draft)}
          placeholder={value.length === 0 ? "Every city — type a key, e.g. kyiv" : "Add city"}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-xs font-medium text-white placeholder:text-slate-600 outline-none"
        />
        <datalist id={listId}>
          {catalog
            .filter((c) => !value.includes(c.cityKey))
            .map((c) => (
              <option key={c.cityKey} value={c.cityKey}>
                {c.city}
                {c.status === "waitlist" ? " (waitlist)" : ""}
              </option>
            ))}
        </datalist>
      </div>
      {localError && (
        <p role="alert" className="mt-1 text-[11px] text-rose-300">
          {localError}
        </p>
      )}
    </div>
  );
}
