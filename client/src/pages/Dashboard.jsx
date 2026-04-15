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
    <section className="subtle-fade-in space-y-8 py-8 md:py-12">
      <div className="panel-card">
        <p className="neon-chip mb-4 inline-flex">Phase 2 Dashboard</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.07em] text-white md:text-4xl">
          Welcome, {authUser?.name || "Athlete"}
        </h1>
        <p className="mt-3 text-sm text-violet-100/80 md:text-base">
          Your current snapshot across weight, calories, and today&apos;s
          workout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="panel-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 to-violet-400" />
          <p className="text-xs uppercase tracking-[0.14em] text-violet-200/70">
            Current Weight
          </p>
          <p className="mt-3 text-3xl font-bold text-violet-100">
            {typeof latestWeight === "number"
              ? `${latestWeight} kg`
              : "No data"}
          </p>
        </article>

        <article className="panel-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
          <p className="text-xs uppercase tracking-[0.14em] text-violet-200/70">
            Calories (30d)
          </p>
          <p className="mt-3 text-3xl font-bold text-violet-100">
            {totalCalories}
          </p>
        </article>

        <article className="panel-card relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-fuchsia-500 to-violet-400" />
          <p className="text-xs uppercase tracking-[0.14em] text-violet-200/70">
            Today&apos;s Workout
          </p>
          <p className="mt-3 text-xl font-semibold text-violet-100">
            {todaysWorkout?.name || "No workout logged"}
          </p>
          <p className="mt-2 text-sm text-violet-100/75">
            {todaysWorkout
              ? `${todaysWorkout.exercises?.length || 0} exercises • ${todaysWorkout.status}`
              : "Create one from Workout tracker"}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="panel-card">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-white">
            Weight Trend
          </h2>
          <p className="mt-2 text-sm text-violet-100/75">
            Recent progress trajectory from logged weight entries.
          </p>

          {progressTimeline.length === 0 ? (
            <p className="mt-5 text-sm text-violet-200/60">
              No weight trend data yet.
            </p>
          ) : (
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressTimeline}>
                  <CartesianGrid stroke="#342a57" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#c4b5fd" fontSize={11} />
                  <YAxis stroke="#c4b5fd" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#120f24",
                      border: "1px solid #7c3aed",
                      borderRadius: "12px",
                      color: "#f4f1ff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#a78bfa"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="panel-card">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-white">
            Workout Trend
          </h2>
          <p className="mt-2 text-sm text-violet-100/75">
            Daily workout count and calories for recent sessions.
          </p>

          {workoutTimeline.length === 0 ? (
            <p className="mt-5 text-sm text-violet-200/60">
              No workout trend data yet.
            </p>
          ) : (
            <div className="mt-5 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workoutTimeline}>
                  <CartesianGrid stroke="#342a57" strokeDasharray="4 4" />
                  <XAxis dataKey="date" stroke="#c4b5fd" fontSize={11} />
                  <YAxis stroke="#c4b5fd" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#120f24",
                      border: "1px solid #7c3aed",
                      borderRadius: "12px",
                      color: "#f4f1ff",
                    }}
                  />
                  <Bar
                    dataKey="workouts"
                    fill="#8b5cf6"
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
          className="panel-card transition-all duration-300 hover:scale-[1.02]"
        >
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-violet-100">
            Workout Tracker
          </h2>
          <p className="mt-2 text-sm text-violet-100/75">
            Add, edit, or delete your workout sessions and maintain history.
          </p>
        </Link>

        <Link
          to="/diet"
          className="panel-card transition-all duration-300 hover:scale-[1.02]"
        >
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-violet-100">
            Diet Tracker
          </h2>
          <p className="mt-2 text-sm text-violet-100/75">
            Log meals, calories, and macros to stay aligned with your goals.
          </p>
        </Link>
      </div>

      <article className="panel-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-white">
              Session Manager
            </h2>
            <p className="mt-2 text-sm text-violet-100/75">
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
          <p className="mt-4 rounded-xl border border-violet-300/35 bg-violet-500/15 px-4 py-3 text-sm text-violet-100">
            {sessionFeedback}
          </p>
        ) : null}

        {isSessionsLoading ? (
          <p className="mt-4 text-sm text-violet-200/60">
            Loading active sessions...
          </p>
        ) : null}

        {!isSessionsLoading && sessions.length === 0 ? (
          <p className="mt-4 text-sm text-violet-200/60">
            No active sessions found.
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-violet-100">
                    {session.sessionLabel || "web"}
                  </p>
                  <p className="mt-1 text-xs text-violet-200/65">
                    Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-violet-300/45">
                    {session.ipAddress || "unknown ip"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {session.isCurrent ? (
                    <span className="rounded-full border border-violet-300/50 bg-violet-500/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-violet-100">
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
