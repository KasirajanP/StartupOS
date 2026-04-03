const statusClasses = {
  Pending: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
  Completed: "bg-sky-100 text-sky-800",
  Todo: "bg-slate-200 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-800",
  Done: "bg-emerald-100 text-emerald-800",
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-200 text-slate-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        statusClasses[status] ?? "bg-slate-200 text-slate-700",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
