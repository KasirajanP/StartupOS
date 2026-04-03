import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

describe("ProtectedRoute", () => {
  it("shows a loading state while auth is bootstrapping", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isBootstrapping: true,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading workspace...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from protected content", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isBootstrapping: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isBootstrapping: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
