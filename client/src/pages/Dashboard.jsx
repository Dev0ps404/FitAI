import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";
import { formatDateLabel } from "../utils/formatters";

function Dashboard() {
  const queryClient = useQueryClient();
  const { authUser, logout } = useAuth();
  const [sessionFeedback, setSessionFeedback] = useState("");

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

  const { data: workoutStatsData } = useQuery({
    queryKey: ["phase2-workout-stats"],
    queryFn: () => workoutsApi.getStats(),
  });

  const { data: sessionsResponse, isLoading: isSessionsLoading } = useQuery({
    queryKey: ["phase2-auth-sessions"],
    queryFn: () => authApi.getSessions(),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId) => authApi.revokeSession(sessionId),
    onSuccess: async () => {
      setSessionFeedback("Session revoked.");
      await queryClient.invalidateQueries({
        queryKey: ["phase2-auth-sessions"],
      });
    },
    onError: (error) => {
      setSessionFeedback(
        getApiErrorMessage(error, "Unable to revoke session."),
      );
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => logout({ allSessions: true }),
    onError: (error) => {
      setSessionFeedback(
        getApiErrorMessage(error, "Unable to logout all sessions."),
      );
    },
  });

  const latestWeight = progressData?.summary?.latestWeight;
  const totalCalories = dietSummaryData?.summary?.totalCalories || 0;
  const todaysWorkout = todayWorkoutData?.workouts?.[0] || null;
  const progressTimeline =
    progressData?.timeline
      ?.filter((entry) => typeof entry.weightKg === "number")
      .map((entry) => ({
        date: formatDateLabel(entry.date),
        value: entry.weightKg,
      })) || [];
  const workoutTimeline =
    workoutStatsData?.timeline?.map((entry) => ({
      date: formatDateLabel(entry._id),
      workouts: entry.workouts || 0,
      calories: entry.calories || 0,
    })) || [];
  const sessions = sessionsResponse?.data?.sessions || [];

  function handleRevokeSession(sessionId) {
    setSessionFeedback("");
    revokeSessionMutation.mutate(sessionId);
  }

  function handleLogoutAll() {
    setSessionFeedback("");
    logoutAllMutation.mutate();
  }

  return (
    <section className="space-y-8 py-8 md:py-12">
      <div className="panel-card">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
          Phase 2 Dashboard
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

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="panel-card">
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-zinc-100">
            Weight Trend
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Recent progress trajectory from logged weight entries.
          </p>

          {progressTimeline.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-400">
              No weight trend data yet.
            </p>
          ) : (
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTimeline}>
                  <CartesianGrid stroke="#3f3f46" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #65a30d",
                      borderRadius: "12px",
                      color: "#d9f99d",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel-card">
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-zinc-100">
            Workout Trend
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Daily workout count and calories for recent sessions.
          </p>

          {workoutTimeline.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-400">
              No workout trend data yet.
            </p>
          ) : (
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutTimeline}>
                  <CartesianGrid stroke="#3f3f46" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #65a30d",
                      borderRadius: "12px",
                      color: "#d9f99d",
                    }}
                  />
                  <Bar
                    dataKey="workouts"
                    fill="#84cc16"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
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

      <article className="panel-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-zinc-100">
              Session Manager
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              Revoke old devices and secure your active sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogoutAll}
            className="secondary-btn"
            disabled={logoutAllMutation.isPending}
          >
            {logoutAllMutation.isPending
              ? "Logging out..."
              : "Logout All Sessions"}
          </button>
        </div>

        {sessionFeedback ? (
          <p className="mt-4 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
            {sessionFeedback}
          </p>
        ) : null}

        {isSessionsLoading ? (
          <p className="mt-4 text-sm text-zinc-400">
            Loading active sessions...
          </p>
        ) : null}

        {!isSessionsLoading && sessions.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            No active sessions found.
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-lime-200">
                    {session.sessionLabel || "web"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {session.ipAddress || "unknown ip"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {session.isCurrent ? (
                    <span className="rounded-full border border-lime-400/50 bg-lime-400/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-lime-200">
                      Current
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session.id)}
                      className="rounded-full border border-rose-400/50 bg-rose-400/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-400/20"
                      disabled={revokeSessionMutation.isPending}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default Dashboard;
