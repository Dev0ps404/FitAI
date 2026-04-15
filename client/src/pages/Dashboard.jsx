import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";

function Dashboard() {
  const { authUser } = useAuth();

  const todayRange = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []);

  const { data: progressData } = useQuery({
    queryKey: ["phase1-progress-analytics"],
    queryFn: () => progressApi.getAnalytics(),
  });

  const { data: dietSummaryData } = useQuery({
    queryKey: ["phase1-diet-summary"],
    queryFn: () => dietApi.getSummary(),
  });

  const { data: todayWorkoutData } = useQuery({
    queryKey: [
      "phase1-workouts-today",
      todayRange.startDate,
      todayRange.endDate,
    ],
    queryFn: () =>
      workoutsApi.list({
        startDate: todayRange.startDate,
        endDate: todayRange.endDate,
        limit: 5,
      }),
  });

  const latestWeight = progressData?.summary?.latestWeight;
  const totalCalories = dietSummaryData?.summary?.totalCalories || 0;
  const todaysWorkout = todayWorkoutData?.workouts?.[0] || null;

  return (
    <section className="space-y-6 py-8 md:py-12">
      <div className="panel-card">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
          Dashboard
        </p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.07em] text-zinc-100 md:text-4xl">
          Welcome, {authUser?.name || "Athlete"}
        </h1>
        <p className="mt-3 text-sm text-zinc-300 md:text-base">
          Your current snapshot across weight, calories, and today&apos;s
          workout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="panel-card">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Current Weight
          </p>
          <p className="mt-3 text-3xl font-bold text-lime-200">
            {typeof latestWeight === "number"
              ? `${latestWeight} kg`
              : "No data"}
          </p>
        </article>

        <article className="panel-card">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Calories (30d)
          </p>
          <p className="mt-3 text-3xl font-bold text-lime-200">
            {totalCalories}
          </p>
        </article>

        <article className="panel-card">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
            Today&apos;s Workout
          </p>
          <p className="mt-3 text-xl font-semibold text-lime-200">
            {todaysWorkout?.name || "No workout logged"}
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            {todaysWorkout
              ? `${todaysWorkout.exercises?.length || 0} exercises • ${todaysWorkout.status}`
              : "Create one from Workout tracker"}
          </p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/workout"
          className="panel-card transition hover:border-lime-400/40"
        >
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-lime-200">
            Workout Tracker
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Add, edit, or delete your workout sessions and maintain history.
          </p>
        </Link>

        <Link
          to="/diet"
          className="panel-card transition hover:border-lime-400/40"
        >
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-lime-200">
            Diet Tracker
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Log meals, calories, and macros to stay aligned with your goals.
          </p>
        </Link>
      </div>
    </section>
  );
}

export default Dashboard;
