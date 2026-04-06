import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

from organizations.models import Organization

logger = logging.getLogger(__name__)


def bootstrap_admin_from_settings():
    if not settings.BOOTSTRAP_ADMIN_ENABLED:
        return {"status": "skipped", "reason": "disabled"}

    organization_name = settings.BOOTSTRAP_ADMIN_ORGANIZATION_NAME.strip()
    email = settings.BOOTSTRAP_ADMIN_EMAIL.strip()
    password = settings.BOOTSTRAP_ADMIN_PASSWORD

    if not organization_name or not email or not password:
        return {"status": "skipped", "reason": "missing_configuration"}

    User = get_user_model()

    with transaction.atomic():
        organization, organization_created = Organization.objects.get_or_create(
            name=organization_name,
        )

        user_defaults = {
            "organization": organization,
            "first_name": settings.BOOTSTRAP_ADMIN_FIRST_NAME.strip(),
            "last_name": settings.BOOTSTRAP_ADMIN_LAST_NAME.strip(),
            "is_staff": True,
            "is_superuser": True,
            "is_owner": True,
            "is_active": True,
        }
        user, user_created = User.objects.get_or_create(
            email=email,
            defaults=user_defaults,
        )

        if user_created:
            user.set_password(password)
            user.save(update_fields=["password"])
            logger.info("Bootstrapped admin user %s", email)
            return {
                "status": "created",
                "organization_created": organization_created,
                "user_created": True,
            }

        changed_fields = []
        if user.organization_id != organization.id:
            user.organization = organization
            changed_fields.append("organization")
        for field, value in user_defaults.items():
            if field == "organization":
                continue
            if getattr(user, field) != value:
                setattr(user, field, value)
                changed_fields.append(field)

        if changed_fields:
            user.save(update_fields=changed_fields)
            logger.info("Updated admin bootstrap fields for %s", email)
            return {
                "status": "updated",
                "organization_created": organization_created,
                "user_created": False,
                "updated_fields": changed_fields,
            }

    return {
        "status": "skipped",
        "reason": "already_configured",
        "organization_created": organization_created,
        "user_created": False,
    }
