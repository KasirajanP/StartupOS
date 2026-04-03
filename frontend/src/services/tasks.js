import api from "../lib/api";
import { getResults } from "../lib/normalize";

export async function listTasks() {
  const { data } = await api.get("/tasks/tasks/");
  return getResults(data);
}

export async function getTask(taskId) {
  const { data } = await api.get(`/tasks/tasks/${taskId}/`);
  return data;
}

export async function listProjects() {
  const { data } = await api.get("/tasks/projects/");
  return getResults(data);
}

export async function createProject(payload) {
  const { data } = await api.post("/tasks/projects/", payload);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/tasks/tasks/", payload);
  return data;
}

export async function updateTask(taskId, payload) {
  const { data } = await api.patch(`/tasks/tasks/${taskId}/`, payload);
  return data;
}

export async function listTaskActivityLogs(taskId) {
  const { data } = await api.get("/tasks/activity-logs/", {
    params: taskId ? { task: taskId } : {},
  });
  return getResults(data);
}
