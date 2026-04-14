function PageLoader({ label = "Loading FitAI..." }) {
  return (
    <div className="glass-card mx-auto flex min-h-[45vh] w-full max-w-2xl flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="h-14 w-14 animate-spin rounded-full border-2 border-slate-700 border-t-neon-cyan" />
      <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
        {label}
      </p>
    </div>
  );
}

export default PageLoader;
