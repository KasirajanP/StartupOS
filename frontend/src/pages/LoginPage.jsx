import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname ?? "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError("Unable to sign in with those credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] bg-slate-950 p-8 text-white shadow-panel lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
            STARTUPOS
          </p>
          <h1 className="mt-5 max-w-xl font-display text-5xl font-extrabold leading-tight">
            "manage all your workflows"
          </h1>
        </section>

        <section className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-panel backdrop-blur lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ember">
            Sign in
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-slate-900">
            Access your workspace
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Use your organization email and password to continue.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <FormField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your organization email"
              type="email"
            />
            <FormField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password to sign in"
              type="password"
            />
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Need a workspace?{" "}
            <Link to="/register" className="font-semibold text-amber-700 hover:text-amber-800">
              Create an organization
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
