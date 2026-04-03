import { useAuth } from "../context/AuthContext";

function NotificationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 1 1 12 0v5l1.5 2.5h-15L6 13z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}

function Navbar({ unreadCount = 0, onToggleNotifications, isNotificationsOpen = false }) {
  const { logout, user } = useAuth();

  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <h1 className="font-display text-2xl font-extrabold text-slate-900">
        {user?.organization?.name ?? "StartupOS Workspace"}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleNotifications}
          className={[
            "relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
            isNotificationsOpen
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50",
          ].join(" ")}
        >
          <span className="relative">
            <NotificationIcon />
            {unreadCount ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
            ) : null}
          </span>
          Notifications
        </button>
        <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">
          {user?.email ?? "owner@startupos.com"}
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
