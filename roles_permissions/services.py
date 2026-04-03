from roles_permissions.constants import DEFAULT_PERMISSIONS
from roles_permissions.models import Permission


def seed_default_permissions():
    created_codes = []
    updated_codes = []

    for permission_data in DEFAULT_PERMISSIONS:
        permission, created = Permission.objects.update_or_create(
            code=permission_data["code"],
            defaults={
                "module": permission_data["module"],
                "description": permission_data["description"],
            },
        )
        if created:
            created_codes.append(permission.code)
        else:
            updated_codes.append(permission.code)

    return {
        "created": created_codes,
        "updated": updated_codes,
        "total": len(DEFAULT_PERMISSIONS),
    }
