import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listUsers() {
  const { data } = await api.get("/accounts/users/");
  return getResults(data);
}

export async function createUser(payload) {
  const { data } = await api.post("/accounts/users/", payload);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.patch(`/accounts/users/${userId}/`, payload);
  return data;
}
