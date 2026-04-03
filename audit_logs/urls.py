from django.urls import include, path
from rest_framework.routers import DefaultRouter

from audit_logs.views import AuditLogViewSet

router = DefaultRouter()
router.register("", AuditLogViewSet, basename="audit-logs")

app_name = "audit_logs"

urlpatterns = [path("", include(router.urls))]
