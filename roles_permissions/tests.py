from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from organizations.models import Organization
from roles_permissions.models import Permission, Role, RolePermission
from roles_permissions.services import seed_default_permissions

User = get_user_model()


class RolesPermissionsAPITests(APITestCase):
    def setUp(self):
        seed_default_permissions()
        self.organization = Organization.objects.create(name="Acme")
        self.owner = User.objects.create_user(
            email="owner@acme.com",
            password="supersecure123",
            organization=self.organization,
            is_owner=True,
            is_staff=True,
        )
        self.client.force_authenticate(user=self.owner)

    def test_owner_can_create_role(self):
        response = self.client.post(
            "/api/roles/roles/",
            {"name": "Operations Manager", "description": "Handles requests"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Role.objects.count(), 1)
        self.assertEqual(Role.objects.first().organization, self.organization)

    def test_permission_catalog_sync_endpoint_is_available_to_owner(self):
        response = self.client.post("/api/roles/permissions/sync-catalog/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 6)
        self.assertTrue(Permission.objects.filter(code="manage_users").exists())
        self.assertTrue(Permission.objects.filter(code="manage_roles_permissions").exists())

    def test_owner_can_assign_permission_to_role(self):
        role = Role.objects.create(
            organization=self.organization,
            name="Finance Approver",
            description="Approves requests",
        )
        permission = Permission.objects.get(code="approve_request")

        response = self.client.post(
            "/api/roles/role-permissions/",
            {"role_id": role.id, "permission_id": permission.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            RolePermission.objects.filter(
                organization=self.organization,
                role=role,
                permission=permission,
            ).exists()
        )
