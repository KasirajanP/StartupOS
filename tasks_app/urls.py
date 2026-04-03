from django.urls import include, path
from rest_framework.routers import DefaultRouter

from tasks_app.views import ProjectViewSet, TaskActivityLogViewSet, TaskViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="projects")
router.register("tasks", TaskViewSet, basename="tasks")
router.register("activity-logs", TaskActivityLogViewSet, basename="task-activity-logs")

app_name = "tasks"

urlpatterns = [path("", include(router.urls))]
