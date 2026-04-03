from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.serializers import (
    CurrentUserSerializer,
    OrganizationSignupResponseSerializer,
    OrganizationSignupSerializer,
    StartupOSTokenObtainPairSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)
from common.permissions import IsOwner, has_permission
from common.utils import create_audit_log
from common.views import OrganizationScopedMixin

User = get_user_model()


class OrganizationSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        if not settings.SELF_SERVICE_ORGANIZATION_SIGNUP:
            return Response(
                {
                    "detail": (
                        "Organization creation is managed internally. "
                        "Contact the platform administrator to provision your organization."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = OrganizationSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()

        create_audit_log(
            organization=payload["organization"],
            user=payload["user"],
            action="organization_created",
            entity_type="organization",
            entity_id=payload["organization"].id,
            metadata={"owner_email": payload["user"].email},
        )

        response_serializer = OrganizationSignupResponseSerializer(payload)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class StartupOSTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = StartupOSTokenObtainPairSerializer


class StartupOSTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = RefreshToken(refresh_token)
        token.blacklist()

        create_audit_log(
            organization=request.user.organization,
            user=request.user,
            action="logout",
            entity_type="user",
            entity_id=request.user.id,
        )
        return Response(status=status.HTTP_205_RESET_CONTENT)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(
    OrganizationScopedMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.select_related("organization").prefetch_related("user_roles__role")

    def get_permissions(self):
        if self.action in ["list", "retrieve", "create", "update", "partial_update", "destroy"]:
            permission_classes = [IsAuthenticated, IsOwner | has_permission("manage_users")]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="user_deleted",
            entity_type="user",
            entity_id=instance.id,
            metadata={"email": instance.email},
        )
        instance.delete()

    def perform_create(self, serializer):
        user = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="user_created",
            entity_type="user",
            entity_id=user.id,
            metadata={"email": user.email},
        )

    def perform_update(self, serializer):
        user = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="user_updated",
            entity_type="user",
            entity_id=user.id,
        )
