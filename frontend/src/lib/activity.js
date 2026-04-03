const ACTION_LABELS = {
  request_created: "Request created",
  request_updated: "Request updated",
  request_approval: "Request approved",
  request_rejection: "Request rejected",
  request_reassignment: "Request reassigned",
  request_comment: "Request commented",
  request_attachment_added: "Request attachment added",
  request_reraise: "Request re-raised",
  task_created: "Task created",
  task_updated: "Task updated",
  project_created: "Project created",
  role_created: "Role created",
  role_updated: "Role updated",
  role_permission_assigned: "Role permission assigned",
  user_role_assigned: "User role assigned",
  permission_catalog_synced: "Permission catalog synced",
  user_created: "User created",
  user_updated: "User updated",
  user_deleted: "User deleted",
  organization_created: "Organization created",
  logout: "User signed out",
};

export function formatAuditAction(action) {
  if (ACTION_LABELS[action]) {
    return ACTION_LABELS[action];
  }

  return action
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildActivityDescription(log) {
  const actor = log.user_email || "System";
  const metadata = log.metadata || {};
  const requestTitle = metadata.request_title || `Request #${log.entity_id}`;
  const requestOwner = metadata.created_by_email || "Unknown requester";

  if (log.action === "request_approval") {
    return `${requestTitle} from ${requestOwner} was approved by ${actor}.`;
  }

  if (log.action === "request_rejection") {
    return `${requestTitle} from ${requestOwner} was rejected by ${actor}.`;
  }

  if (log.action === "request_reassignment") {
    const fromUsers = metadata.previous_assignee_emails?.length
      ? metadata.previous_assignee_emails.join(", ")
      : metadata.from_user_email || "Unassigned";
    const toUser = metadata.to_user_email || "an updated assignee";
    return `${requestTitle} from ${requestOwner} was reassigned by ${actor} from ${fromUsers} to ${toUser}.`;
  }

  if (log.action === "request_comment") {
    return `${actor} commented on ${requestTitle}${metadata.comment ? `: ${metadata.comment}` : "."}`;
  }

  if (log.action === "request_attachment_added") {
    return `${actor} added ${metadata.file_name || "an attachment"} to ${requestTitle}.`;
  }

  if (log.action === "request_created") {
    return `${actor} created ${requestTitle} for ${requestOwner}.`;
  }

  if (log.action === "request_updated") {
    const changedFields = metadata.changed_fields?.length ? metadata.changed_fields.join(", ") : "request details";
    if (metadata.previous_assignee_emails?.length || metadata.assigned_to_emails?.length) {
      return `${actor} updated ${requestTitle}. Assignees changed from ${metadata.previous_assignee_emails?.join(", ") || "none"} to ${metadata.assigned_to_emails?.join(", ") || "none"}.`;
    }
    return `${actor} updated ${requestTitle} and changed ${changedFields}.`;
  }

  if (log.action === "request_reraise") {
    return `${actor} re-raised ${requestTitle} from ${metadata.previous_status || "approved"} back to pending.`;
  }

  if (log.action === "task_created") {
    return `${actor} created task ${metadata.title || `#${log.entity_id}`} in ${metadata.project_name || "the project"} and assigned it to ${metadata.assigned_to_email || "no one yet"}.`;
  }

  if (log.action === "task_updated") {
    if (metadata.previous_assigned_to_email !== undefined && metadata.previous_assigned_to_email !== metadata.assigned_to_email) {
      return `${actor} reassigned task ${metadata.title || `#${log.entity_id}`} from ${metadata.previous_assigned_to_email || "unassigned"} to ${metadata.assigned_to_email || "unassigned"}.`;
    }
    if (metadata.previous_status && metadata.previous_status !== metadata.status) {
      return `${actor} moved task ${metadata.title || `#${log.entity_id}`} from ${metadata.previous_status.replaceAll("_", " ")} to ${metadata.status.replaceAll("_", " ")}.`;
    }
    const changedFields = metadata.changed_fields?.length ? metadata.changed_fields.join(", ") : "task details";
    return `${actor} updated task ${metadata.title || `#${log.entity_id}`} and changed ${changedFields}.`;
  }

  if (log.action === "project_created") {
    return `${actor} created project ${metadata.name || `#${log.entity_id}`}.`;
  }

  return `${actor} performed ${formatAuditAction(log.action).toLowerCase()} on ${log.entity_type} #${log.entity_id}.`;
}
