import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listNotifications() {
  const { data } = await api.get("/notifications/");
  return getResults(data);
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.post(`/notifications/${notificationId}/mark-read/`);
  return data;
}
