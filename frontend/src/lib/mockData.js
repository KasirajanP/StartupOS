export const dashboardStats = [
  {
    label: "Open requests",
    value: "48",
    change: "+12% from last week",
    tone: "amber",
  },
  {
    label: "Tasks in progress",
    value: "26",
    change: "8 teams active today",
    tone: "sky",
  },
  {
    label: "Approvals awaiting action",
    value: "9",
    change: "3 urgent in finance",
    tone: "rose",
  },
  {
    label: "Audit events",
    value: "184",
    change: "Captured in the last 24h",
    tone: "emerald",
  },
];

export const recentActivity = [
  {
    id: 1,
    title: "Expense request approved",
    description: "Aisha approved the Q2 budget uplift for Growth Ops.",
    timestamp: "5 min ago",
  },
  {
    id: 2,
    title: "Role permissions updated",
    description: "Operations Managers can now assign implementation tasks.",
    timestamp: "22 min ago",
  },
  {
    id: 3,
    title: "New employee onboarded",
    description: "Darren Reed joined the Support pod under Northwind Labs.",
    timestamp: "48 min ago",
  },
];

export const notifications = [
  {
    id: 1,
    title: "Request assigned",
    message: "You were assigned to Vendor Access Request #184.",
    isRead: false,
  },
  {
    id: 2,
    title: "Task moved to In Progress",
    message: "Workspace rollout checklist is now in motion.",
    isRead: false,
  },
  {
    id: 3,
    title: "Approval completed",
    message: "Travel reimbursement request was approved by Finance.",
    isRead: true,
  },
];

export const requestItems = [
  {
    id: 184,
    title: "Vendor Access Request",
    description: "Grant temporary procurement access to the onboarding partner.",
    status: "Pending",
    owner: "Maya Patel",
    assignees: ["Rohan", "Aisha"],
    updatedAt: "12 min ago",
  },
  {
    id: 185,
    title: "Office Asset Refresh",
    description: "Replace aging design laptops for the product studio.",
    status: "Approved",
    owner: "Nina Brooks",
    assignees: ["Victor"],
    updatedAt: "1 hr ago",
  },
  {
    id: 186,
    title: "Security Tool Renewal",
    description: "Renew endpoint protection coverage before the quarter closes.",
    status: "Rejected",
    owner: "Samir Khan",
    assignees: ["Leah", "Jon"],
    updatedAt: "3 hr ago",
  },
];

export const kanbanColumns = [
  {
    id: "todo",
    title: "Todo",
    items: [
      {
        id: "tsk-14",
        title: "Design admin role matrix",
        project: "Access Control",
        assignee: "Maya",
        priority: "High",
      },
      {
        id: "tsk-18",
        title: "Prepare audit export filters",
        project: "Compliance",
        assignee: "Victor",
        priority: "Medium",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    items: [
      {
        id: "tsk-09",
        title: "Connect request dashboard cards",
        project: "Workflows",
        assignee: "Rohan",
        priority: "High",
      },
      {
        id: "tsk-12",
        title: "Implement org-aware user filters",
        project: "Core Platform",
        assignee: "Aisha",
        priority: "Low",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    items: [
      {
        id: "tsk-03",
        title: "JWT refresh strategy",
        project: "Authentication",
        assignee: "Leah",
        priority: "Done",
      },
    ],
  },
];

export const users = [
  {
    id: 1,
    name: "Maya Patel",
    email: "maya@northwindlabs.com",
    role: "Operations Manager",
    status: "Active",
  },
  {
    id: 2,
    name: "Aisha Khan",
    email: "aisha@northwindlabs.com",
    role: "Finance Approver",
    status: "Active",
  },
  {
    id: 3,
    name: "Victor Reed",
    email: "victor@northwindlabs.com",
    role: "Project Lead",
    status: "Invited",
  },
];

export const roles = [
  {
    id: 1,
    name: "Operations Manager",
    description: "Coordinates requests and team execution.",
    permissions: ["create_request", "assign_task", "view_dashboard"],
  },
  {
    id: 2,
    name: "Finance Approver",
    description: "Reviews budget and finance-related workflows.",
    permissions: ["approve_request", "view_dashboard"],
  },
];

export const permissionCatalog = [
  "create_request",
  "approve_request",
  "assign_task",
  "manage_users",
  "view_dashboard",
];
