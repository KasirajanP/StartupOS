function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
}) {
  const sharedClasses =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          className={sharedClasses}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={sharedClasses}
        />
      )}
    </label>
  );
}

export default FormField;
