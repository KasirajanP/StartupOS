import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listRequests() {
  const { data } = await api.get("/requests/");
  return getResults(data);
}

export async function getRequest(requestId) {
  const { data } = await api.get(`/requests/${requestId}/`);
  return data;
}

export async function createRequest(payload) {
  const { data } = await api.post("/requests/", payload);
  return data;
}

export async function createWorkflowAction(requestId, payload) {
  const { data } = await api.post(`/requests/${requestId}/workflow/`, payload);
  return data;
}

export async function uploadRequestAttachment(requestId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/requests/${requestId}/attachments/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}
