import ModulePreviewCard from "../components/common/ModulePreviewCard";

const modulePreview = [
  {
    title: "Workout Intelligence",
    description:
      "Track sets, reps, load, and progression metrics with real-time updates across devices.",
    status: "Workout Module",
  },
  {
    title: "Diet and Macros",
    description:
      "Log meals, monitor macros, and receive adaptive diet suggestions powered by AI.",
    status: "Diet Module",
  },
  {
    title: "Coach Assistant",
    description:
      "Chat with FitAI to get injury-safe recommendations personalized to your progress profile.",
    status: "AI Trainer",
  },
];

function LandingPage() {
  return (
    <section className="space-y-10">
      <div className="glass-card overflow-hidden p-6 md:p-10">
        <p className="neon-chip mb-5 inline-flex">Production Setup</p>
        <h1 className="max-w-3xl font-heading text-4xl font-bold uppercase tracking-[0.07em] text-white md:text-6xl">
          FitAI Smart Gym Management + AI Fitness Tracker
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
          Step 1 completed scaffolding: MERN architecture, role-based app
          routes, secure backend baseline, and neon-dark UI framework for full
          feature development.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {modulePreview.map((item) => (
          <ModulePreviewCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

export default LandingPage;
