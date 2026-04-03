from django.db import models

from common.models import OrganizationScopedModel


class Project(OrganizationScopedModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_projects",
    )

    class Meta:
        ordering = ["name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return self.name


class Task(OrganizationScopedModel):
    class Status(models.TextChoices):
        TODO = "todo", "Todo"
        IN_PROGRESS = "in_progress", "In Progress"
        DONE = "done", "Done"

    class TaskType(models.TextChoices):
        STORY = "story", "Story"
        BUG = "bug", "Bug"
        TASK = "task", "Task"
        CHORE = "chore", "Chore"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    task_type = models.CharField(max_length=20, choices=TaskType.choices, default=TaskType.STORY)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    story_points = models.PositiveIntegerField(default=1)
    project = models.ForeignKey(
        "tasks.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    assigned_to = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.organization = self.project.organization
        super().save(*args, **kwargs)


class TaskActivityLog(OrganizationScopedModel):
    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.CASCADE,
        related_name="activity_logs",
    )
    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_activity_logs",
    )
    action = models.CharField(max_length=100)
    message = models.TextField()
    field_name = models.CharField(max_length=100, blank=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.task_id} - {self.action}"

    def save(self, *args, **kwargs):
        self.organization = self.task.organization
        super().save(*args, **kwargs)
