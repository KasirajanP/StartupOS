from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from audit_logs.models import AuditLog
from notifications.models import Notification
from organizations.models import Organization
from roles_permissions.models import Permission, Role, RolePermission, UserRole
from roles_permissions.services import seed_default_permissions
from tasks_app.models import Project, Task, TaskActivityLog

User = get_user_model()


class TasksAPITests(APITestCase):
    def setUp(self):
        seed_default_permissions()
        self.organization = Organization.objects.create(name="Helios")
        self.other_organization = Organization.objects.create(name="Rival")

        self.owner = User.objects.create_user(
            email="owner@helios.com",
            password="supersecure123",
            organization=self.organization,
            is_owner=True,
            is_staff=True,
        )
        self.member = User.objects.create_user(
            email="member@helios.com",
            password="supersecure123",
            organization=self.organization,
        )
        self.other_user = User.objects.create_user(
            email="user@rival.com",
            password="supersecure123",
            organization=self.other_organization,
        )

        self.dispatch_role = Role.objects.create(
            organization=self.organization,
            name="Dispatcher",
            description="Can assign tasks",
        )
        assign_permission = Permission.objects.get(code="assign_task")
        RolePermission.objects.create(
            organization=self.organization,
            role=self.dispatch_role,
            permission=assign_permission,
        )
        UserRole.objects.create(
            organization=self.organization,
            user=self.member,
            role=self.dispatch_role,
        )

    def test_user_with_assign_task_permission_can_create_project_and_task(self):
        self.client.force_authenticate(user=self.member)

        project_response = self.client.post(
            "/api/tasks/projects/",
            {"name": "Launch Ops", "description": "Operational readiness"},
            format="json",
        )
        self.assertEqual(project_response.status_code, status.HTTP_201_CREATED)

        project_id = project_response.data["id"]
        task_response = self.client.post(
            "/api/tasks/tasks/",
            {
                "project": project_id,
                "title": "Prepare rollout board",
                "description": "Create delivery board",
                "assigned_to": self.member.id,
                "status": "todo",
                "task_type": "story",
                "priority": "high",
                "story_points": 8,
            },
            format="json",
        )

        self.assertEqual(task_response.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(title="Prepare rollout board")
        self.assertEqual(task.organization, self.organization)
        self.assertEqual(task.story_points, 8)
        self.assertEqual(task.priority, Task.Priority.HIGH)
        self.assertEqual(task.task_type, Task.TaskType.STORY)
        self.assertTrue(
            Notification.objects.filter(
                organization=self.organization,
                recipient=self.member,
                notification_type="task_assigned",
                entity_id=task.id,
            ).exists()
        )
        self.assertTrue(
            TaskActivityLog.objects.filter(
                organization=self.organization,
                task=task,
                action="created",
            ).exists()
        )
        audit_log = AuditLog.objects.get(
            organization=self.organization,
            action="task_created",
            entity_type="task",
            entity_id=task.id,
        )
        self.assertEqual(audit_log.metadata["story_points"], 8)
        self.assertEqual(audit_log.metadata["priority"], Task.Priority.HIGH)

    def test_task_creation_is_forbidden_without_assign_task_permission(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Core Platform",
            description="Project",
            created_by=self.owner,
        )
        self.client.force_authenticate(user=self.other_user)

        response = self.client.post(
            "/api/tasks/tasks/",
            {
                "project": project.id,
                "title": "Unauthorized task",
                "description": "Should fail",
                "assigned_to": self.other_user.id,
                "status": "todo",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_list_is_scoped_to_current_organization(self):
        own_project = Project.objects.create(
            organization=self.organization,
            name="Own Project",
            description="Scoped",
            created_by=self.owner,
        )
        other_project = Project.objects.create(
            organization=self.other_organization,
            name="Other Project",
            description="Scoped",
            created_by=self.other_user,
        )
        own_task = Task.objects.create(
            organization=self.organization,
            project=own_project,
            title="Own task",
            description="Visible",
            created_by=self.owner,
        )
        Task.objects.create(
            organization=self.other_organization,
            project=other_project,
            title="Hidden task",
            description="Not visible",
            created_by=self.other_user,
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.get("/api/tasks/tasks/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["results"]]
        self.assertIn(own_task.title, titles)
        self.assertNotIn("Hidden task", titles)

    def test_task_update_creates_activity_logs_for_changed_fields(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Sprint Alpha",
            description="Project",
            created_by=self.owner,
        )
        task = Task.objects.create(
            organization=self.organization,
            project=project,
            title="Refine backlog",
            description="Initial draft",
            created_by=self.owner,
            assigned_to=self.member,
            task_type=Task.TaskType.TASK,
            priority=Task.Priority.MEDIUM,
            story_points=3,
        )
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f"/api/tasks/tasks/{task.id}/",
            {
                "status": "in_progress",
                "priority": "critical",
                "story_points": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.IN_PROGRESS)
        self.assertEqual(task.priority, Task.Priority.CRITICAL)
        self.assertEqual(task.story_points, 5)
        logs = TaskActivityLog.objects.filter(task=task, action="updated")
        self.assertEqual(logs.count(), 3)
        self.assertTrue(logs.filter(field_name="status", new_value=Task.Status.IN_PROGRESS).exists())
        self.assertTrue(logs.filter(field_name="priority", new_value=Task.Priority.CRITICAL).exists())
        self.assertTrue(logs.filter(field_name="story_points", new_value="5").exists())
        audit_log = AuditLog.objects.get(
            organization=self.organization,
            action="task_updated",
            entity_type="task",
            entity_id=task.id,
        )
        self.assertEqual(audit_log.metadata["previous_status"], Task.Status.TODO)
        self.assertEqual(audit_log.metadata["status"], Task.Status.IN_PROGRESS)
        self.assertEqual(audit_log.metadata["previous_priority"], Task.Priority.MEDIUM)
        self.assertEqual(audit_log.metadata["priority"], Task.Priority.CRITICAL)

    def test_task_activity_log_endpoint_can_filter_by_task(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Sprint Beta",
            description="Project",
            created_by=self.owner,
        )
        task = Task.objects.create(
            organization=self.organization,
            project=project,
            title="Fix blocker",
            description="Task",
            created_by=self.owner,
        )
        other_task = Task.objects.create(
            organization=self.organization,
            project=project,
            title="Other task",
            description="Task",
            created_by=self.owner,
        )
        TaskActivityLog.objects.create(
            organization=self.organization,
            task=task,
            actor=self.owner,
            action="created",
            message="Created task",
        )
        TaskActivityLog.objects.create(
            organization=self.organization,
            task=other_task,
            actor=self.owner,
            action="created",
            message="Created other task",
        )
        self.client.force_authenticate(user=self.owner)

        response = self.client.get(f"/api/tasks/activity-logs/?task={task.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["task"], task.id)

    def test_assignee_can_move_own_task_between_statuses_without_assign_task_permission(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Sprint Gamma",
            description="Project",
            created_by=self.owner,
        )
        assignee = User.objects.create_user(
            email="assignee@helios.com",
            password="supersecure123",
            organization=self.organization,
        )
        task = Task.objects.create(
            organization=self.organization,
            project=project,
            title="Move me",
            description="Task",
            created_by=self.owner,
            assigned_to=assignee,
        )
        self.client.force_authenticate(user=assignee)

        response = self.client.patch(
            f"/api/tasks/tasks/{task.id}/",
            {"status": "in_progress"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.IN_PROGRESS)

    def test_assignee_cannot_edit_non_status_fields_without_assign_task_permission(self):
        project = Project.objects.create(
            organization=self.organization,
            name="Sprint Delta",
            description="Project",
            created_by=self.owner,
        )
        assignee = User.objects.create_user(
            email="assignee2@helios.com",
            password="supersecure123",
            organization=self.organization,
        )
        task = Task.objects.create(
            organization=self.organization,
            project=project,
            title="Locked task",
            description="Task",
            created_by=self.owner,
            assigned_to=assignee,
        )
        self.client.force_authenticate(user=assignee)

        response = self.client.patch(
            f"/api/tasks/tasks/{task.id}/",
            {"priority": "critical"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
