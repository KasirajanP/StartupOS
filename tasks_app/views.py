from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import has_permission
from common.utils import create_audit_log, create_notification
from common.views import OrganizationScopedMixin
from tasks_app.models import Project, Task, TaskActivityLog
from tasks_app.serializers import ProjectSerializer, TaskActivityLogSerializer, TaskSerializer


def _normalize_task_value(value):
    if value is None:
        return ""
    if hasattr(value, "email"):
        return value.email
    if hasattr(value, "name"):
        return value.name
    return str(value)


def create_task_activity_log(*, task, actor, action, message, field_name="", old_value="", new_value=""):
    return TaskActivityLog.objects.create(
        organization=task.organization,
        task=task,
        actor=actor,
        action=action,
        message=message,
        field_name=field_name,
        old_value=_normalize_task_value(old_value),
        new_value=_normalize_task_value(new_value),
    )


class ProjectViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = Project.objects.select_related("organization", "created_by")
    serializer_class = ProjectSerializer

    def get_permissions(self):
        return [permission() for permission in [IsAuthenticated, has_permission("assign_task")]]

    def perform_create(self, serializer):
        project = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="project_created",
            entity_type="project",
            entity_id=project.id,
            metadata={"name": project.name},
        )


class TaskViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = Task.objects.select_related("organization", "project", "created_by", "assigned_to")
    serializer_class = TaskSerializer

    def get_permissions(self):
        action_permissions = {
            "create": [IsAuthenticated, has_permission("assign_task")],
            "update": [IsAuthenticated],
            "partial_update": [IsAuthenticated],
            "destroy": [IsAuthenticated, has_permission("assign_task")],
        }
        permission_classes = action_permissions.get(self.action, [IsAuthenticated])
        return [permission() for permission in permission_classes]

    def _can_update_task(self, user, task, payload_keys):
        if user.is_owner or user.has_permission_code("assign_task"):
            return True

        normalized_keys = set(payload_keys) - {"id", "organization", "created_at", "updated_at"}
        return task.assigned_to_id == user.id and normalized_keys <= {"status"}

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        if not self._can_update_task(request.user, task, request.data.keys()):
            return Response(
                {"detail": "You can only move tasks assigned to you between statuses."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        task = self.get_object()
        if not self._can_update_task(request.user, task, request.data.keys()):
            return Response(
                {"detail": "You can only move tasks assigned to you between statuses."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        task = serializer.save()
        create_task_activity_log(
            task=task,
            actor=self.request.user,
            action="created",
            message=f"Task '{task.title}' was created in {task.project.name}.",
        )
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="task_created",
            entity_type="task",
            entity_id=task.id,
            metadata={
                "title": task.title,
                "project_name": task.project.name,
                "task_type": task.task_type,
                "priority": task.priority,
                "story_points": task.story_points,
                "assigned_to_email": task.assigned_to.email if task.assigned_to else "",
                "status": task.status,
            },
        )
        if task.assigned_to:
            create_notification(
                organization=self.request.user.organization,
                recipient=task.assigned_to,
                notification_type="task_assigned",
                title="New task assigned",
                message=f"You were assigned task: {task.title}",
                entity_type="task",
                entity_id=task.id,
            )

    def perform_update(self, serializer):
        previous_task = self.get_object()
        tracked_fields = {
            "title": previous_task.title,
            "description": previous_task.description,
            "status": previous_task.status,
            "task_type": previous_task.task_type,
            "priority": previous_task.priority,
            "story_points": previous_task.story_points,
            "project": previous_task.project,
            "assigned_to": previous_task.assigned_to,
            "due_date": previous_task.due_date,
        }
        task = serializer.save()
        field_labels = {
            "title": "title",
            "description": "description",
            "status": "status",
            "task_type": "task type",
            "priority": "priority",
            "story_points": "story points",
            "project": "project",
            "assigned_to": "assignee",
            "due_date": "due date",
        }

        changed_fields = []
        for field_name, previous_value in tracked_fields.items():
            current_value = getattr(task, field_name)
            if _normalize_task_value(previous_value) != _normalize_task_value(current_value):
                changed_fields.append(field_labels[field_name])
                create_task_activity_log(
                    task=task,
                    actor=self.request.user,
                    action="updated",
                    message=(
                        f"{field_labels[field_name].capitalize()} changed from "
                        f"{_normalize_task_value(previous_value) or 'empty'} to "
                        f"{_normalize_task_value(current_value) or 'empty'}."
                    ),
                    field_name=field_name,
                    old_value=previous_value,
                    new_value=current_value,
                )

        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="task_updated",
            entity_type="task",
            entity_id=task.id,
            metadata={
                "title": task.title,
                "project_name": task.project.name,
                "previous_project_name": tracked_fields["project"].name,
                "task_type": task.task_type,
                "previous_task_type": tracked_fields["task_type"],
                "priority": task.priority,
                "previous_priority": tracked_fields["priority"],
                "story_points": task.story_points,
                "previous_story_points": tracked_fields["story_points"],
                "assigned_to_email": task.assigned_to.email if task.assigned_to else "",
                "previous_assigned_to_email": tracked_fields["assigned_to"].email if tracked_fields["assigned_to"] else "",
                "status": task.status,
                "previous_status": tracked_fields["status"],
                "due_date": task.due_date.isoformat() if task.due_date else "",
                "previous_due_date": tracked_fields["due_date"].isoformat() if tracked_fields["due_date"] else "",
                "changed_fields": changed_fields,
            },
        )
        if task.assigned_to:
            create_notification(
                organization=self.request.user.organization,
                recipient=task.assigned_to,
                notification_type="task_assigned",
                title="Task updated",
                message=f"Task '{task.title}' is assigned to you.",
                entity_type="task",
                entity_id=task.id,
            )


class TaskActivityLogViewSet(OrganizationScopedMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = TaskActivityLog.objects.select_related("organization", "task", "actor")
    serializer_class = TaskActivityLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset
