from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsOwner, has_permission
from common.utils import create_audit_log
from common.views import OrganizationScopedMixin
from roles_permissions.models import Permission, Role, RolePermission, UserRole
from roles_permissions.services import seed_default_permissions
from roles_permissions.serializers import (
    PermissionSerializer,
    RolePermissionSerializer,
    RoleSerializer,
    UserRoleSerializer,
)


class PermissionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer

    def get_permissions(self):
        return [permission() for permission in [IsAuthenticated, IsOwner | has_permission("manage_roles_permissions")]]

    @action(detail=False, methods=["post"], url_path="sync-catalog")
    def sync_catalog(self, request):
        result = seed_default_permissions()
        create_audit_log(
            organization=request.user.organization,
            user=request.user,
            action="permission_catalog_synced",
            entity_type="permission_catalog",
            entity_id=0,
            metadata=result,
        )
        return Response(result, status=status.HTTP_200_OK)


class RoleViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related("role_permissions__permission")
    serializer_class = RoleSerializer

    def get_permissions(self):
        return [permission() for permission in [IsAuthenticated, IsOwner | has_permission("manage_roles_permissions")]]

    def perform_create(self, serializer):
        role = serializer.save(organization=self.request.user.organization)
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="role_created",
            entity_type="role",
            entity_id=role.id,
            metadata={"name": role.name},
        )

    def perform_update(self, serializer):
        role = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="role_updated",
            entity_type="role",
            entity_id=role.id,
        )


class RolePermissionViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = RolePermission.objects.select_related("role", "permission")
    serializer_class = RolePermissionSerializer

    def get_permissions(self):
        return [permission() for permission in [IsAuthenticated, IsOwner | has_permission("manage_roles_permissions")]]

    def perform_create(self, serializer):
        role_permission = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="role_permission_assigned",
            entity_type="role_permission",
            entity_id=role_permission.id,
            metadata={"role_id": role_permission.role_id, "permission_id": role_permission.permission_id},
        )


class UserRoleViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = UserRole.objects.select_related("user", "role")
    serializer_class = UserRoleSerializer

    def get_permissions(self):
        return [permission() for permission in [IsAuthenticated, IsOwner | has_permission("manage_users")]]

    def perform_create(self, serializer):
        user_role = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="user_role_assigned",
            entity_type="user_role",
            entity_id=user_role.id,
            metadata={"user_id": user_role.user_id, "role_id": user_role.role_id},
        )
