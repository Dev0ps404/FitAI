function ModulePreviewCard({ title, description, status }) {
  return (
    <article className="glass-card animate-pulse-neon p-5">
      <p className="neon-chip mb-4 inline-flex">{status}</p>
      <h3 className="mb-2 font-heading text-2xl font-semibold tracking-wide text-slate-900">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-700">{description}</p>
    </article>
  );
}

export default ModulePreviewCard;
