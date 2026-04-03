from audit_logs.models import AuditLog
from notifications.models import Notification


def create_audit_log(*, organization, user, action, entity_type, entity_id, metadata=None):
    return AuditLog.objects.create(
        organization=organization,
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata=metadata or {},
    )


def create_notification(
    *,
    organization,
    recipient,
    notification_type,
    title,
    message,
    entity_type="",
    entity_id=None,
):
    return Notification.objects.create(
        organization=organization,
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
    )
