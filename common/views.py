class OrganizationScopedMixin:
    """
    Forces viewsets to stay within the authenticated user's organization.
    """

    organization_field = "organization"

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return queryset.none()

        return queryset.filter(**{self.organization_field: user.organization})
