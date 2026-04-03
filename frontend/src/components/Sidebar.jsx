import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user } = useAuth();
  const canManageUsers = user?.is_owner || user?.permission_codes?.includes("manage_users");
  const canManageRoles = user?.is_owner || user?.permission_codes?.includes("manage_roles_permissions");
  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/requests", label: "Request" },
    { to: "/tasks", label: "Taskboard" },
    ...(canManageUsers ? [{ to: "/admin/users", label: "Manage Users" }] : []),
    ...(canManageRoles ? [{ to: "/admin/roles", label: "Roles & Permissions" }] : []),
  ];

  return (
    <aside className="hidden w-72 shrink-0 rounded-[28px] border border-slate-200/80 bg-slate-950 px-6 py-7 text-white shadow-panel lg:block">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        StartupOS
      </div>

      <nav className="mt-8 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
                isActive
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              ].join(" ")
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
