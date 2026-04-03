import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../components/Card";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import SelectField from "../components/SelectField";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import { createRequest } from "../services/requests";
import { listUsers } from "../services/users";
import { useAuth } from "../context/AuthContext";

function CreateRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateRequest = user?.is_owner || user?.permission_codes?.includes("create_request");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: [],
  });
  const [error, setError] = useState("");
  const usersState = useAsyncData(listUsers, [], []);
  const userOptions = usersState.data.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (${user.email})`,
  }));

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleAssigneeChange(event) {
    const assignedTo = Array.from(event.target.selectedOptions, (option) => option.value);
    setForm((current) => ({ ...current, assigned_to: assignedTo }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await createRequest({
        title: form.title,
        description: form.description,
        assigned_to: form.assigned_to.map(Number),
      });
      navigate("/requests");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Unable to create the request."));
    }
  }

  if (!canCreateRequest) {
    return (
      <section className="space-y-8">
        <PageHeader title="Create request" />
        <Card>
          <p className="text-sm text-rose-600">
            You do not have permission to create requests.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Create request"
      />

      <Card className="max-w-3xl">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            label="Request title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter the title of the request"
          />
          <FormField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe what is needed, who is involved, and why this request is required"
            textarea
          />
          <SelectField
            label="Assign teammates"
            name="assigned_to"
            value={form.assigned_to}
            onChange={handleAssigneeChange}
            options={userOptions}
            placeholder="Select the teammates who should handle this request"
            multiple
          />
          <p className="text-sm text-slate-500">
            Hold Ctrl or Cmd to select multiple assignees.
          </p>
          {usersState.error ? <p className="text-sm text-rose-600">{usersState.error}</p> : null}
          {usersState.data.length ? (
            <p className="text-sm text-slate-500">
              {usersState.data.length} teammate{usersState.data.length === 1 ? "" : "s"} available in your organization.
            </p>
          ) : null}
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Submit request
            </button>
            <button
              type="button"
              onClick={() => navigate("/requests")}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}

export default CreateRequestPage;
