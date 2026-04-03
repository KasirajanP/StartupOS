import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../context/AuthContext";

function RegisterOrganizationPage() {
  const navigate = useNavigate();
  const { registerOrganization } = useAuth();
  const [form, setForm] = useState({
    organization_name: "",
    owner_email: "",
    owner_password: "",
    owner_first_name: "",
    owner_last_name: "",
  });
  const [message, setMessage] = useState("");
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
    setMessage("");

    try {
      const data = await registerOrganization(form);
      setMessage(`Organization ${data.organization.name} created successfully. You can sign in now.`);
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (submitError) {
      setError(submitError.message || "Unable to register the organization right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-panel backdrop-blur lg:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-pine">
          StartupOS
        </p>
        <h1 className="mt-4 font-display text-4xl font-extrabold text-slate-900">
          Create organization
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Create an organization and owner account in one step. If the email already belongs to another organization, signup will be denied automatically.
        </p>

        <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <FormField
              label="Organization name"
              name="organization_name"
              value={form.organization_name}
              onChange={handleChange}
              placeholder="Enter the organization name to create"
            />
          </div>
          <FormField
            label="Owner first name"
            name="owner_first_name"
            value={form.owner_first_name}
            onChange={handleChange}
            placeholder="Enter the first name of the organization owner"
          />
          <FormField
            label="Owner last name"
            name="owner_last_name"
            value={form.owner_last_name}
            onChange={handleChange}
            placeholder="Enter the last name of the organization owner"
          />
          <FormField
            label="Owner email"
            name="owner_email"
            value={form.owner_email}
            onChange={handleChange}
            placeholder="Enter the work email for the organization owner"
            type="email"
          />
          <FormField
            label="Owner password"
            name="owner_password"
            value={form.owner_password}
            onChange={handleChange}
            placeholder="Create the initial password for the organization owner"
            type="password"
          />
          <div className="md:col-span-2">
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </div>
          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              Back to sign in
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating organization..." : "Register organization"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterOrganizationPage;
