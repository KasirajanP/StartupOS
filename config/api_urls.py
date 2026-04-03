from django.urls import include, path

from config.api_views import APIRootView, HealthCheckView

app_name = "api"

urlpatterns = [
    path("", APIRootView.as_view(), name="root"),
    path("health/", HealthCheckView.as_view(), name="health"),
    path("accounts/", include(("accounts.urls", "accounts"), namespace="accounts")),
    path("organizations/", include(("organizations.urls", "organizations"), namespace="organizations")),
    path("roles/", include(("roles_permissions.urls", "roles_permissions"), namespace="roles_permissions")),
    path("requests/", include(("requests_app.urls", "requests"), namespace="requests")),
    path("tasks/", include(("tasks_app.urls", "tasks"), namespace="tasks")),
    path("audit-logs/", include(("audit_logs.urls", "audit_logs"), namespace="audit_logs")),
    path("notifications/", include(("notifications.urls", "notifications"), namespace="notifications")),
]
