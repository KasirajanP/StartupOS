import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./router/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ActivityDetailsPage from "./pages/ActivityDetailsPage";
import ManageRolesPage from "./pages/ManageRolesPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import RequestDetailsPage from "./pages/RequestDetailsPage";
import CreateRequestPage from "./pages/CreateRequestPage";
import RegisterOrganizationPage from "./pages/RegisterOrganizationPage";
import RequestsListPage from "./pages/RequestsListPage";
import TasksBoardPage from "./pages/TasksBoardPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrganizationPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RequestsListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateRequestPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/:requestId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RequestDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/:activityId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ActivityDetailsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TasksBoardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ManageUsersPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ManageRolesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
