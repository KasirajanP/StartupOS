from django.urls import include, path
from rest_framework.routers import DefaultRouter

from roles_permissions.views import (
    PermissionViewSet,
    RolePermissionViewSet,
    RoleViewSet,
    UserRoleViewSet,
)

router = DefaultRouter()
router.register("permissions", PermissionViewSet, basename="permissions")
router.register("role-permissions", RolePermissionViewSet, basename="role-permissions")
router.register("roles", RoleViewSet, basename="roles")
router.register("user-roles", UserRoleViewSet, basename="user-roles")

app_name = "roles_permissions"

urlpatterns = [path("", include(router.urls))]
