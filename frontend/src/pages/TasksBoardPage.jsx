import { useEffect, useState } from "react";

import Card from "../components/Card";
import FormField from "../components/FormField";
import KanbanBoard from "../components/KanbanBoard";
import PageHeader from "../components/PageHeader";
import SelectField from "../components/SelectField";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { getErrorMessage } from "../lib/errors";
import {
  createProject,
  createTask,
  listProjects,
  listTaskActivityLogs,
  listTasks,
  updateTask,
} from "../services/tasks";
import { listUsers } from "../services/users";

const taskTypeOptions = [
  { value: "story", label: "Story" },
  { value: "bug", label: "Bug" },
  { value: "task", label: "Task" },
  { value: "chore", label: "Chore" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const statusOptions = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

function formatLabel(value) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function EmptyTaskDrawer({ onClose }) {
  return (
    <div className="fixed inset-y-6 right-6 z-30 w-full max-w-lg rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Task details
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            Select a task
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>
      <p className="mt-5 text-sm leading-6 text-slate-600">
        Click a card to inspect the task, review its log, or update its details.
      </p>
    </div>
  );
}

function TaskDetailsDrawer({
  task,
  editForm,
  onChange,
  onSubmit,
  onClose,
  canManageTasks,
  updateError,
  updateSuccess,
  taskLogsState,
  userOptions,
}) {
  return (
    <div className="fixed inset-y-6 right-6 z-30 w-full max-w-lg overflow-y-auto rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-panel backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Task details
          </p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            {task.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={formatLabel(task.priority)} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>

      {canManageTasks ? (
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <FormField label="Task title" name="title" value={editForm.title} onChange={onChange} />
          <FormField
            label="Description"
            name="description"
            value={editForm.description}
            onChange={onChange}
            textarea
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Task type"
              name="task_type"
              value={editForm.task_type}
              onChange={onChange}
              options={taskTypeOptions}
            />
            <SelectField
              label="Priority"
              name="priority"
              value={editForm.priority}
              onChange={onChange}
              options={priorityOptions}
            />
            <FormField
              label="Story points"
              name="story_points"
              value={editForm.story_points}
              onChange={onChange}
              type="number"
            />
            <SelectField
              label="Status"
              name="status"
              value={editForm.status}
              onChange={onChange}
              options={statusOptions}
            />
          </div>
          <SelectField
            label="Assigned to"
            name="assigned_to"
            value={editForm.assigned_to}
            onChange={onChange}
            options={userOptions}
            placeholder="Leave unassigned or choose a teammate"
          />
          <FormField
            label="Due date"
            name="due_date"
            value={editForm.due_date}
            onChange={onChange}
            type="date"
          />
          {updateError ? <p className="text-sm font-medium text-rose-600">{updateError}</p> : null}
          {updateSuccess ? <p className="text-sm font-medium text-emerald-700">{updateSuccess}</p> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Save task changes
          </button>
        </form>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="rounded-3xl border border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatLabel(task.task_type)}</p>
            </Card>
            <Card className="rounded-3xl border border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Story points</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{task.story_points}</p>
            </Card>
          </div>
          <Card className="rounded-3xl border border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{task.description || "No description provided."}</p>
          </Card>
          <p className="text-sm leading-6 text-slate-600">
            You can drag this task between workflow columns only if it is assigned to you. Editing full task details is reserved for task managers.
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Task log
        </p>
        <div className="mt-4 space-y-3">
          {taskLogsState.error ? <p className="text-sm text-rose-600">{taskLogsState.error}</p> : null}
          {!taskLogsState.error && !taskLogsState.data.length ? (
            <p className="text-sm text-slate-500">
              Task updates will appear here once a task is created or edited.
            </p>
          ) : null}
          {taskLogsState.data.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{formatLabel(log.action)}</p>
                <span className="text-xs text-slate-500">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{log.message}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>Actor: {log.actor_email || "System"}</span>
                {log.field_name ? <span>Field: {formatLabel(log.field_name)}</span> : null}
                {log.old_value || log.new_value ? (
                  <span>
                    {log.old_value || "empty"} to {log.new_value || "empty"}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TasksBoardPage() {
  const { user } = useAuth();
  const canManageTasks = user?.is_owner || user?.permission_codes?.includes("assign_task");
  const [createMode, setCreateMode] = useState("task");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState("");
  const [boardError, setBoardError] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [taskForm, setTaskForm] = useState({
    project: "",
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    task_type: "story",
    priority: "medium",
    story_points: "3",
    status: "todo",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    task_type: "story",
    priority: "medium",
    story_points: "0",
    status: "todo",
  });
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const tasksState = useAsyncData(listTasks, [], []);
  const projectsState = useAsyncData(listProjects, [], []);
  const usersState = useAsyncData(listUsers, [], []);
  const taskLogsState = useAsyncData(
    () => (selectedTaskId ? listTaskActivityLogs(selectedTaskId) : []),
    [selectedTaskId],
    [],
  );

  const projectOptions = projectsState.data.map((project) => ({
    value: String(project.id),
    label: project.name,
  }));
  const userOptions = usersState.data.map((currentUser) => ({
    value: String(currentUser.id),
    label: `${currentUser.full_name} (${currentUser.email})`,
  }));
  const selectedTask =
    tasksState.data.find((task) => String(task.id) === String(selectedTaskId)) ?? null;
  const visibleTasks = showAssignedOnly
    ? tasksState.data.filter((task) => task.assigned_to === user?.id)
    : tasksState.data;

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    setEditForm({
      title: selectedTask.title,
      description: selectedTask.description || "",
      assigned_to: selectedTask.assigned_to ? String(selectedTask.assigned_to) : "",
      due_date: selectedTask.due_date || "",
      task_type: selectedTask.task_type,
      priority: selectedTask.priority,
      story_points: String(selectedTask.story_points ?? 0),
      status: selectedTask.status,
    });
  }, [selectedTask]);

  function mapTaskToCard(item) {
    return {
      id: `TSK-${item.id}`,
      rawId: item.id,
      title: item.title,
      project:
        projectsState.data.find((project) => project.id === item.project)?.name ??
        `Project ${item.project}`,
      assignee: item.assigned_to_details?.full_name ?? item.assigned_to_email ?? "Unassigned",
      priority: formatLabel(item.priority),
      taskType: formatLabel(item.task_type),
      storyPoints: item.story_points ?? 0,
      dueDate: item.due_date || "",
      isDraggable: item.assigned_to === user?.id,
    };
  }

  function buildColumn(id, title, statusValue) {
    const items = visibleTasks.filter((item) => item.status === statusValue);
    return {
      id,
      title,
      statusValue,
      storyPoints: items.reduce((sum, item) => sum + Number(item.story_points || 0), 0),
      items: items.map(mapTaskToCard),
    };
  }

  const columns = [
    buildColumn("todo", "Todo", "todo"),
    buildColumn("in-progress", "In Progress", "in_progress"),
    buildColumn("done", "Done", "done"),
  ];

  const totalStoryPoints = visibleTasks.reduce(
    (sum, task) => sum + Number(task.story_points || 0),
    0,
  );
  const completedStoryPoints = visibleTasks
    .filter((task) => task.status === "done")
    .reduce((sum, task) => sum + Number(task.story_points || 0), 0);
  const bugCount = visibleTasks.filter((task) => task.task_type === "bug" && task.status !== "done").length;

  function openTask(taskId) {
    setSelectedTaskId(String(taskId));
    setIsDrawerOpen(true);
  }

  function handleProjectChange(event) {
    const { name, value } = event.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  }

  function handleTaskChange(event) {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateProject(event) {
    event.preventDefault();
    setProjectError("");
    setProjectSuccess("");

    try {
      await createProject(projectForm);
      projectsState.setData(await listProjects());
      setProjectForm({ name: "", description: "" });
      setProjectSuccess("Project created successfully.");
    } catch (error) {
      setProjectError(getErrorMessage(error, "Unable to create the project."));
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();
    setTaskError("");
    setTaskSuccess("");

    try {
      const createdTask = await createTask({
        project: Number(taskForm.project),
        title: taskForm.title,
        description: taskForm.description,
        assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
        due_date: taskForm.due_date || null,
        task_type: taskForm.task_type,
        priority: taskForm.priority,
        story_points: Number(taskForm.story_points || 0),
        status: taskForm.status,
      });
      tasksState.setData(await listTasks());
      setSelectedTaskId(String(createdTask.id));
      setIsDrawerOpen(true);
      setIsCreateOpen(false);
      setTaskForm({
        project: "",
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        task_type: "story",
        priority: "medium",
        story_points: "3",
        status: "todo",
      });
      setTaskSuccess("Task created successfully.");
    } catch (error) {
      setTaskError(getErrorMessage(error, "Unable to create the task."));
    }
  }

  async function handleUpdateTask(event) {
    event.preventDefault();
    if (!selectedTask) {
      return;
    }

    setUpdateError("");
    setUpdateSuccess("");

    try {
      await updateTask(selectedTask.id, {
        title: editForm.title,
        description: editForm.description,
        assigned_to: editForm.assigned_to ? Number(editForm.assigned_to) : null,
        due_date: editForm.due_date || null,
        task_type: editForm.task_type,
        priority: editForm.priority,
        story_points: Number(editForm.story_points || 0),
        status: editForm.status,
      });
      tasksState.setData(await listTasks());
      taskLogsState.reload();
      setUpdateSuccess("Task updated successfully.");
    } catch (error) {
      setUpdateError(getErrorMessage(error, "Unable to update the task."));
    }
  }

  async function handleDropOnColumn(nextStatus) {
    if (!draggedTaskId) {
      return;
    }

    const draggedTask = tasksState.data.find((task) => String(task.id) === String(draggedTaskId));
    setDraggedTaskId("");

    if (!draggedTask || draggedTask.status === nextStatus) {
      return;
    }

    setBoardError("");

    try {
      await updateTask(draggedTask.id, { status: nextStatus });
      tasksState.setData(await listTasks());
      if (selectedTaskId && String(selectedTaskId) === String(draggedTask.id)) {
        taskLogsState.reload();
      }
    } catch (error) {
      setBoardError(getErrorMessage(error, "Unable to move the task to a new status."));
    }
  }

  function handleUnauthorizedDrag() {
    setBoardError("This task does not belong to you.");
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Task board"
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAssignedOnly((current) => !current)}
              className={[
                "rounded-full px-5 py-3 text-sm font-semibold transition",
                showAssignedOnly
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Assigned to me
            </button>
            {canManageTasks ? (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create
              </button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <p className="text-sm font-semibold text-slate-500">Backlog</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="font-display text-4xl font-extrabold text-slate-900">
              {visibleTasks.length}
            </span>
            <StatusBadge status="Pending" />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Total story points</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="font-display text-4xl font-extrabold text-slate-900">
              {totalStoryPoints}
            </span>
            <StatusBadge status="In Progress" />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Completed story points</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="font-display text-4xl font-extrabold text-slate-900">
              {completedStoryPoints}
            </span>
            <StatusBadge status="Done" />
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-slate-500">Open bugs</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className="font-display text-4xl font-extrabold text-slate-900">
              {bugCount}
            </span>
            <StatusBadge status="Rejected" />
          </div>
        </Card>
      </div>

      {boardError ? <p className="text-sm font-medium text-rose-600">{boardError}</p> : null}

      <div className={isDrawerOpen ? "pr-[28rem]" : ""}>
        <KanbanBoard
          columns={columns}
          onSelectItem={openTask}
          selectedItemId={selectedTask ? selectedTask.id : ""}
          onDragStart={setDraggedTaskId}
          onDropOnColumn={handleDropOnColumn}
          activeDragId={draggedTaskId}
          onUnauthorizedDrag={handleUnauthorizedDrag}
        />
      </div>

      {!visibleTasks.length ? (
        <Card>
          <p className="text-sm text-slate-600">
            {showAssignedOnly
              ? "No tasks are currently assigned to you."
              : canManageTasks
                ? "No tasks yet. Use the create button to add a project or create the first sprint task."
                : "No tasks are available on the board right now."}
          </p>
        </Card>
      ) : null}

      {isCreateOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Create workspace item
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">
                  {createMode === "task" ? "Create task" : "Create project"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setCreateMode("task")}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  createMode === "task"
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Task
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("project")}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  createMode === "project"
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Project
              </button>
            </div>

            {createMode === "task" ? (
              <form className="mt-6 space-y-4" onSubmit={handleCreateTask}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                  label="Project"
                  name="project"
                  value={taskForm.project}
                  onChange={handleTaskChange}
                  options={projectOptions}
                  placeholder="Select the project where this task belongs"
                />
                  <SelectField
                  label="Assigned to"
                  name="assigned_to"
                  value={taskForm.assigned_to}
                  onChange={handleTaskChange}
                  options={userOptions}
                  placeholder="Select the teammate responsible for this task"
                />
                </div>
                <FormField
                  label="Task title"
                  name="title"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  placeholder="Enter the task title"
                />
                <FormField
                  label="Description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskChange}
                  placeholder="Describe the work, acceptance criteria, and delivery expectation"
                  textarea
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Task type"
                    name="task_type"
                    value={taskForm.task_type}
                    onChange={handleTaskChange}
                    options={taskTypeOptions}
                  />
                  <SelectField
                    label="Priority"
                    name="priority"
                    value={taskForm.priority}
                    onChange={handleTaskChange}
                    options={priorityOptions}
                  />
                  <FormField
                    label="Story points"
                    name="story_points"
                    value={taskForm.story_points}
                    onChange={handleTaskChange}
                    type="number"
                  />
                  <SelectField
                    label="Initial status"
                    name="status"
                    value={taskForm.status}
                    onChange={handleTaskChange}
                    options={statusOptions}
                  />
                </div>
                <FormField
                  label="Due date"
                  name="due_date"
                  value={taskForm.due_date}
                  onChange={handleTaskChange}
                  type="date"
                />
                {taskError ? <p className="text-sm font-medium text-rose-600">{taskError}</p> : null}
                {taskSuccess ? <p className="text-sm font-medium text-emerald-700">{taskSuccess}</p> : null}
                <button
                  type="submit"
                  disabled={!projectsState.data.length}
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Create task
                </button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleCreateProject}>
                <FormField
                  label="Project name"
                  name="name"
                  value={projectForm.name}
                  onChange={handleProjectChange}
                  placeholder="Enter the project name"
                />
                <FormField
                  label="Description"
                  name="description"
                  value={projectForm.description}
                  onChange={handleProjectChange}
                  placeholder="Describe what this project is meant to deliver"
                  textarea
                />
                {projectError ? <p className="text-sm font-medium text-rose-600">{projectError}</p> : null}
                {projectSuccess ? <p className="text-sm font-medium text-emerald-700">{projectSuccess}</p> : null}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Create project
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {isDrawerOpen ? (
        selectedTask ? (
          <TaskDetailsDrawer
            task={selectedTask}
            editForm={editForm}
            onChange={handleEditChange}
            onSubmit={handleUpdateTask}
            onClose={() => setIsDrawerOpen(false)}
            canManageTasks={canManageTasks}
            updateError={updateError}
            updateSuccess={updateSuccess}
            taskLogsState={taskLogsState}
            userOptions={userOptions}
          />
        ) : (
          <EmptyTaskDrawer onClose={() => setIsDrawerOpen(false)} />
        )
      ) : null}
    </section>
  );
}

export default TasksBoardPage;
