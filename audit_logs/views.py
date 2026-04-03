from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from audit_logs.models import AuditLog
from audit_logs.serializers import AuditLogSerializer
from common.views import OrganizationScopedMixin


class AuditLogViewSet(OrganizationScopedMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.select_related("organization", "user")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
