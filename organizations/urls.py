from django.urls import path

from organizations.views import OrganizationDetailView

app_name = "organizations"

urlpatterns = [
    path("me/", OrganizationDetailView.as_view(), name="organization-detail"),
]
