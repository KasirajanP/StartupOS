from django.urls import include, path
from rest_framework.routers import DefaultRouter

from requests_app.views import RequestViewSet

router = DefaultRouter()
router.register("", RequestViewSet, basename="requests")

app_name = "requests"

urlpatterns = [path("", include(router.urls))]
