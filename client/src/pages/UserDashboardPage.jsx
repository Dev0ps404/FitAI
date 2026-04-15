import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import EmptyState from "../components/common/EmptyState";
import SectionCard from "../components/common/SectionCard";
import StatCard from "../components/common/StatCard";
import { getApiErrorMessage } from "../services/apiClient";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";
import { formatCompactNumber, formatDateLabel } from "../utils/formatters";

function UserDashboardPage() {
  const queryClient = useQueryClient();
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: workoutStatsData } = useQuery({
    queryKey: ["workout-stats"],
    queryFn: () => workoutsApi.getStats(),
  });

  const { data: recentWorkoutData } = useQuery({
    queryKey: ["workouts", "recent"],
    queryFn: () => workoutsApi.list({ limit: 6 }),
  });

  const { data: dietSummaryData } = useQuery({
    queryKey: ["diet-summary"],
    queryFn: () => dietApi.getSummary(),
  });

  const { data: progressAnalyticsData } = useQuery({
    queryKey: ["progress-analytics"],
    queryFn: () => progressApi.getAnalytics(),
  });

  const createProgressMutation = useMutation({
    mutationFn: (payload) => progressApi.create(payload),
    onSuccess: async () => {
      setFeedback("Progress logged successfully.");
      setWeightKg("");
      setNotes("");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["progress-analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["workout-stats"] }),
      ]);
    },
    onError: (error) => {
      setFeedback(
        getApiErrorMessage(error, "Unable to log progress right now."),
      );
    },
  });

  const progressChartData = useMemo(() => {
    const timeline = progressAnalyticsData?.timeline || [];

    return timeline
      .filter((entry) => typeof entry.weightKg === "number")
      .map((entry) => ({
        date: formatDateLabel(entry.date),
        weight: entry.weightKg,
      }));
  }, [progressAnalyticsData]);

  const workoutSummary = workoutStatsData?.summary || {};
  const nutritionSummary = dietSummaryData?.summary || {};
  const progressSummary = progressAnalyticsData?.summary || {};
  const recentWorkouts = recentWorkoutData?.workouts || [];

  function handleLogProgress(event) {
    event.preventDefault();
    setFeedback("");

    const numericWeight = Number(weightKg);

    if (!Number.isFinite(numericWeight) || numericWeight < 20) {
      setFeedback("Enter a valid weight above 20 kg.");
      return;
    }

    createProgressMutation.mutate({
      weightKg: numericWeight,
      notes: notes || undefined,
    });
  }

  return (
    <section className="space-y-5">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-4 inline-flex">User Control Center</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-slate-900 md:text-4xl">
          Your Performance Pulse
        </h1>
        <p className="mt-3 text-sm text-slate-700 md:text-base">
          Monitor workout consistency, nutrition totals, and progress momentum
          in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Workouts (30d)"
          value={formatCompactNumber(workoutSummary.totalCount || 0)}
          subtitle={`${workoutSummary.completedCount || 0} completed`}
          tone="cyan"
        />
        <StatCard
          title="Calories Burned"
          value={formatCompactNumber(workoutSummary.totalCalories || 0)}
          subtitle="Last 30 days"
          tone="lime"
        />
        <StatCard
          title="Calories Consumed"
          value={formatCompactNumber(nutritionSummary.totalCalories || 0)}
          subtitle="Tracked in diet logs"
          tone="amber"
        />
        <StatCard
          title="Weight Change"
          value={
            typeof progressSummary.weightChangeKg === "number"
              ? `${progressSummary.weightChangeKg > 0 ? "+" : ""}${progressSummary.weightChangeKg} kg`
              : "-"
          }
          subtitle="Based on logged entries"
          tone="cyan"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Weight Timeline"
          description="Trend of your logged weight entries over time."
        >
          {progressChartData.length === 0 ? (
            <EmptyState
              title="No progress entries yet"
              description="Log your first progress update to unlock analytics."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressChartData}>
                  <CartesianGrid stroke="#e9d5ff" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#6b21a8" fontSize={12} />
                  <YAxis stroke="#6b21a8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #c084fc",
                      borderRadius: "12px",
                      color: "#3b0764",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Quick Progress Log"
          description="Add a fresh weight checkpoint in seconds."
        >
          <form className="space-y-4" onSubmit={handleLogProgress}>
            <div>
              <label
                className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-600"
                htmlFor="weightKg"
              >
                Current Weight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                min="20"
                step="0.1"
                value={weightKg}
                onChange={(event) => setWeightKg(event.target.value)}
                className="w-full rounded-xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-neon-cyan"
                placeholder="78.4"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-600"
                htmlFor="progressNotes"
              >
                Notes (optional)
              </label>
              <textarea
                id="progressNotes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-neon-cyan"
                placeholder="Energy improving this week."
              />
            </div>

            <button
              type="submit"
              disabled={createProgressMutation.isPending}
              className="inline-flex w-full items-center justify-center rounded-xl border border-neon-cyan bg-neon-cyan/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-neon-cyan transition hover:bg-neon-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createProgressMutation.isPending ? "Saving..." : "Log Progress"}
            </button>
          </form>

          {feedback ? (
            <p className="mt-3 rounded-lg border border-sky-200 bg-white/80 px-3 py-2 text-xs text-slate-700">
              {feedback}
            </p>
          ) : null}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Workouts"
        description="Latest sessions synced from your workout log."
      >
        {recentWorkouts.length === 0 ? (
          <EmptyState
            title="No workouts found"
            description="Create your first workout plan to populate this feed."
          />
        ) : (
          <div className="grid gap-3">
            {recentWorkouts.map((workout) => (
              <article
                key={workout._id}
                className="rounded-xl border border-sky-200 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-slate-900">
                    {workout.name}
                  </h3>
                  <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-neon-cyan">
                    {workout.status || "planned"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {formatDateLabel(workout.date)} •{" "}
                  {workout.exercises?.length || 0} exercises
                </p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}

export default UserDashboardPage;
