from roles_permissions.constants import PERMISSION_CATALOG
from roles_permissions.models import Permission


def seed_default_permissions():
    created_codes = []
    skipped_codes = []

    for module, permissions in PERMISSION_CATALOG.items():
        for code, description in permissions.items():
            permission, created = Permission.objects.get_or_create(
                code=code,
                defaults={
                    "module": module,
                    "description": description,
                },
            )
            if created:
                created_codes.append(permission.code)
            else:
                skipped_codes.append(permission.code)

    return {
        "created": created_codes,
        "skipped": skipped_codes,
        "updated": [],
        "total": sum(len(permissions) for permissions in PERMISSION_CATALOG.values()),
    }
