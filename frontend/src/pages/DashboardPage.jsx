import ActivityTimeline from "../components/ActivityTimeline";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { buildActivityDescription, formatAuditAction } from "../lib/activity";
import { dashboardStats, recentActivity, requestItems } from "../lib/mockData";
import { fetchDashboardSummary } from "../services/dashboard";

function DashboardPage() {
  const { data, isLoading } = useAsyncData(fetchDashboardSummary, [], null);

  const liveStats = data
    ? [
        {
          label: "Open requests",
          value: String(data.requests.filter((item) => item.status === "pending").length),
          status: "Pending",
        },
        {
          label: "Task pending",
          value: String(data.tasks.filter((item) => item.status !== "done").length),
          status: "In Progress",
        },
        {
          label: "Close requests",
          value: String(data.requests.filter((item) => item.status !== "pending").length),
          status: "Approved",
        },
        {
          label: "Task completed",
          value: String(data.tasks.filter((item) => item.status === "done").length),
          status: "Done",
        },
      ]
    : dashboardStats.map((item) => ({
        ...item,
        status:
          item.tone === "amber" ? "Pending" : item.tone === "emerald" ? "Done" : "In Progress",
      }));

  const liveRequests = data?.requests?.length
    ? data.requests.slice(0, 2).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Pending",
        owner: item.created_by_email,
        assignees: item.assigned_to_details?.map((user) => user.full_name) ?? [],
        updatedAt: new Date(item.updated_at).toLocaleString(),
      }))
    : isLoading
      ? requestItems.slice(0, 2)
      : [];

  const timelineItems = data?.auditLogs?.length
    ? data.auditLogs.slice(0, 5).map((item) => ({
        id: item.id,
        title: formatAuditAction(item.action),
        description: buildActivityDescription(item),
        timestamp: new Date(item.timestamp).toLocaleString(),
        href: `/activities/${item.id}`,
      }))
    : isLoading
      ? recentActivity
      : [];

  return (
    <section className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {liveStats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <span className="font-display text-4xl font-extrabold text-slate-900">
                {stat.value}
              </span>
              <StatusBadge status={stat.status} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Open requests</h2>

          <div className="mt-5 space-y-4">
            {liveRequests.length ? (
              liveRequests.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Owner: {item.owner}</span>
                    <span>Assignees: {item.assignees.length ? item.assignees.join(", ") : "No assignee"}</span>
                    <span>Updated: {item.updatedAt}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                No requests have been created yet.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-extrabold text-slate-900">Recent activity</h2>
          <div className="mt-5">
            <ActivityTimeline
              items={
                timelineItems.length
                  ? timelineItems
                  : [
                      {
                        id: "empty-audit-log",
                        title: "No activity yet",
                        description: "Live audit events will appear here once your team starts using the workspace.",
                        timestamp: "Awaiting activity",
                      },
                    ]
              }
            />
          </div>
        </Card>
      </div>
    </section>
  );
}

export default DashboardPage;
