from rest_framework import decorators, mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification
from notifications.serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            organization=self.request.user.organization,
            recipient=self.request.user,
        ).select_related("recipient")

    @decorators.action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read", "updated_at"])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)
