from django.contrib.auth import get_user_model
from rest_framework import serializers

from requests_app.models import Request, RequestAttachment, RequestWorkflowStep

User = get_user_model()


class RequestAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source="uploaded_by.email", read_only=True)

    class Meta:
        model = RequestAttachment
        fields = [
            "id",
            "request",
            "file",
            "uploaded_by",
            "uploaded_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "request", "uploaded_by", "uploaded_by_email", "created_at", "updated_at"]


class RequestWorkflowStepSerializer(serializers.ModelSerializer):
    acted_by_email = serializers.EmailField(source="acted_by.email", read_only=True)
    from_user_email = serializers.EmailField(source="from_user.email", read_only=True)
    to_user_email = serializers.EmailField(source="to_user.email", read_only=True)

    class Meta:
        model = RequestWorkflowStep
        fields = [
            "id",
            "request",
            "action",
            "acted_by",
            "acted_by_email",
            "comment",
            "from_user",
            "from_user_email",
            "to_user",
            "to_user_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "request",
            "acted_by",
            "acted_by_email",
            "from_user_email",
            "to_user_email",
            "created_at",
            "updated_at",
        ]

    def validate_from_user(self, user):
        if user and user.organization_id != self.context["request"].user.organization_id:
            raise serializers.ValidationError("Users must belong to your organization.")
        return user

    def validate_to_user(self, user):
        if user and user.organization_id != self.context["request"].user.organization_id:
            raise serializers.ValidationError("Users must belong to your organization.")
        return user


class RequestSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    assigned_to_details = serializers.SerializerMethodField()
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
    )
    attachments = RequestAttachmentSerializer(many=True, read_only=True)
    workflow_steps = RequestWorkflowStepSerializer(many=True, read_only=True)

    class Meta:
        model = Request
        fields = [
            "id",
            "organization",
            "title",
            "description",
            "status",
            "created_by",
            "created_by_email",
            "assigned_to",
            "assigned_to_details",
            "attachments",
            "workflow_steps",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "created_by",
            "created_by_email",
            "attachments",
            "workflow_steps",
            "created_at",
            "updated_at",
        ]

    def validate_assigned_to(self, users):
        organization_id = self.context["request"].user.organization_id
        invalid_users = [user.id for user in users if user.organization_id != organization_id]
        if invalid_users:
            raise serializers.ValidationError("Assigned users must belong to your organization.")
        return users

    def get_assigned_to_details(self, obj):
        return [
            {
                "id": user.id,
                "email": user.email,
                "full_name": f"{user.first_name} {user.last_name}".strip() or user.email,
            }
            for user in obj.assigned_to.all()
        ]

    def create(self, validated_data):
        assigned_to = validated_data.pop("assigned_to", [])
        request_user = self.context["request"].user
        request_instance = Request.objects.create(
            organization=request_user.organization,
            created_by=request_user,
            **validated_data,
        )
        if assigned_to:
            request_instance.assigned_to.set(assigned_to)
        return request_instance

    def update(self, instance, validated_data):
        assigned_to = validated_data.pop("assigned_to", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if assigned_to is not None:
            instance.assigned_to.set(assigned_to)
        return instance
