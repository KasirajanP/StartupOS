function NotificationPanel({ items, onMarkRead }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        No notifications yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={[
            "rounded-2xl border px-4 py-4",
            item.isRead
              ? "border-slate-200 bg-slate-50"
              : "border-amber-200 bg-amber-50",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <div className="flex items-center gap-2">
              {!item.isRead ? (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  New
                </span>
              ) : null}
              {!item.isRead && onMarkRead ? (
                <button
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                  className="text-xs font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                >
                  Mark read
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
        </div>
      ))}
    </div>
  );
}

export default NotificationPanel;
