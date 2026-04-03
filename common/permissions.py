from rest_framework.permissions import BasePermission


class HasModulePermission(BasePermission):
    """
    Base permission for permission-code checks.
    Subclasses should set `permission_code`.
    """

    permission_code = None

    def has_permission(self, request, view):
        permission_code = self.permission_code or getattr(view, "required_permission", None)
        user = request.user

        if not permission_code:
            return True

        if not user or not user.is_authenticated:
            return False

        return user.has_permission_code(permission_code)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_owner)


def has_permission(permission_code):
    class RequiredPermission(HasModulePermission):
        pass

    RequiredPermission.permission_code = permission_code
    RequiredPermission.__name__ = f"HasPermission_{permission_code}"
    return RequiredPermission
