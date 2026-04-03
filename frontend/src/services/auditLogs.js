import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listAuditLogs() {
  const { data } = await api.get("/audit-logs/");
  return getResults(data);
}

export async function getAuditLog(auditLogId) {
  const { data } = await api.get(`/audit-logs/${auditLogId}/`);
  return data;
}
