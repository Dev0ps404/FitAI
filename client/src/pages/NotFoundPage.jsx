import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="glass-card mx-auto max-w-xl p-8 text-center">
      <p className="text-6xl font-heading font-bold tracking-[0.1em] text-neon-amber">
        404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.08em] text-slate-900">
        Route Not Found
      </h1>
      <p className="mt-3 text-sm text-slate-700 md:text-base">
        The page you requested does not exist in this setup stage.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-full border border-neon-cyan bg-neon-cyan/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-neon-cyan"
      >
        Back Home
      </Link>
    </section>
  );
}

export default NotFoundPage;
