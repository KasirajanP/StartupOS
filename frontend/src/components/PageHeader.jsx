function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-display text-4xl font-extrabold text-slate-900">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default PageHeader;
