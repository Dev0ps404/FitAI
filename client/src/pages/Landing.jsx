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
    <section className="subtle-fade-in space-y-14 py-8 md:py-12">
      <div className="hero-card relative overflow-hidden rounded-3xl border border-white/15 p-6 md:p-10">
        <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-blue-500/35 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <p className="neon-chip mb-5 inline-flex px-4 py-1">
            FitAI Gym Platform
          </p>
          <h1 className="font-heading text-4xl font-bold uppercase leading-tight tracking-[0.08em] text-white md:text-6xl">
            Train smarter with one app for workouts, diet, and progress
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-blue-100/80 md:text-base">
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
              className="panel-card transition-all duration-300 hover:scale-[1.02]"
            >
              <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-blue-100">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-blue-100/75">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <article className="panel-card">
          <h2 className="section-title">About FitAI</h2>
          <p className="mt-4 text-sm leading-relaxed text-blue-100/80 md:text-base">
            FitAI is built for real consistency. Instead of managing multiple
            apps, you can track workouts, nutrition, and your daily fitness
            numbers in one connected experience.
          </p>
        </article>

        <article className="panel-card">
          <h2 className="section-title">User Flow</h2>
          <ol className="mt-4 space-y-3 text-sm text-blue-100/80">
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
            <blockquote
              key={item.name}
              className="panel-card transition-all duration-300 hover:scale-[1.02]"
            >
              <p className="text-sm leading-relaxed text-blue-100/85">
                “{item.quote}”
              </p>
              <footer className="mt-4 text-xs uppercase tracking-[0.14em] text-blue-200">
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

