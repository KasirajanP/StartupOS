function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  multiple = false,
}) {
  const sharedClasses =
    "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        multiple={multiple}
        className={sharedClasses}
      >
        {!multiple ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SelectField;
