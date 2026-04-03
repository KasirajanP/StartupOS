import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function fetchDashboardSummary() {
  const [requestsResponse, tasksResponse, auditResponse, notificationsResponse] =
    await Promise.all([
      api.get("/requests/"),
      api.get("/tasks/tasks/"),
      api.get("/audit-logs/"),
      api.get("/notifications/"),
    ]);

  const requests = getResults(requestsResponse.data);
  const tasks = getResults(tasksResponse.data);
  const auditLogs = getResults(auditResponse.data);
  const notifications = getResults(notificationsResponse.data);

  return {
    requests,
    tasks,
    auditLogs,
    notifications,
  };
}
