from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class OrganizationScopedQuerySet(models.QuerySet):
    def for_organization(self, organization):
        return self.filter(organization=organization)


class OrganizationScopedManager(models.Manager):
    def get_queryset(self):
        return OrganizationScopedQuerySet(self.model, using=self._db)

    def for_organization(self, organization):
        return self.get_queryset().for_organization(organization)


class OrganizationScopedModel(TimeStampedModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
    )

    objects = OrganizationScopedManager()

    class Meta:
        abstract = True
