import { Link } from "react-router-dom";

function ActivityTimeline({ items }) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <div key={item.id} className="relative pl-6">
          <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-950" />
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
              <span className="text-xs font-medium text-slate-500">{item.timestamp}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.href ? (
              <Link
                to={item.href}
                className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                View full activity
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityTimeline;
