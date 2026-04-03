from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from audit_logs.models import AuditLog
from organizations.models import Organization
from requests_app.models import Request, RequestAttachment
from roles_permissions.models import Permission, Role, RolePermission, UserRole
from roles_permissions.services import seed_default_permissions

User = get_user_model()


class RequestsAPITests(APITestCase):
    def setUp(self):
        seed_default_permissions()
        self.organization = Organization.objects.create(name="Northwind")
        self.other_organization = Organization.objects.create(name="Contoso")

        self.owner = User.objects.create_user(
            email="owner@northwind.com",
            password="supersecure123",
            organization=self.organization,
            is_owner=True,
            is_staff=True,
        )
        self.member = User.objects.create_user(
            email="member@northwind.com",
            password="supersecure123",
            organization=self.organization,
        )
        self.other_user = User.objects.create_user(
            email="user@contoso.com",
            password="supersecure123",
            organization=self.other_organization,
        )

        self.approver_role = Role.objects.create(
            organization=self.organization,
            name="Approver",
            description="Can approve requests",
        )
        approve_permission = Permission.objects.get(code="approve_request")
        RolePermission.objects.create(
            organization=self.organization,
            role=self.approver_role,
            permission=approve_permission,
        )
        UserRole.objects.create(
            organization=self.organization,
            user=self.member,
            role=self.approver_role,
        )

    def test_request_list_is_scoped_to_authenticated_users_organization(self):
        own_request = Request.objects.create(
            organization=self.organization,
            title="Northwind Request",
            description="Scoped request",
            created_by=self.owner,
        )
        other_request = Request.objects.create(
            organization=self.other_organization,
            title="Contoso Request",
            description="Should not leak",
            created_by=self.other_user,
        )
        self.client.force_authenticate(user=self.owner)

        response = self.client.get("/api/requests/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["results"]]
        self.assertIn(own_request.title, titles)
        self.assertNotIn(other_request.title, titles)

    def test_owner_can_create_request_with_assignee_in_same_organization(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            "/api/requests/",
            {
                "title": "Purchase laptops",
                "description": "Need 3 new laptops",
                "assigned_to": [self.member.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_instance = Request.objects.get(title="Purchase laptops")
        self.assertEqual(request_instance.organization, self.organization)
        self.assertEqual(request_instance.assigned_to.first(), self.member)

    def test_request_creation_rejects_cross_organization_assignee(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            "/api/requests/",
            {
                "title": "Cross tenant request",
                "description": "This should fail",
                "assigned_to": [self.other_user.id],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assigned_to", response.data)

    def test_user_with_approve_permission_can_approve_request(self):
        request_instance = Request.objects.create(
            organization=self.organization,
            title="Budget Approval",
            description="Awaiting approval",
            created_by=self.owner,
        )
        request_instance.assigned_to.add(self.member)
        self.client.force_authenticate(user=self.member)

        response = self.client.post(
            f"/api/requests/{request_instance.id}/workflow/",
            {"action": "approval", "comment": "Approved by approver"},
            format="json",
        )

        request_instance.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(request_instance.status, Request.Status.APPROVED)

        audit_log = AuditLog.objects.filter(
            organization=self.organization,
            action="request_approval",
            entity_type="request",
            entity_id=request_instance.id,
        ).latest("timestamp")
        self.assertEqual(audit_log.metadata["request_title"], request_instance.title)
        self.assertEqual(audit_log.metadata["created_by_email"], self.owner.email)
        self.assertEqual(audit_log.metadata["request_status"], Request.Status.APPROVED)
        self.assertEqual(audit_log.metadata["comment"], "Approved by approver")

    def test_request_reassignment_audit_contains_previous_and_next_assignee(self):
        request_instance = Request.objects.create(
            organization=self.organization,
            title="Facilities Request",
            description="Needs reassignment",
            created_by=self.owner,
        )
        request_instance.assigned_to.add(self.member)
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"/api/requests/{request_instance.id}/workflow/",
            {"action": "reassignment", "comment": "Move this to the owner", "to_user": self.owner.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        audit_log = AuditLog.objects.filter(
            organization=self.organization,
            action="request_reassignment",
            entity_type="request",
            entity_id=request_instance.id,
        ).latest("timestamp")
        self.assertIn(self.member.email, audit_log.metadata["previous_assignee_emails"])
        self.assertIn(self.owner.email, audit_log.metadata["assigned_to_emails"])
        self.assertEqual(audit_log.metadata["to_user_email"], self.owner.email)
        self.assertEqual(audit_log.metadata["from_user_email"], self.member.email)

    def test_request_can_be_reraised_to_pending_by_creator(self):
        request_instance = Request.objects.create(
            organization=self.organization,
            title="Travel Request",
            description="Needs to be reopened",
            created_by=self.owner,
            status=Request.Status.APPROVED,
        )
        request_instance.assigned_to.add(self.member)
        self.client.force_authenticate(user=self.owner)

        response = self.client.post(
            f"/api/requests/{request_instance.id}/workflow/",
            {"action": "reraise", "comment": "Approval was not final"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_instance.refresh_from_db()
        self.assertEqual(request_instance.status, Request.Status.PENDING)
        audit_log = AuditLog.objects.filter(
            organization=self.organization,
            action="request_reraise",
            entity_type="request",
            entity_id=request_instance.id,
        ).latest("timestamp")
        self.assertEqual(audit_log.metadata["previous_status"], Request.Status.APPROVED)
        self.assertEqual(audit_log.metadata["request_status"], Request.Status.PENDING)

    def test_owner_can_upload_attachment_to_request(self):
        request_instance = Request.objects.create(
            organization=self.organization,
            title="Attachment Request",
            description="Needs supporting document",
            created_by=self.owner,
        )
        self.client.force_authenticate(user=self.owner)
        upload = SimpleUploadedFile("evidence.txt", b"supporting evidence", content_type="text/plain")

        response = self.client.post(
            f"/api/requests/{request_instance.id}/attachments/",
            {"file": upload},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            RequestAttachment.objects.filter(
                organization=self.organization,
                request=request_instance,
                uploaded_by=self.owner,
            ).exists()
        )

    def test_unrelated_user_cannot_comment_on_request_workflow(self):
        request_instance = Request.objects.create(
            organization=self.organization,
            title="Restricted Workflow",
            description="Should not allow unrelated comments",
            created_by=self.owner,
        )
        outsider = User.objects.create_user(
            email="outsider@northwind.com",
            password="supersecure123",
            organization=self.organization,
        )
        self.client.force_authenticate(user=outsider)

        response = self.client.post(
            f"/api/requests/{request_instance.id}/workflow/",
            {"action": "comment", "comment": "I should not be able to do this"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
