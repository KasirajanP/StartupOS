from django.db import models

from common.models import OrganizationScopedModel


class Request(OrganizationScopedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_requests",
    )
    assigned_to = models.ManyToManyField(
        "accounts.User",
        related_name="assigned_requests",
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class RequestAttachment(OrganizationScopedModel):
    request = models.ForeignKey(
        "requests.Request",
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="request_attachments/")
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="uploaded_request_attachments",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Attachment #{self.pk} for {self.request_id}"

    def save(self, *args, **kwargs):
        self.organization = self.request.organization
        super().save(*args, **kwargs)


class RequestWorkflowStep(OrganizationScopedModel):
    class Action(models.TextChoices):
        APPROVAL = "approval", "Approval"
        REJECTION = "rejection", "Rejection"
        REASSIGNMENT = "reassignment", "Reassignment"
        COMMENT = "comment", "Comment"
        RERAISE = "reraise", "Re-raise"

    request = models.ForeignKey(
        "requests.Request",
        on_delete=models.CASCADE,
        related_name="workflow_steps",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    acted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="request_workflow_actions",
    )
    comment = models.TextField(blank=True)
    from_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="request_workflow_from_actions",
    )
    to_user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="request_workflow_to_actions",
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.request.title} - {self.action}"

    def save(self, *args, **kwargs):
        self.organization = self.request.organization
        super().save(*args, **kwargs)
