from rest_framework import decorators, status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import has_permission
from common.utils import create_audit_log, create_notification
from common.views import OrganizationScopedMixin
from requests_app.models import Request, RequestAttachment, RequestWorkflowStep
from requests_app.serializers import (
    RequestAttachmentSerializer,
    RequestSerializer,
    RequestWorkflowStepSerializer,
)


class RequestViewSet(OrganizationScopedMixin, viewsets.ModelViewSet):
    queryset = Request.objects.select_related("organization", "created_by").prefetch_related(
        "assigned_to",
        "attachments",
        "workflow_steps",
    )
    serializer_class = RequestSerializer

    def get_permissions(self):
        action_permissions = {
            "create": [IsAuthenticated, has_permission("create_request")],
            "update": [IsAuthenticated, has_permission("create_request")],
            "partial_update": [IsAuthenticated, has_permission("create_request")],
            "workflow_action": [IsAuthenticated],
            "add_attachment": [IsAuthenticated, has_permission("create_request")],
        }
        permission_classes = action_permissions.get(self.action, [IsAuthenticated])
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        request_instance = serializer.save()
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="request_created",
            entity_type="request",
            entity_id=request_instance.id,
            metadata={
                "request_title": request_instance.title,
                "request_status": request_instance.status,
                "created_by_email": request_instance.created_by.email,
                "assigned_to_emails": list(request_instance.assigned_to.values_list("email", flat=True)),
            },
        )
        for assignee in request_instance.assigned_to.all():
            create_notification(
                organization=self.request.user.organization,
                recipient=assignee,
                notification_type="request_assigned",
                title="New request assigned",
                message=f"You were assigned to request: {request_instance.title}",
                entity_type="request",
                entity_id=request_instance.id,
            )

    def perform_update(self, serializer):
        previous_request = self.get_object()
        previous_status = previous_request.status
        previous_assignees = list(previous_request.assigned_to.values_list("email", flat=True))
        request_instance = serializer.save()
        current_assignees = list(request_instance.assigned_to.values_list("email", flat=True))
        changed_fields = []
        if previous_status != request_instance.status:
            changed_fields.append("status")
        if previous_assignees != current_assignees:
            changed_fields.append("assigned_to")
        create_audit_log(
            organization=self.request.user.organization,
            user=self.request.user,
            action="request_updated",
            entity_type="request",
            entity_id=request_instance.id,
            metadata={
                "request_title": request_instance.title,
                "request_status": request_instance.status,
                "previous_status": previous_status,
                "created_by_email": request_instance.created_by.email,
                "assigned_to_emails": current_assignees,
                "previous_assignee_emails": previous_assignees,
                "changed_fields": changed_fields,
            },
        )

    @decorators.action(
        detail=True,
        methods=["post"],
        parser_classes=[MultiPartParser, FormParser],
        url_path="attachments",
    )
    def add_attachment(self, request, pk=None):
        request_instance = self.get_object()
        serializer = RequestAttachmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        attachment = RequestAttachment.objects.create(
            organization=request.user.organization,
            request=request_instance,
            uploaded_by=request.user,
            file=serializer.validated_data["file"],
        )
        create_audit_log(
            organization=request.user.organization,
            user=request.user,
            action="request_attachment_added",
            entity_type="request_attachment",
            entity_id=attachment.id,
            metadata={
                "request_id": request_instance.id,
                "request_title": request_instance.title,
                "uploaded_by_email": request.user.email,
                "file_name": attachment.file.name.rsplit("/", 1)[-1],
            },
        )
        return Response(RequestAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"], url_path="workflow")
    def workflow_action(self, request, pk=None):
        request_instance = self.get_object()
        serializer = RequestWorkflowStepSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data["action"]
        previous_status = request_instance.status
        previous_assignees = list(request_instance.assigned_to.all())
        previous_assignee_emails = [user.email for user in previous_assignees]
        is_related_user = (
            request.user == request_instance.created_by
            or any(assignee.id == request.user.id for assignee in previous_assignees)
            or request.user.is_owner
            or request.user.has_permission_code("create_request")
            or request.user.has_permission_code("approve_request")
        )
        if action_type == RequestWorkflowStep.Action.APPROVAL and not request.user.has_permission_code("approve_request"):
            return Response({"detail": "You do not have approval permission."}, status=status.HTTP_403_FORBIDDEN)
        if action_type == RequestWorkflowStep.Action.REJECTION and not request.user.has_permission_code("approve_request"):
            return Response({"detail": "You do not have approval permission."}, status=status.HTTP_403_FORBIDDEN)
        if action_type == RequestWorkflowStep.Action.RERAISE and request.user != request_instance.created_by and not request.user.has_permission_code("create_request"):
            return Response({"detail": "You do not have permission to re-raise this request."}, status=status.HTTP_403_FORBIDDEN)
        if action_type in [RequestWorkflowStep.Action.COMMENT, RequestWorkflowStep.Action.REASSIGNMENT] and not is_related_user:
            return Response(
                {"detail": "You do not have permission to update this request workflow."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from_user = serializer.validated_data.get("from_user")
        if action_type == RequestWorkflowStep.Action.REASSIGNMENT and not from_user and len(previous_assignees) == 1:
            from_user = previous_assignees[0]

        workflow_step = RequestWorkflowStep.objects.create(
            organization=request.user.organization,
            request=request_instance,
            action=action_type,
            acted_by=request.user,
            comment=serializer.validated_data.get("comment", ""),
            from_user=from_user,
            to_user=serializer.validated_data.get("to_user"),
        )

        if action_type == RequestWorkflowStep.Action.APPROVAL:
            request_instance.status = Request.Status.APPROVED
        elif action_type == RequestWorkflowStep.Action.REJECTION:
            if not request.user.has_permission_code("approve_request"):
                return Response({"detail": "You do not have approval permission."}, status=status.HTTP_403_FORBIDDEN)
            request_instance.status = Request.Status.REJECTED
        elif action_type == RequestWorkflowStep.Action.REASSIGNMENT and workflow_step.to_user:
            request_instance.assigned_to.set([workflow_step.to_user])
            create_notification(
                organization=request.user.organization,
                recipient=workflow_step.to_user,
                notification_type="request_assigned",
                title="Request reassigned",
                message=f"You were reassigned to request: {request_instance.title}",
                entity_type="request",
                entity_id=request_instance.id,
            )
        elif action_type == RequestWorkflowStep.Action.RERAISE:
            request_instance.status = Request.Status.PENDING

        request_instance.save()
        create_audit_log(
            organization=request.user.organization,
            user=request.user,
            action=f"request_{action_type}",
            entity_type="request",
            entity_id=request_instance.id,
            metadata={
                "request_title": request_instance.title,
                "request_status": request_instance.status,
                "previous_status": previous_status,
                "created_by_email": request_instance.created_by.email,
                "assigned_to_emails": list(request_instance.assigned_to.values_list("email", flat=True)),
                "previous_assignee_emails": previous_assignee_emails,
                "comment": workflow_step.comment,
                "from_user_email": workflow_step.from_user.email if workflow_step.from_user else "",
                "to_user_email": workflow_step.to_user.email if workflow_step.to_user else "",
                "workflow_step_id": workflow_step.id,
            },
        )

        if action_type in [RequestWorkflowStep.Action.APPROVAL, RequestWorkflowStep.Action.REJECTION]:
            for assignee in request_instance.assigned_to.all():
                create_notification(
                    organization=request.user.organization,
                    recipient=assignee,
                    notification_type=(
                        "request_approved"
                        if action_type == RequestWorkflowStep.Action.APPROVAL
                        else "request_rejected"
                    ),
                    title=f"Request {request_instance.get_status_display()}",
                    message=f"Request '{request_instance.title}' was {request_instance.get_status_display().lower()}.",
                    entity_type="request",
                    entity_id=request_instance.id,
                )
        elif action_type == RequestWorkflowStep.Action.RERAISE:
            for assignee in request_instance.assigned_to.all():
                create_notification(
                    organization=request.user.organization,
                    recipient=assignee,
                    notification_type="request_assigned",
                    title="Request re-raised",
                    message=f"Request '{request_instance.title}' was re-raised and is pending again.",
                    entity_type="request",
                    entity_id=request_instance.id,
                )

        return Response(RequestWorkflowStepSerializer(workflow_step).data, status=status.HTTP_201_CREATED)
