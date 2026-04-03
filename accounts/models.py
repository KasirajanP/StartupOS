from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from accounts.managers import UserManager
from common.models import TimeStampedModel


class User(TimeStampedModel, AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="users",
    )
    is_owner = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["organization"]

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email

    def has_permission_code(self, code):
        if self.is_superuser or self.is_owner:
            return True

        return self.user_roles.filter(
            organization=self.organization,
            role__organization=self.organization,
            role__role_permissions__organization=self.organization,
            role__role_permissions__permission__code=code,
        ).exists()

    def get_permission_codes(self):
        if self.is_superuser or self.is_owner:
            from roles_permissions.models import Permission

            return list(Permission.objects.values_list("code", flat=True))

        return list(
            self.user_roles.filter(
                organization=self.organization,
                role__organization=self.organization,
                role__role_permissions__organization=self.organization,
            )
            .values_list("role__role_permissions__permission__code", flat=True)
            .distinct()
        )
