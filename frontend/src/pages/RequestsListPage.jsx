import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../components/Card";
import FormField from "../components/FormField";
import SelectField from "../components/SelectField";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import { createRequest, listRequests } from "../services/requests";
import { listUsers } from "../services/users";

function RequestsListPage() {
  const { user } = useAuth();
  const canCreateRequest = user?.is_owner || user?.permission_codes?.includes("create_request");
  const [draft, setDraft] = useState({ title: "", description: "", assigned_to: "" });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [draftError, setDraftError] = useState("");
  const [draftSuccess, setDraftSuccess] = useState("");
  const deferredSearch = useDeferredValue(search);
  const requestsState = useAsyncData(listRequests, [], []);
  const usersState = useAsyncData(listUsers, [], []);
  const userOptions = usersState.data.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (${user.email})`,
  }));

  const requestItems = requestsState.data.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Pending",
    owner: item.created_by_email,
    ownerEmail: item.created_by_email,
    assigneeEmails: item.assigned_to_details?.map((currentUser) => currentUser.email) ?? [],
    assignees: item.assigned_to_details?.map((user) => user.full_name) ?? [],
    updatedAt: new Date(item.updated_at).toLocaleString(),
  }));

  const filteredRequests = useMemo(
    () =>
      requestItems.filter((item) => {
        const needle = deferredSearch.toLowerCase();
        const matchesSearch =
          item.title.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle) ||
          item.owner.toLowerCase().includes(needle);
        const matchesFilter =
          activeFilter === "assigned"
            ? item.assigneeEmails.includes(user?.email)
            : activeFilter === "raised"
              ? item.ownerEmail === user?.email
              : true;
        return matchesSearch && matchesFilter;
      }),
    [requestItems, deferredSearch, activeFilter, user?.email],
  );

  function handleDraftChange(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function handleQuickCreate(event) {
    event.preventDefault();
    setDraftError("");
    setDraftSuccess("");

    try {
      await createRequest({
        title: draft.title,
        description: draft.description,
        assigned_to: draft.assigned_to ? [Number(draft.assigned_to)] : [],
      });
      requestsState.setData(await listRequests());
      setDraft({ title: "", description: "", assigned_to: "" });
      setDraftSuccess("Request created and added to your live workspace.");
    } catch (error) {
      setDraftError(getErrorMessage(error, "Unable to save the draft request."));
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-display text-4xl font-extrabold text-slate-900">Requests</h1>
        {canCreateRequest ? (
          <Link
            to="/requests/new"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create request
          </Link>
        ) : null}
      </div>

      <div className="max-w-md">
        <FormField
          label="Search requests"
          name="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type to search requests by title, details, or requester"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setActiveFilter("assigned")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeFilter === "assigned"
              ? "bg-slate-950 text-white"
              : "border border-slate-200 text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          Assigned to me
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("raised")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeFilter === "raised"
              ? "bg-slate-950 text-white"
              : "border border-slate-200 text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          Raised by me
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={[
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            activeFilter === "all"
              ? "bg-slate-950 text-white"
              : "border border-slate-200 text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          All
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {canCreateRequest ? (
          <Card>
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Quick request</h2>
            <form className="mt-5 space-y-4" onSubmit={handleQuickCreate}>
              <FormField
                label="Title"
                name="title"
                value={draft.title}
                onChange={handleDraftChange}
                placeholder="Enter the request title"
              />
              <FormField
                label="Description"
                name="description"
                value={draft.description}
                onChange={handleDraftChange}
                placeholder="Describe what is needed and why the request is being raised"
                textarea
              />
              <SelectField
                label="Assign to"
                name="assigned_to"
                value={draft.assigned_to}
                onChange={handleDraftChange}
                options={userOptions}
                placeholder="Select the teammate who should handle this request"
              />
              {usersState.error ? <p className="text-sm text-rose-600">{usersState.error}</p> : null}
              {draftError ? <p className="text-sm font-medium text-rose-600">{draftError}</p> : null}
              {draftSuccess ? <p className="text-sm font-medium text-emerald-700">{draftSuccess}</p> : null}
              <button
                type="submit"
                className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                Create request
              </button>
            </form>
          </Card>
        ) : null}

        <div className="space-y-4">
          {requestsState.error ? <p className="text-sm text-rose-600">{requestsState.error}</p> : null}
          {!requestsState.isLoading && !filteredRequests.length ? (
            <Card>
              <p className="text-sm text-slate-600">No requests match the current search yet.</p>
            </Card>
          ) : null}
          {filteredRequests.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Request #{item.id}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
                <Link
                  to={`/requests/${item.id}`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open
                </Link>
              </div>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>Created by {item.owner}</span>
                <span>Assigned to {item.assignees.length ? item.assignees.join(", ") : "No assignee"}</span>
                <span>Updated {item.updatedAt}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RequestsListPage;
