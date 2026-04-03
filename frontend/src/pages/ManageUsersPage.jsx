import { useState } from "react";

import Card from "../components/Card";
import DataTable from "../components/DataTable";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import SelectField from "../components/SelectField";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import { listRoles } from "../services/roles";
import { createUser, listUsers, updateUser } from "../services/users";

function ManageUsersPage() {
  const { user } = useAuth();
  const canManageUsers = user?.is_owner || user?.permission_codes?.includes("manage_users");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_ids: [],
  });
  const [roleEditor, setRoleEditor] = useState({ userId: "", role_ids: [] });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [roleError, setRoleError] = useState("");
  const [roleSuccess, setRoleSuccess] = useState("");
  const usersState = useAsyncData(listUsers, [], []);
  const rolesState = useAsyncData(listRoles, [], []);
  const roleOptions = rolesState.data.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));
  const userOptions = usersState.data.map((user) => ({
    value: String(user.id),
    label: `${user.full_name} (${user.email})`,
  }));

  const users = usersState.data.map((user) => ({
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.roles?.length ? user.roles.map((role) => role.name).join(", ") : "Unassigned",
    status: user.is_active ? "Active" : "Inactive",
  }));

  const columns = [
    { key: "name", label: "User" },
    { key: "email", label: "Email" },
    { key: "role", label: "Roles" },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status === "Active" ? "Approved" : "Pending"} />,
    },
  ];

  if (!canManageUsers) {
    return (
      <section className="space-y-8">
        <PageHeader eyebrow="Admin panel" title="Manage users" />
        <Card>
          <p className="text-sm text-rose-600">
            You do not have permission to manage users.
          </p>
        </Card>
      </section>
    );
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleRoleSelection(event) {
    const roleIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setForm((current) => ({ ...current, role_ids: roleIds }));
  }

  function handleRoleEditorUserChange(event) {
    const userId = event.target.value;
    const selectedUser = usersState.data.find((user) => String(user.id) === userId);
    setRoleEditor({
      userId,
      role_ids: selectedUser?.roles?.map((role) => String(role.id)) ?? [],
    });
  }

  function handleRoleEditorRolesChange(event) {
    const roleIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setRoleEditor((current) => ({ ...current, role_ids: roleIds }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    try {
      await createUser({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        role_ids: form.role_ids.map(Number),
        is_owner: false,
        is_staff: false,
      });
      usersState.setData(await listUsers());
      setCreateSuccess("User created successfully.");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role_ids: [],
      });
    } catch (error) {
      setCreateError(getErrorMessage(error, "Unable to create the user."));
    }
  }

  async function handleRoleUpdate(event) {
    event.preventDefault();
    setRoleError("");
    setRoleSuccess("");

    if (!roleEditor.userId) {
      setRoleError("Choose a user before updating roles.");
      return;
    }

    try {
      await updateUser(roleEditor.userId, { role_ids: roleEditor.role_ids.map(Number) });
      usersState.setData(await listUsers());
      setRoleSuccess("User roles updated successfully.");
    } catch (error) {
      setRoleError(getErrorMessage(error, "Unable to update user roles."));
    }
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Manage users"
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Invite user
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            Add team member
          </h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <FormField label="First name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Enter the user's first name" />
            <FormField label="Last name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Enter the user's last name" />
            <FormField label="Email" name="email" value={form.email} onChange={handleChange} placeholder="Enter the user's work email" />
            <FormField label="Password" name="password" value={form.password} onChange={handleChange} placeholder="Set the initial password for this user" type="password" />
            <SelectField
              label="Assign roles"
              name="role_ids"
              value={form.role_ids}
              onChange={handleRoleSelection}
              options={roleOptions}
              placeholder="Select one or more roles"
              multiple
            />
            <p className="text-sm text-slate-500">
              Hold Ctrl or Cmd to attach multiple roles to the same user.
            </p>
            {rolesState.error ? <p className="text-sm text-rose-600">{rolesState.error}</p> : null}
            {createError ? <p className="text-sm font-medium text-rose-600">{createError}</p> : null}
            {createSuccess ? <p className="text-sm font-medium text-emerald-700">{createSuccess}</p> : null}
            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Invite user
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Update roles
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
              Reassign user access
            </h2>
            <form className="mt-5 space-y-4" onSubmit={handleRoleUpdate}>
              <SelectField
                label="Team member"
                name="userId"
                value={roleEditor.userId}
                onChange={handleRoleEditorUserChange}
                options={userOptions}
                placeholder="Choose a user"
              />
              <SelectField
                label="Roles"
                name="role_ids"
                value={roleEditor.role_ids}
                onChange={handleRoleEditorRolesChange}
                options={roleOptions}
                placeholder="Select one or more roles"
                multiple
              />
              {roleError ? <p className="text-sm font-medium text-rose-600">{roleError}</p> : null}
              {roleSuccess ? <p className="text-sm font-medium text-emerald-700">{roleSuccess}</p> : null}
              <button
                type="submit"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Save role assignment
              </button>
            </form>
          </Card>

          {usersState.error ? <p className="text-sm text-rose-600">{usersState.error}</p> : null}
          <DataTable columns={columns} rows={users} />
        </div>
      </div>
    </section>
  );
}

export default ManageUsersPage;
