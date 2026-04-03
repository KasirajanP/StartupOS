from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from organizations.models import Organization

User = get_user_model()


class NotificationsAPITests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(name="Summit")
        self.other_organization = Organization.objects.create(name="Elsewhere")

        self.user = User.objects.create_user(
            email="user@summit.com",
            password="supersecure123",
            organization=self.organization,
        )
        self.other_user = User.objects.create_user(
            email="user@elsewhere.com",
            password="supersecure123",
            organization=self.other_organization,
        )

        self.notification = Notification.objects.create(
            organization=self.organization,
            recipient=self.user,
            notification_type="task_assigned",
            title="New task assigned",
            message="You have work to do.",
            entity_type="task",
            entity_id=1,
        )
        Notification.objects.create(
            organization=self.other_organization,
            recipient=self.other_user,
            notification_type="request_assigned",
            title="Other tenant notice",
            message="Should not be visible.",
            entity_type="request",
            entity_id=2,
        )

    def test_notification_list_is_scoped_to_recipient_and_organization(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], self.notification.title)

    def test_user_can_mark_own_notification_as_read(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(f"/api/notifications/{self.notification.id}/mark-read/")
        self.notification.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.notification.is_read)
