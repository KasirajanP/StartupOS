from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class APIRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "name": "StartupOS API",
                "version": "v1",
                "modules": {
                    "accounts": "/api/accounts/",
                    "organizations": "/api/organizations/",
                    "roles_permissions": "/api/roles/",
                    "requests": "/api/requests/",
                    "tasks": "/api/tasks/",
                    "audit_logs": "/api/audit-logs/",
                    "notifications": "/api/notifications/",
                },
            }
        )


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"})
