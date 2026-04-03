from django.db import models

from common.models import OrganizationScopedModel


class Notification(OrganizationScopedModel):
    class Type(models.TextChoices):
        REQUEST_ASSIGNED = "request_assigned", "Request Assigned"
        REQUEST_APPROVED = "request_approved", "Request Approved"
        REQUEST_REJECTED = "request_rejected", "Request Rejected"
        TASK_ASSIGNED = "task_assigned", "Task Assigned"

    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=50, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    entity_type = models.CharField(max_length=100, blank=True)
    entity_id = models.PositiveBigIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.email} - {self.notification_type}"
