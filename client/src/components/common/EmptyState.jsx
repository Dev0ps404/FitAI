function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center">
      <p className="font-heading text-xl font-semibold uppercase tracking-[0.06em] text-white">
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      ) : null}
    </div>
  );
}

export default EmptyState;
