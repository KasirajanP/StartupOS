from django.db import models

from common.models import OrganizationScopedModel, TimeStampedModel


class Permission(TimeStampedModel):
    code = models.CharField(max_length=100, unique=True)
    module = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["module", "code"]

    def __str__(self):
        return self.code


class Role(OrganizationScopedModel):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("organization", "name")

    def __str__(self):
        return f"{self.organization.name} - {self.name}"


class RolePermission(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )
    role = models.ForeignKey(
        "roles_permissions.Role",
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )
    permission = models.ForeignKey(
        "roles_permissions.Permission",
        on_delete=models.CASCADE,
        related_name="role_permissions",
    )

    class Meta:
        unique_together = ("role", "permission")

    def __str__(self):
        return f"{self.role.name} -> {self.permission.code}"

    def save(self, *args, **kwargs):
        self.organization = self.role.organization
        super().save(*args, **kwargs)


class UserRole(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="user_roles",
    )
    role = models.ForeignKey(
        "roles_permissions.Role",
        on_delete=models.CASCADE,
        related_name="user_roles",
    )

    class Meta:
        unique_together = ("user", "role")

    def __str__(self):
        return f"{self.user.email} -> {self.role.name}"

    def save(self, *args, **kwargs):
        self.organization = self.user.organization
        super().save(*args, **kwargs)
