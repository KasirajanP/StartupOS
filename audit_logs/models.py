from django.db import models

from common.models import OrganizationScopedModel


class AuditLog(OrganizationScopedModel):
    action = models.CharField(max_length=255)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    entity_type = models.CharField(max_length=100)
    entity_id = models.PositiveBigIntegerField()
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.entity_type}:{self.entity_id} - {self.action}"
