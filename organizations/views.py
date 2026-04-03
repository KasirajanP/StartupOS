from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from organizations.serializers import OrganizationSerializer


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.organization
