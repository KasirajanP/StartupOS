from django.contrib.auth import get_user_model
from rest_framework import serializers

from tasks_app.models import Project, Task, TaskActivityLog

User = get_user_model()


class ProjectSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        return Project.objects.create(
            organization=user.organization,
            created_by=user,
            **validated_data,
        )

    def validate_name(self, value):
        request = self.context["request"]
        queryset = Project.objects.filter(organization=request.user.organization, name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A project with this name already exists in your organization.")
        return value


class TaskSerializer(serializers.ModelSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    assigned_to_email = serializers.EmailField(source="assigned_to.email", read_only=True)
    assigned_to_details = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "organization",
            "project",
            "title",
            "description",
            "status",
            "task_type",
            "priority",
            "story_points",
            "created_by",
            "created_by_email",
            "assigned_to",
            "assigned_to_email",
            "assigned_to_details",
            "due_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organization",
            "created_by",
            "created_by_email",
            "assigned_to_email",
            "created_at",
            "updated_at",
        ]

    def validate_project(self, project):
        organization_id = self.context["request"].user.organization_id
        if project.organization_id != organization_id:
            raise serializers.ValidationError("Project must belong to your organization.")
        return project

    def validate_assigned_to(self, user):
        if user and user.organization_id != self.context["request"].user.organization_id:
            raise serializers.ValidationError("Assigned user must belong to your organization.")
        return user

    def validate_story_points(self, value):
        if value < 0:
            raise serializers.ValidationError("Story points cannot be negative.")
        return value

    def get_assigned_to_details(self, obj):
        if not obj.assigned_to:
            return None
        return {
            "id": obj.assigned_to.id,
            "email": obj.assigned_to.email,
            "full_name": f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
            or obj.assigned_to.email,
        }

    def create(self, validated_data):
        user = self.context["request"].user
        return Task.objects.create(
            organization=user.organization,
            created_by=user,
            **validated_data,
        )


class TaskActivityLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = TaskActivityLog
        fields = [
            "id",
            "organization",
            "task",
            "actor",
            "actor_email",
            "action",
            "message",
            "field_name",
            "old_value",
            "new_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
