import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    title: "Workout Tracking",
    description:
      "Log sets, reps, and weight with a clean workout history built for consistency.",
  },
  {
    title: "AI Trainer",
    description:
      "Get smart fitness guidance, session ideas, and recovery hints powered by AI.",
  },
  {
    title: "Diet Planner",
    description:
      "Track meals and calories in seconds so your training and nutrition stay aligned.",
  },
];

const testimonials = [
  {
    quote:
      "FitAI made my routine predictable. I can actually see progress week over week.",
    name: "Arjun • Member",
  },
  {
    quote:
      "The dashboard and trackers are simple enough to use daily, which is exactly what I needed.",
    name: "Meera • Fitness Enthusiast",
  },
];

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="space-y-14 py-8 md:py-12">
      <div className="hero-card relative overflow-hidden rounded-3xl border border-lime-400/25 p-6 md:p-10">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-lime-300/35 bg-lime-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lime-200">
            FitAI Gym Platform
          </p>
          <h1 className="text-4xl font-bold uppercase leading-tight tracking-[0.08em] text-zinc-50 md:text-6xl">
            Train smarter with one app for workouts, diet, and progress
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
            FitAI helps you move from random effort to structured fitness with a
            smooth workflow: plan, track, improve.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="primary-btn">
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signup" className="primary-btn">
                  Get Started
                </Link>
                <Link to="/login" className="secondary-btn">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <section>
        <h2 className="section-title">Features</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="panel-card transition duration-300 hover:-translate-y-1 hover:border-lime-400/40"
            >
              <h3 className="text-lg font-semibold uppercase tracking-[0.06em] text-lime-200">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="panel-card">
          <h2 className="section-title">About FitAI</h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            FitAI is built for real consistency. Instead of managing multiple
            apps, you can track workouts, nutrition, and your daily fitness
            numbers in one connected experience.
          </p>
        </article>

        <article className="panel-card">
          <h2 className="section-title">User Flow</h2>
          <ol className="mt-4 space-y-3 text-sm text-zinc-300">
            <li>1. Visit landing page</li>
            <li>2. Signup or login</li>
            <li>3. Reach dashboard</li>
            <li>4. Manage workout and diet trackers</li>
          </ol>
        </article>
      </section>

      <section>
        <h2 className="section-title">Testimonials</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <blockquote key={item.name} className="panel-card">
              <p className="text-sm leading-relaxed text-zinc-200">
                “{item.quote}”
              </p>
              <footer className="mt-4 text-xs uppercase tracking-[0.14em] text-lime-300">
                {item.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Landing;
