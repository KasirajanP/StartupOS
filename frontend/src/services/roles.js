import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listRoles() {
  const { data } = await api.get("/roles/roles/");
  return getResults(data);
}

export async function createRole(payload) {
  const { data } = await api.post("/roles/roles/", payload);
  return data;
}

export async function listPermissions() {
  const { data } = await api.get("/roles/permissions/");
  return getResults(data);
}

export async function assignRolePermission(payload) {
  const { data } = await api.post("/roles/role-permissions/", payload);
  return data;
}
