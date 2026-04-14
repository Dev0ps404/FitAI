function StatCard({ title, value, subtitle, tone = "cyan" }) {
  const toneClass =
    tone === "lime"
      ? "border-neon-lime/40 text-neon-lime"
      : tone === "amber"
        ? "border-neon-amber/40 text-neon-amber"
        : "border-neon-cyan/40 text-neon-cyan";

  return (
    <article className="glass-card p-5">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-600">
        {title}
      </p>
      <p className={`mb-1 text-3xl font-bold tracking-tight ${toneClass}`}>
        {value}
      </p>
      {subtitle ? <p className="text-sm text-slate-700">{subtitle}</p> : null}
    </article>
  );
}

export default StatCard;
