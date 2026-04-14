function SectionCard({ title, description, actions, children }) {
  return (
    <section className="glass-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold uppercase tracking-[0.06em] text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm text-slate-300">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default SectionCard;
