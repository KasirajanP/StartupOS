from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import (
    CurrentUserView,
    LogoutView,
    OrganizationSignupView,
    StartupOSTokenObtainPairView,
    StartupOSTokenRefreshView,
    UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")

app_name = "accounts"

urlpatterns = [
    path("signup/", OrganizationSignupView.as_view(), name="signup"),
    path("login/", StartupOSTokenObtainPairView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", StartupOSTokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="me"),
    path("", include(router.urls)),
]
