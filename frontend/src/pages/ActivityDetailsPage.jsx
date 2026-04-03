import { Link, useParams } from "react-router-dom";

import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { buildActivityDescription, formatAuditAction } from "../lib/activity";
import { getAuditLog } from "../services/auditLogs";
import { getRequest } from "../services/requests";
import { getTask } from "../services/tasks";

function DetailRow({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-900">{value || "Not available"}</p>
    </div>
  );
}

function ActivityDetailsPage() {
  const { activityId } = useParams();
  const activityState = useAsyncData(() => getAuditLog(activityId), [activityId], null);

  const relatedRequestId = activityState.data
    ? activityState.data.entity_type === "request"
      ? activityState.data.entity_id
      : activityState.data.metadata?.request_id || null
    : null;
  const relatedTaskId = activityState.data
    ? activityState.data.entity_type === "task"
      ? activityState.data.entity_id
      : activityState.data.metadata?.task_id || null
    : null;

  const requestState = useAsyncData(
    () => (relatedRequestId ? getRequest(relatedRequestId) : null),
    [relatedRequestId],
    null,
  );
  const taskState = useAsyncData(
    () => (relatedTaskId ? getTask(relatedTaskId) : null),
    [relatedTaskId],
    null,
  );

  const activity = activityState.data;
  const request = requestState.data;
  const task = taskState.data;
  const metadata = activity?.metadata || {};
  const assignedTo = metadata.assigned_to_emails?.length
    ? metadata.assigned_to_emails.join(", ")
    : request?.assigned_to_details?.map((user) => user.full_name || user.email).join(", ");
  const previousAssignees = metadata.previous_assignee_emails?.length
    ? metadata.previous_assignee_emails.join(", ")
    : metadata.from_user_email || "";
  const activityStatus = request
    ? request.status.charAt(0).toUpperCase() + request.status.slice(1)
    : task
      ? task.status.charAt(0).toUpperCase() + task.status.replaceAll("_", " ").slice(1)
      : metadata.request_status
        ? metadata.request_status.charAt(0).toUpperCase() + metadata.request_status.slice(1)
        : metadata.status
          ? metadata.status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())
          : "In Progress";

  if (activityState.isLoading && !activity) {
    return (
      <section className="space-y-8">
        <PageHeader
          eyebrow="Activity"
          title="Loading activity"
          description="Fetching the full audit details for this event."
        />
      </section>
    );
  }

  if (activityState.error || !activity) {
    return (
      <section className="space-y-8">
        <PageHeader
          eyebrow="Activity"
          title="Activity unavailable"
          description="This audit event could not be loaded right now."
          action={
            <Link
              to="/dashboard"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          }
        />
        <Card>
          <p className="text-sm text-rose-600">{activityState.error || "Unable to load this activity."}</p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={`Activity #${activity.id}`}
        title={formatAuditAction(activity.action)}
        description={buildActivityDescription(activity)}
        action={
          <Link
            to="/dashboard"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={activityStatus} />
            <span className="text-sm text-slate-500">
              Recorded {new Date(activity.timestamp).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailRow label="Action" value={formatAuditAction(activity.action)} />
            <DetailRow label="Performed by" value={activity.user_email || "System"} />
            <DetailRow label="Entity type" value={activity.entity_type} />
            <DetailRow label="Entity id" value={String(activity.entity_id)} />
            {activity.entity_type === "request" || relatedRequestId ? (
              <>
                <DetailRow label="Request owner" value={metadata.created_by_email || request?.created_by_email} />
                <DetailRow label="Current assignees" value={assignedTo || "No assignee"} />
              </>
            ) : null}
            {activity.entity_type === "task" || relatedTaskId ? (
              <>
                <DetailRow label="Project" value={metadata.project_name || task?.project_name || `Project #${task?.project || ""}`} />
                <DetailRow label="Current assignee" value={metadata.assigned_to_email || task?.assigned_to_email || "No assignee"} />
                <DetailRow label="Priority" value={metadata.priority || task?.priority || "Not available"} />
                <DetailRow label="Story points" value={String(metadata.story_points ?? task?.story_points ?? "Not available")} />
              </>
            ) : null}
          </div>

          {activity.action === "request_approval" ? (
            <DetailRow
              label="Approval outcome"
              value={`${metadata.request_title || request?.title || `Request #${activity.entity_id}`} was approved by ${activity.user_email || "the acting user"}.`}
            />
          ) : null}
          {activity.action === "request_rejection" ? (
            <DetailRow
              label="Rejection outcome"
              value={`${metadata.request_title || request?.title || `Request #${activity.entity_id}`} was rejected by ${activity.user_email || "the acting user"}.`}
            />
          ) : null}
          {activity.action === "request_reassignment" ? (
            <DetailRow
              label="Reassignment path"
              value={`Moved from ${previousAssignees || "Unassigned"} to ${metadata.to_user_email || "the new assignee"}.`}
            />
          ) : null}
          {activity.action === "task_updated" ? (
            <>
              {metadata.previous_assigned_to_email !== undefined && metadata.previous_assigned_to_email !== metadata.assigned_to_email ? (
                <DetailRow
                  label="Assignee change"
                  value={`Moved from ${metadata.previous_assigned_to_email || "Unassigned"} to ${metadata.assigned_to_email || "Unassigned"}.`}
                />
              ) : null}
              {metadata.previous_status ? (
                <DetailRow
                  label="Status change"
                  value={`Moved from ${metadata.previous_status.replaceAll("_", " ")} to ${metadata.status.replaceAll("_", " ")}.`}
                />
              ) : null}
              {metadata.changed_fields?.length ? (
                <DetailRow
                  label="Changed fields"
                  value={metadata.changed_fields.join(", ")}
                />
              ) : null}
            </>
          ) : null}
          {activity.action === "task_created" ? (
            <DetailRow
              label="Task created"
              value={`${metadata.title || `Task #${activity.entity_id}`} was created in ${metadata.project_name || "the selected project"} with ${metadata.story_points || 0} story points.`}
            />
          ) : null}
          {metadata.comment ? <DetailRow label="Comment" value={metadata.comment} /> : null}
        </Card>

        <Card className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Activity context
          </p>
          {relatedRequestId ? (
            request ? (
              <>
                <DetailRow label="Request title" value={request.title} />
                <DetailRow label="Description" value={request.description} />
                <DetailRow
                  label="Current status"
                  value={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                />
                <DetailRow
                  label="Assigned teammates"
                  value={
                    request.assigned_to_details?.length
                      ? request.assigned_to_details.map((user) => user.full_name || user.email).join(", ")
                      : "No assignee"
                  }
                />
                <Link
                  to={`/requests/${relatedRequestId}`}
                  className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open request
                </Link>
              </>
            ) : requestState.error ? (
              <p className="text-sm text-rose-600">{requestState.error}</p>
            ) : (
              <p className="text-sm text-slate-500">Loading request context...</p>
            )
          ) : null}
          {!relatedRequestId && relatedTaskId ? (
            task ? (
              <>
                <DetailRow label="Task title" value={task.title} />
                <DetailRow label="Description" value={task.description} />
                <DetailRow
                  label="Current status"
                  value={task.status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())}
                />
                <DetailRow
                  label="Assigned teammate"
                  value={task.assigned_to_details?.full_name || task.assigned_to_email || "No assignee"}
                />
                <DetailRow
                  label="Task type"
                  value={task.task_type.replace(/\b\w/g, (character) => character.toUpperCase())}
                />
              </>
            ) : taskState.error ? (
              <p className="text-sm text-rose-600">{taskState.error}</p>
            ) : (
              <p className="text-sm text-slate-500">Loading task context...</p>
            )
          ) : null}
          {!relatedRequestId && !relatedTaskId ? (
            <p className="text-sm text-slate-500">
              This activity is not tied to a request or task record.
            </p>
          ) : null}
        </Card>
      </div>
    </section>
  );
}

export default ActivityDetailsPage;
