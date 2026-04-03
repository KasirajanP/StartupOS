from django.contrib.auth import get_user_model
from rest_framework import serializers

from roles_permissions.models import Permission, Role, RolePermission, UserRole


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = [
            "id",
            "code",
            "module",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RolePermissionSerializer(serializers.ModelSerializer):
    role = serializers.PrimaryKeyRelatedField(read_only=True)
    permission = PermissionSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        source="role",
        queryset=Role.objects.all(),
        write_only=True,
    )
    permission_id = serializers.PrimaryKeyRelatedField(
        source="permission",
        queryset=Permission.objects.all(),
        write_only=True,
    )

    class Meta:
        model = RolePermission
        fields = [
            "id",
            "organization",
            "role",
            "role_id",
            "permission",
            "permission_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "role", "permission", "created_at", "updated_at"]

    def validate_role(self, role):
        request = self.context["request"]
        if role.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Role must belong to your organization.")
        return role

    def validate(self, attrs):
        attrs = super().validate(attrs)
        role = attrs["role"]
        permission = attrs["permission"]
        if RolePermission.objects.filter(role=role, permission=permission).exists():
            raise serializers.ValidationError("This permission is already assigned to the role.")
        return attrs

    def create(self, validated_data):
        validated_data["organization"] = validated_data["role"].organization
        return super().create(validated_data)


class RoleSerializer(serializers.ModelSerializer):
    role_permissions = RolePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "organization",
            "name",
            "description",
            "role_permissions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "created_at", "updated_at"]

    def validate_name(self, value):
        request = self.context["request"]
        queryset = Role.objects.filter(organization=request.user.organization, name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A role with this name already exists in your organization.")
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.all())
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        source="role",
        queryset=Role.objects.all(),
        write_only=True,
    )

    class Meta:
        model = UserRole
        fields = [
            "id",
            "organization",
            "user",
            "role",
            "role_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "organization", "role", "created_at", "updated_at"]

    def validate_role(self, role):
        request = self.context["request"]
        if role.organization_id != request.user.organization_id:
            raise serializers.ValidationError("Role must belong to your organization.")
        return role

    def validate_user(self, user):
        request = self.context["request"]
        if user.organization_id != request.user.organization_id:
            raise serializers.ValidationError("User must belong to your organization.")
        return user

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if UserRole.objects.filter(user=attrs["user"], role=attrs["role"]).exists():
            raise serializers.ValidationError("This role is already assigned to the user.")
        return attrs

    def create(self, validated_data):
        validated_data["organization"] = validated_data["user"].organization
        return super().create(validated_data)
