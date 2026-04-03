from rest_framework import serializers

from audit_logs.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "organization",
            "action",
            "user",
            "user_email",
            "entity_type",
            "entity_id",
            "metadata",
            "timestamp",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
