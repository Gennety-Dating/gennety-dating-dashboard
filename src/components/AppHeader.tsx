import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { clearApiKey } from "../lib/auth";

/**
 * The one place the admin nav is defined.
 *
 * This bar used to be copy-pasted into all six pages, with each copy
 * hard-coding which link was the active one — so a new route meant six edits
 * and a wrong active state was a one-character mistake nobody would catch.
 * Active state is now derived from the URL.
 */
const NAV = [
  { to: "/", label: "Analytics" },
  { to: "/users", label: "Users" },
  { to: "/purchases", label: "Purchases" },
  { to: "/ad-spend", label: "Ad Spend" },
  { to: "/dialogs", label: "Dialogs" },
  { to: "/reports", label: "Reports" },
] as const;

interface AppHeaderProps {
  /** Page-level controls that belong beside the nav, e.g. the analytics Refresh button. */
  actions?: ReactNode;
}

export default function AppHeader({ actions }: AppHeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    clearApiKey();
    navigate("/login", { replace: true });
  }

  return (
    <header className="mx-auto mb-5 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
      <div className="flex items-center gap-2.5">
        <Logo className="h-7 w-7" />
        <span className="text-sm font-semibold tracking-tight text-white">
          Gennety Analytics
        </span>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            // "/" would prefix-match everything, so it is the one exact case.
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  active ? "btn-primary" : "btn"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="btn cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
