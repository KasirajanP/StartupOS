from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.bootstrap import bootstrap_admin_from_settings
from organizations.models import Organization

User = get_user_model()


class AccountsAPITests(APITestCase):
    def test_organization_signup_creates_owner_and_organization(self):
        payload = {
            "organization_name": "Northwind Labs",
            "owner_email": "owner@northwindlabs.com",
            "owner_password": "supersecure123",
            "owner_first_name": "Maya",
            "owner_last_name": "Patel",
        }

        response = self.client.post("/api/accounts/signup/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Organization.objects.count(), 1)
        self.assertEqual(User.objects.count(), 1)

        user = User.objects.get(email=payload["owner_email"])
        self.assertTrue(user.is_owner)
        self.assertEqual(user.organization.name, payload["organization_name"])

    def test_login_returns_current_user_roles_and_permission_codes(self):
        organization = Organization.objects.create(name="Acme")
        owner = User.objects.create_user(
            email="owner@acme.com",
            password="supersecure123",
            organization=organization,
            is_owner=True,
            is_staff=True,
            first_name="Ava",
            last_name="Stone",
        )

        response = self.client.post(
            "/api/accounts/login/",
            {"email": owner.email, "password": "supersecure123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], owner.email)
        self.assertIn("permission_codes", response.data["user"])
        self.assertTrue(response.data["user"]["is_owner"])

    def test_authenticated_user_can_fetch_profile(self):
        organization = Organization.objects.create(name="Orbit")
        user = User.objects.create_user(
            email="user@orbit.com",
            password="supersecure123",
            organization=organization,
            first_name="Leah",
            last_name="Fox",
        )
        self.client.force_authenticate(user=user)

        response = self.client.get("/api/accounts/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], user.email)
        self.assertEqual(response.data["organization"]["name"], organization.name)

    def test_owner_cannot_invite_email_that_belongs_to_another_organization(self):
        source_organization = Organization.objects.create(name="Source Org")
        target_organization = Organization.objects.create(name="Target Org")
        owner = User.objects.create_user(
            email="owner@target.com",
            password="supersecure123",
            organization=target_organization,
            is_owner=True,
            is_staff=True,
        )
        existing_user = User.objects.create_user(
            email="member@source.com",
            password="supersecure123",
            organization=source_organization,
        )
        self.client.force_authenticate(user=owner)

        response = self.client.post(
            "/api/accounts/users/",
            {
                "email": existing_user.email,
                "first_name": "Existing",
                "last_name": "Member",
                "password": "supersecure123",
                "role_ids": [],
                "is_owner": False,
                "is_staff": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already belongs to another organization", response.data["email"][0])

    def test_existing_email_cannot_create_another_organization(self):
        existing_organization = Organization.objects.create(name="Existing Org")
        User.objects.create_user(
            email="shared@existing.com",
            password="supersecure123",
            organization=existing_organization,
        )

        response = self.client.post(
            "/api/accounts/signup/",
            {
                "organization_name": "Second Org",
                "owner_email": "shared@existing.com",
                "owner_password": "supersecure123",
                "owner_first_name": "Shared",
                "owner_last_name": "User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already belongs to another organization", response.data["owner_email"][0])

    @override_settings(
        BOOTSTRAP_ADMIN_ENABLED=True,
        BOOTSTRAP_ADMIN_ORGANIZATION_NAME="Render Admin Org",
        BOOTSTRAP_ADMIN_EMAIL="admin@startupos.com",
        BOOTSTRAP_ADMIN_PASSWORD="supersecure123",
        BOOTSTRAP_ADMIN_FIRST_NAME="Render",
        BOOTSTRAP_ADMIN_LAST_NAME="Admin",
    )
    def test_bootstrap_admin_creates_superuser_and_organization(self):
        result = bootstrap_admin_from_settings()

        self.assertEqual(result["status"], "created")
        user = User.objects.get(email="admin@startupos.com")
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_owner)
        self.assertEqual(user.organization.name, "Render Admin Org")

    @override_settings(
        BOOTSTRAP_ADMIN_ENABLED=True,
        BOOTSTRAP_ADMIN_ORGANIZATION_NAME="Render Admin Org",
        BOOTSTRAP_ADMIN_EMAIL="admin@startupos.com",
        BOOTSTRAP_ADMIN_PASSWORD="supersecure123",
    )
    def test_bootstrap_admin_is_idempotent(self):
        first = bootstrap_admin_from_settings()
        second = bootstrap_admin_from_settings()

        self.assertEqual(first["status"], "created")
        self.assertEqual(second["status"], "skipped")
        self.assertEqual(second["reason"], "already_configured")
        self.assertEqual(User.objects.filter(email="admin@startupos.com").count(), 1)
