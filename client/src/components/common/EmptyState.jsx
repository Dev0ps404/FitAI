function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-sky-200 bg-white/75 p-6 text-center">
      <p className="font-heading text-xl font-semibold uppercase tracking-[0.06em] text-slate-900">
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-slate-700">{description}</p>
      ) : null}
    </div>
  );
}

export default EmptyState;
