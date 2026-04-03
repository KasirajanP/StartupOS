from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    recipient_email = serializers.EmailField(source="recipient.email", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "organization",
            "recipient",
            "recipient_email",
            "notification_type",
            "title",
            "message",
            "is_read",
            "entity_type",
            "entity_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "recipient",
            "recipient_email",
            "notification_type",
            "title",
            "message",
            "entity_type",
            "entity_id",
            "created_at",
            "updated_at",
        ]
