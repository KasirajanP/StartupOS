from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from audit_logs.models import AuditLog
from organizations.models import Organization

User = get_user_model()


class AuditLogsAPITests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Vertex")
        self.other_organization = Organization.objects.create(name="Outside")

        self.user = User.objects.create_user(
            email="user@vertex.com",
            password="supersecure123",
            organization=self.organization,
        )
        self.other_user = User.objects.create_user(
            email="user@outside.com",
            password="supersecure123",
            organization=self.other_organization,
        )

        self.audit_log = AuditLog.objects.create(
            organization=self.organization,
            user=self.user,
            action="request_created",
            entity_type="request",
            entity_id=11,
            metadata={"title": "Office refresh"},
        )
        AuditLog.objects.create(
            organization=self.other_organization,
            user=self.other_user,
            action="task_created",
            entity_type="task",
            entity_id=12,
            metadata={"title": "Hidden audit"},
        )

    def test_audit_log_list_is_scoped_to_authenticated_users_organization(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/audit-logs/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.audit_log.id)

    def test_audit_log_detail_returns_only_same_organization_entry(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/audit-logs/{self.audit_log.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["action"], "request_created")
