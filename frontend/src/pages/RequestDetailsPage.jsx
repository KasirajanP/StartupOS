import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ActivityTimeline from "../components/ActivityTimeline";
import Card from "../components/Card";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import SelectField from "../components/SelectField";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import { createWorkflowAction, getRequest, uploadRequestAttachment } from "../services/requests";
import { listUsers } from "../services/users";

function RequestDetailsPage() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const [workflowForm, setWorkflowForm] = useState({
    action: "comment",
    comment: "",
    to_user: "",
  });
  const [workflowError, setWorkflowError] = useState("");
  const [workflowSuccess, setWorkflowSuccess] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [attachmentSuccess, setAttachmentSuccess] = useState("");
  const requestState = useAsyncData(() => getRequest(requestId), [requestId], null);
  const usersState = useAsyncData(listUsers, [], []);
  const userOptions = usersState.data.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (${user.email})`,
  }));

  const request = requestState.data
    ? {
        id: requestState.data.id,
        title: requestState.data.title,
        description: requestState.data.description,
        status:
          requestState.data.status.charAt(0).toUpperCase() + requestState.data.status.slice(1),
        owner: requestState.data.created_by_email,
        ownerEmail: requestState.data.created_by_email,
        assignees: requestState.data.assigned_to_details?.map((user) => user.full_name) ?? [],
        updatedAt: new Date(requestState.data.updated_at).toLocaleString(),
        workflowSteps: requestState.data.workflow_steps ?? [],
        attachments: requestState.data.attachments ?? [],
      }
    : null;
  const isRequestCreator = request?.ownerEmail === user?.email;
  const isRequestAssignee = requestState.data?.assigned_to_details?.some(
    (assignedUser) => assignedUser.email === user?.email,
  );
  const canApproveRequest = user?.is_owner || user?.permission_codes?.includes("approve_request");
  const canCreateRequest = user?.is_owner || user?.permission_codes?.includes("create_request");
  const canParticipateInWorkflow = canApproveRequest || canCreateRequest || isRequestCreator || isRequestAssignee;
  const workflowOptions = [
    ...(canParticipateInWorkflow ? [{ value: "comment", label: "Comment" }] : []),
    ...(canParticipateInWorkflow ? [{ value: "reassignment", label: "Reassign" }] : []),
    ...(request?.status !== "Pending" && (isRequestCreator || canCreateRequest)
      ? [{ value: "reraise", label: "Re-raise" }]
      : []),
  ];

  useEffect(() => {
    if (!workflowOptions.length) {
      return;
    }
    if (!workflowOptions.some((option) => option.value === workflowForm.action)) {
      setWorkflowForm((current) => ({ ...current, action: workflowOptions[0].value }));
    }
  }, [workflowForm.action, workflowOptions]);

  function handleWorkflowChange(event) {
    const { name, value } = event.target;
    setWorkflowForm((current) => ({ ...current, [name]: value }));
  }

  async function handleWorkflow(action, overrides = {}) {
    setWorkflowError("");
    setWorkflowSuccess("");

    try {
      await createWorkflowAction(requestId, {
        action,
        comment: overrides.comment ?? workflowForm.comment,
        ...(overrides.to_user || workflowForm.to_user
          ? { to_user: Number(overrides.to_user ?? workflowForm.to_user) }
          : {}),
      });
      requestState.reload();
      setWorkflowForm({ action: "comment", comment: "", to_user: "" });
      setWorkflowSuccess(`Workflow action '${action}' completed successfully.`);
    } catch (error) {
      setWorkflowError(getErrorMessage(error, "Unable to complete the workflow action."));
    }
  }

  async function handleAttachmentUpload(event) {
    event.preventDefault();

    if (!attachmentFile) {
      setAttachmentError("Choose a file before uploading.");
      setAttachmentSuccess("");
      return;
    }

    setAttachmentError("");
    setAttachmentSuccess("");

    try {
      await uploadRequestAttachment(requestId, attachmentFile);
      setAttachmentFile(null);
      requestState.reload();
      setAttachmentSuccess("Attachment uploaded successfully.");
    } catch (error) {
      setAttachmentError(getErrorMessage(error, "Unable to upload the attachment."));
    }
  }

  if (requestState.isLoading && !request) {
    return (
      <section className="space-y-8">
        <PageHeader
          eyebrow={`Request #${requestId}`}
          title="Loading request"
          description="Fetching the latest request details from your workspace."
        />
      </section>
    );
  }

  if (requestState.error || !request) {
    return (
      <section className="space-y-8">
        <PageHeader
          eyebrow={`Request #${requestId}`}
          title="Request unavailable"
          description="This request could not be loaded right now."
          action={
            <Link
              to="/requests"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to requests
            </Link>
          }
        />
        <Card>
          <p className="text-sm text-rose-600">
            {requestState.error || "Unable to load this request."}
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow={`Request #${request.id}`}
        title={request.title}
        description={request.description}
        action={
          <Link
            to="/requests"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to requests
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={request.status} />
            <span className="text-sm text-slate-500">Updated {request.updatedAt}</span>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Created by
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{request.owner}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Assigned to
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {request.assignees.length ? request.assignees.join(", ") : "No assignee"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workflow actions
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {canApproveRequest ? (
                <button
                  type="button"
                  onClick={() => handleWorkflow("approval")}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve
                </button>
              ) : null}
              {canApproveRequest ? (
                <button
                  type="button"
                  onClick={() => handleWorkflow("rejection")}
                  className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              ) : null}
              {request.status !== "Pending" &&
              (isRequestCreator || canCreateRequest) ? (
                <button
                  type="button"
                  onClick={() => handleWorkflow("reraise")}
                  className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Re-raise
                </button>
              ) : null}
            </div>
            {canParticipateInWorkflow || (request.status !== "Pending" && (isRequestCreator || canCreateRequest)) ? (
              <div className="mt-4 space-y-3">
                <SelectField
                  label="Workflow action"
                  name="action"
                  value={workflowForm.action}
                  onChange={handleWorkflowChange}
                  options={workflowOptions}
                />
                <FormField
                  label="Comment"
                  name="comment"
                  value={workflowForm.comment}
                  onChange={handleWorkflowChange}
                  placeholder="Type the comment or explanation for this workflow action"
                  textarea
                />
                {workflowForm.action === "reassignment" ? (
                  <SelectField
                    label="Reassign to"
                    name="to_user"
                    value={workflowForm.to_user}
                    onChange={handleWorkflowChange}
                    options={userOptions}
                    placeholder="Select the teammate who should receive this request"
                  />
                ) : null}
                {usersState.error ? <p className="text-sm text-rose-600">{usersState.error}</p> : null}
                {workflowError ? <p className="text-sm font-medium text-rose-600">{workflowError}</p> : null}
                {workflowSuccess ? <p className="text-sm font-medium text-emerald-700">{workflowSuccess}</p> : null}
                <button
                  type="button"
                  onClick={() => handleWorkflow(workflowForm.action)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Submit workflow step
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                You can view this request, but you do not have permission to change its workflow.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Attachments
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleAttachmentUpload}>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Upload file</span>
                <input
                  type="file"
                  onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                />
              </label>
              {attachmentError ? <p className="text-sm font-medium text-rose-600">{attachmentError}</p> : null}
              {attachmentSuccess ? <p className="text-sm font-medium text-emerald-700">{attachmentSuccess}</p> : null}
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Upload attachment
              </button>
            </form>
            <div className="mt-5 space-y-3">
              {request.attachments.length ? (
                request.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span>{attachment.file.split("/").pop()}</span>
                    <span className="text-slate-500">Uploaded by {attachment.uploaded_by_email}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-500">No attachments have been added yet.</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Activity timeline
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            Workflow history
          </h2>
          <div className="mt-5">
            <ActivityTimeline
              items={
                request.workflowSteps.length
                  ? request.workflowSteps.map((step) => ({
                      id: step.id,
                      title: step.action.charAt(0).toUpperCase() + step.action.slice(1),
                      description:
                        step.action === "reassignment"
                          ? `${step.acted_by_email} reassigned the request from ${step.from_user_email || "unassigned"} to ${step.to_user_email || "unknown"}${step.comment ? `. ${step.comment}` : "."}`
                          : step.action === "approval"
                            ? `${step.acted_by_email} approved the request${step.comment ? `. ${step.comment}` : "."}`
                            : step.action === "rejection"
                              ? `${step.acted_by_email} rejected the request${step.comment ? `. ${step.comment}` : "."}`
                              : step.action === "reraise"
                                ? `${step.acted_by_email} re-raised the request${step.comment ? `. ${step.comment}` : "."}`
                                : step.comment || `${step.acted_by_email} recorded a workflow comment.`,
                      timestamp: new Date(step.created_at).toLocaleString(),
                    }))
                  : [
                      {
                        id: "empty-workflow",
                        title: "No workflow history yet",
                        description: "Approve, reject, comment, or reassign this request to start the trail.",
                        timestamp: "Waiting for first action",
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

export default RequestDetailsPage;
