import { useState } from "react";
import { Link } from "react-router-dom";

import Card from "../components/Card";
import FormField from "../components/FormField";
import PageHeader from "../components/PageHeader";
import SelectField from "../components/SelectField";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import { assignRolePermission, createRole, listPermissions, listRoles } from "../services/roles";

function ManageRolesPage() {
  const { user } = useAuth();
  const canManageRoles = user?.is_owner || user?.permission_codes?.includes("manage_roles_permissions");
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });
  const [permissionForm, setPermissionForm] = useState({ role_id: "", permission_ids: [] });
  const [roleError, setRoleError] = useState("");
  const [roleSuccess, setRoleSuccess] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [permissionSuccess, setPermissionSuccess] = useState("");
  const rolesState = useAsyncData(listRoles, [], []);
  const permissionsState = useAsyncData(listPermissions, [], []);

  const roles = rolesState.data;
  const permissionCatalog = permissionsState.data.map((permission) => permission.code);
  const roleOptions = roles.map((role) => ({
    value: String(role.id),
    label: role.name,
  }));
  const selectedRole = roles.find((role) => String(role.id) === permissionForm.role_id);
  const assignedPermissionIds = new Set(
    (selectedRole?.role_permissions ?? []).map((item) => item.permission.id),
  );
  const availablePermissionOptions = permissionsState.data
    .filter((permission) => !assignedPermissionIds.has(permission.id))
    .map((permission) => ({
      value: String(permission.id),
      label: `${permission.code} (${permission.module})`,
    }));

  function handleRoleChange(event) {
    const { name, value } = event.target;
    setRoleForm((current) => ({ ...current, [name]: value }));
  }

  function handlePermissionRoleChange(event) {
    const { value } = event.target;
    setPermissionForm({ role_id: value, permission_ids: [] });
  }

  function handlePermissionSelection(event) {
    const permissionIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setPermissionForm((current) => ({ ...current, permission_ids: permissionIds }));
  }

  async function handleCreateRole(event) {
    event.preventDefault();
    setRoleError("");
    setRoleSuccess("");

    try {
      await createRole(roleForm);
      rolesState.setData(await listRoles());
      setRoleForm({ name: "", description: "" });
      setRoleSuccess("Role created successfully.");
    } catch (error) {
      setRoleError(getErrorMessage(error, "Unable to create the role."));
    }
  }

  async function handleAssignPermission(event) {
    event.preventDefault();
    setPermissionError("");
    setPermissionSuccess("");

    if (!permissionForm.role_id) {
      setPermissionError("Choose a role before assigning permissions.");
      return;
    }

    if (!permissionForm.permission_ids.length) {
      setPermissionError("Select at least one permission to assign.");
      return;
    }

    try {
      await Promise.all(
        permissionForm.permission_ids.map((permissionId) =>
          assignRolePermission({
            role_id: Number(permissionForm.role_id),
            permission_id: Number(permissionId),
          }),
        ),
      );
      rolesState.setData(await listRoles());
      setPermissionForm((current) => ({ ...current, permission_ids: [] }));
      setPermissionSuccess("Permissions assigned successfully.");
    } catch (error) {
      setPermissionError(getErrorMessage(error, "Unable to assign the permission."));
    }
  }

  if (!canManageRoles) {
    return (
      <section className="space-y-8">
        <PageHeader eyebrow="Admin panel" title="Manage roles and permissions" />
        <Card>
          <p className="text-sm text-rose-600">
            You do not have permission to manage roles and permissions.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Manage roles and permissions"
        action={
          <Link
            to="/admin/users"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage users
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Create role
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleCreateRole}>
              <FormField label="Role name" name="name" value={roleForm.name} onChange={handleRoleChange} placeholder="Enter the name of the role you want to create" />
              <FormField
                label="Description"
                name="description"
                value={roleForm.description}
                onChange={handleRoleChange}
                placeholder="Explain what this role is responsible for in the organization"
                textarea
              />
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                Create role
              </button>
              {roleError ? <p className="text-sm font-medium text-rose-600">{roleError}</p> : null}
              {roleSuccess ? <p className="text-sm font-medium text-emerald-700">{roleSuccess}</p> : null}
            </form>
          </Card>

          {roles.map((role) => (
            <Card key={role.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{role.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{role.description}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {(role.role_permissions ?? []).length} permission{(role.role_permissions ?? []).length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(role.role_permissions ?? []).length ? (
                  role.role_permissions.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {item.permission.code}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    No permissions assigned yet
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Permission catalog
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            Available permissions
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {permissionCatalog.map((permission) => (
              <span
                key={permission}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700"
              >
                {permission}
              </span>
            ))}
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleAssignPermission}>
            <SelectField
              label="Role"
              name="role_id"
              value={permissionForm.role_id}
              onChange={handlePermissionRoleChange}
              options={roleOptions}
              placeholder="Select the role that should receive permissions"
            />
            <SelectField
              label="Permissions"
              name="permission_ids"
              value={permissionForm.permission_ids}
              onChange={handlePermissionSelection}
              options={availablePermissionOptions}
              placeholder="Select the permissions that should be assigned to this role"
              multiple
            />
            <p className="text-sm text-slate-500">
              Only permissions not yet assigned to the selected role are shown here.
            </p>
            {permissionsState.error ? <p className="text-sm text-rose-600">{permissionsState.error}</p> : null}
            {!availablePermissionOptions.length ? (
              <p className="text-sm text-slate-500">
                Pick a role to see assignable permissions, or that role already has the full catalog.
              </p>
            ) : null}
            {permissionError ? <p className="text-sm font-medium text-rose-600">{permissionError}</p> : null}
            {permissionSuccess ? <p className="text-sm font-medium text-emerald-700">{permissionSuccess}</p> : null}
            <button
              type="submit"
              className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Assign permission
            </button>
          </form>
        </Card>
      </div>
    </section>
  );
}

export default ManageRolesPage;
