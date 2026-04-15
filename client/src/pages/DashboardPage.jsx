import { useMemo } from "react";
import {
  Bell,
  CalendarClock,
  ClipboardList,
  Dumbbell,
  Flame,
  Home,
  LogOut,
  Menu,
  Moon,
  PersonStanding,
  Plus,
  Salad,
  Sparkles,
  UtensilsCrossed,
  Weight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(toNumber(value, 0)));
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(toNumber(totalMinutes, 0)));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatWeight(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value.toFixed(1)} kg`;
}

function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "FA";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getFirstName(name) {
  if (!name || typeof name !== "string") {
    return "Athlete";
  }

  return name.trim().split(" ")[0] || "Athlete";
}

function buildWeekChart(timeline = []) {
  const today = new Date();
  const dayMap = new Map();

  for (const item of timeline) {
    if (item?._id) {
      dayMap.set(item._id, toNumber(item.calories, 0));
    }
  }

  const points = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    points.push({
      label: DAY_LABELS[date.getDay() === 0 ? 6 : date.getDay() - 1],
      calories: dayMap.get(key) || 0,
    });
  }

  const maxCalories = Math.max(...points.map((item) => item.calories), 1);

  return points.map((point, index) => {
    if (point.calories <= 0) {
      return {
        ...point,
        heightPercent: 35,
        isActive: false,
      };
    }

    return {
      ...point,
      heightPercent: Math.max(
        38,
        Math.round((point.calories / maxCalories) * 85),
      ),
      isActive: index === points.length - 1,
    };
  });
}

function buildRecentActivity(progressTimeline = []) {
  const sorted = [...progressTimeline].sort(
    (left, right) => new Date(right.date) - new Date(left.date),
  );

  const latest = sorted.slice(0, 3).map((entry) => {
    const entryDate = entry?.date ? new Date(entry.date) : null;

    return {
      id: entry?._id || String(Math.random()),
      label:
        typeof entry?.weightKg === "number"
          ? `Weight check-in: ${entry.weightKg.toFixed(1)} kg`
          : "Progress check-in logged",
      time: entryDate
        ? new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(entryDate)
        : "Recent",
    };
  });

  if (latest.length > 0) {
    return latest;
  }

  return [
    { id: "fallback-1", label: "No progress entries yet", time: "Today" },
    { id: "fallback-2", label: "Log your first workout", time: "Now" },
    { id: "fallback-3", label: "Add a nutrition log", time: "Today" },
  ];
}

function DashboardPage() {
  const { authUser, isAuthBusy, logout } = useAuth();
  const [workoutsQuery, nutritionQuery, progressQuery] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "workouts"],
        queryFn: workoutsApi.getStats,
      },
      {
        queryKey: ["dashboard", "nutrition"],
        queryFn: dietApi.getSummary,
      },
      {
        queryKey: ["dashboard", "progress"],
        queryFn: progressApi.getAnalytics,
      },
    ],
  });

  const workoutSummary = workoutsQuery.data?.summary || {
    totalCalories: 0,
    totalDurationMin: 0,
    completedCount: 0,
    totalCount: 0,
  };
  const workoutTimeline = workoutsQuery.data?.timeline || [];

  const nutritionSummary = nutritionQuery.data?.summary || {
    totalCalories: 0,
    totalProteinG: 0,
    totalCarbsG: 0,
    totalFatsG: 0,
    logCount: 0,
  };

  const progressSummary = progressQuery.data?.summary || {
    firstWeight: null,
    latestWeight: null,
    weightChangeKg: null,
  };
  const progressTimeline = progressQuery.data?.timeline || [];

  const completedCount = toNumber(workoutSummary.completedCount, 0);
  const totalCount = toNumber(workoutSummary.totalCount, 0);
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const intensitySlots = [0, 1, 2, 3];
  const activeIntensityBars = Math.min(
    intensitySlots.length,
    Math.max(1, Math.ceil((completionRate || 5) / 25)),
  );

  const logsCount = Math.max(1, toNumber(nutritionSummary.logCount, 0));
  const calorieTarget = logsCount * 2200;
  const calorieConsumed = toNumber(nutritionSummary.totalCalories, 0);
  const calorieRemaining = Math.max(0, calorieTarget - calorieConsumed);

  const macroTargets = {
    protein: logsCount * 180,
    carbs: logsCount * 240,
    fats: logsCount * 70,
  };

  const quickStats = [
    {
      label: "Workouts",
      value: `${completedCount}/${Math.max(totalCount, 1)}`,
      subtext: "completed",
      icon: Dumbbell,
      iconClassName: "bg-[#0052ff]/10 text-[#0048e2]",
    },
    {
      label: "Duration",
      value: formatDuration(workoutSummary.totalDurationMin),
      subtext: "last 30 days",
      icon: CalendarClock,
      iconClassName: "bg-[#dee1f9] text-[#0052fe]",
    },
    {
      label: "Weight",
      value: formatWeight(progressSummary.latestWeight),
      subtext:
        typeof progressSummary.weightChangeKg === "number"
          ? `${progressSummary.weightChangeKg > 0 ? "+" : ""}${progressSummary.weightChangeKg.toFixed(1)} kg trend`
          : "no baseline yet",
      icon: Weight,
      iconClassName: "bg-[#ecccfb] text-[#6f567d]",
    },
  ];

  const chartPoints = useMemo(
    () => buildWeekChart(workoutTimeline),
    [workoutTimeline],
  );

  const recentActivity = useMemo(
    () => buildRecentActivity(progressTimeline),
    [progressTimeline],
  );

  const reminderItems = [
    {
      id: "workout-reminder",
      title: "Workout consistency",
      subtitle:
        totalCount > 0
          ? `${Math.max(totalCount - completedCount, 0)} workout(s) pending`
          : "Start your first workout plan",
      icon: Dumbbell,
      style: "bg-[#f2f3f7] text-[#0048e2]",
    },
    {
      id: "nutrition-reminder",
      title: "Calorie target",
      subtitle:
        calorieRemaining > 0
          ? `${formatNumber(calorieRemaining)} kcal remaining`
          : "Target reached for logged meals",
      icon: Salad,
      style: "bg-[#dee1f9] text-[#0052fe]",
    },
  ];

  const errorMessage = [workoutsQuery, nutritionQuery, progressQuery]
    .filter((query) => query.isError)
    .map((query) => getApiErrorMessage(query.error, "Dashboard data unavailable."))
    .join(" ");

  async function handleLogout() {
    await logout();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f9f9fc] pb-32 text-[#2f3337]">
      <div className="pointer-events-none absolute left-[-8%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[#0052ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[-8%] h-[30rem] w-[30rem] rounded-full bg-[#ecccfb]/40 blur-3xl" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#aeb2b7]/20 bg-[#f9f9fc]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-[#2f3337] transition-colors hover:bg-[#dfe3e8]"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-heading text-2xl font-extrabold tracking-tighter">
              FITAI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full p-2 text-[#2f3337] transition-colors hover:bg-[#dfe3e8]"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe3e8] font-semibold text-[#2f3337]">
              {getInitials(authUser?.name)}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl space-y-10 px-6 pb-24 pt-24">
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1
              className="font-heading text-[2.4rem] font-extrabold leading-tight tracking-tight md:text-[3.4rem]"
              style={{ letterSpacing: "-0.02em" }}
            >
              Hello, {getFirstName(authUser?.name)}!
            </h1>
            <p className="mt-2 text-sm font-medium text-[#5b5f64] md:text-base">
              Your precision performance data for today is ready.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isAuthBusy}
            className="inline-flex items-center gap-2 rounded-full border border-[#aeb2b7]/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2f3337] transition hover:bg-[#f2f3f7] disabled:opacity-60"
          >
            <LogOut size={14} />
            {isAuthBusy ? "Signing out..." : "Logout"}
          </button>
        </div>

        {workoutsQuery.isPending || nutritionQuery.isPending || progressQuery.isPending ? (
          <div className="rounded-2xl border border-[#aeb2b7]/25 bg-white px-4 py-3 text-sm text-[#5b5f64] shadow-[0px_20px_40px_rgba(47,51,55,0.06)]">
            Refreshing live metrics...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="flex items-center justify-between rounded-xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]"
              >
                <div>
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#5a5e72]">
                    {stat.label}
                  </span>
                  <p className="text-2xl font-bold text-[#2f3337]">{stat.value}</p>
                  <p className="mt-1 text-xs text-[#5b5f64]">{stat.subtext}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.iconClassName}`}
                >
                  <Icon size={20} />
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <article className="relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-2xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] lg:col-span-8">
            <div className="absolute right-[-4rem] top-[-4rem] h-64 w-64 rounded-full bg-[#0052ff]/5 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#0052ff]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0048e2]">
                    <Sparkles size={13} />
                    Active Window
                  </span>
                  <h2 className="font-heading text-2xl font-bold text-[#2f3337]">
                    30-Day Workout Overview
                  </h2>
                  <p className="mt-1 text-sm text-[#5b5f64]">
                    {completedCount} completed sessions across {totalCount} planned workouts.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#777b80]">
                    Intensity
                  </span>
                  <div className="mt-1 flex gap-1">
                    {intensitySlots.map((slot) => (
                      <div
                        key={slot}
                        className={`h-4 w-2 rounded-full ${
                          slot < activeIntensityBars
                            ? "bg-[#0048e2]"
                            : "bg-[#aeb2b7]/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#2f3337]">
                  <span>Workout Progress</span>
                  <span>{completionRate}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#eceef2]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0048e2] to-[#0052fe]"
                    style={{ width: `${Math.max(completionRate, 8)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 flex flex-wrap gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0048e2] to-[#0052fe] px-6 py-3 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
              >
                <Home size={16} />
                Home
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-[#eceef2] px-6 py-3 text-sm font-bold text-[#0048e2] transition-all hover:bg-[#dfe3e8] active:scale-95"
              >
                <PersonStanding size={16} />
                Start Workout
              </button>
            </div>
          </article>

          <article className="flex flex-col rounded-2xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] lg:col-span-4">
            <h3 className="font-heading text-xl font-bold text-[#2f3337]">Nutrition</h3>
            <div className="mt-6 flex flex-1 flex-col gap-6">
              <div className="flex items-end justify-between">
                <div>
                  <span className="block text-[2.5rem] font-extrabold leading-none text-[#2f3337]">
                    {formatNumber(calorieConsumed)}
                  </span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                    kcal consumed
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold text-[#0042d3]">
                    {formatNumber(calorieRemaining)}
                  </span>
                  <span className="block text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                    remaining
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-[#4e5266]">
                    <span>Protein</span>
                    <span>
                      {formatNumber(nutritionSummary.totalProteinG)}g / {formatNumber(macroTargets.protein)}g
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eceef2]">
                    <div
                      className="h-full rounded-full bg-[#0042d3]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (toNumber(nutritionSummary.totalProteinG, 0) /
                              Math.max(macroTargets.protein, 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-[#4e5266]">
                    <span>Carbs</span>
                    <span>
                      {formatNumber(nutritionSummary.totalCarbsG)}g / {formatNumber(macroTargets.carbs)}g
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eceef2]">
                    <div
                      className="h-full rounded-full bg-[#5a5e72]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (toNumber(nutritionSummary.totalCarbsG, 0) /
                              Math.max(macroTargets.carbs, 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-[#4e5266]">
                    <span>Fats</span>
                    <span>
                      {formatNumber(nutritionSummary.totalFatsG)}g / {formatNumber(macroTargets.fats)}g
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eceef2]">
                    <div
                      className="h-full rounded-full bg-[#6f567d]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (toNumber(nutritionSummary.totalFatsG, 0) /
                              Math.max(macroTargets.fats, 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-2xl bg-[#f2f3f7] p-8 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-bold text-[#2f3337]">Strength Progress</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-white px-4 py-2 text-xs font-bold"
                >
                  Week
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#0052ff]/10 px-4 py-2 text-xs font-bold text-[#0048e2]"
                >
                  Month
                </button>
              </div>
            </div>

            <div className="mt-8 flex h-48 items-end justify-around gap-2 px-2">
              {chartPoints.map((point, index) => (
                <div
                  key={`${point.label}-${index}`}
                  className={`w-full rounded-t-full ${
                    point.isActive
                      ? "border-t-4 border-[#0048e2] bg-[#0048e2]/20"
                      : "bg-[#dfe3e8]"
                  }`}
                  style={{ height: `${point.heightPercent}%` }}
                  title={`${point.calories} kcal`}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-around text-[10px] font-bold uppercase text-[#5b5f64]">
              {chartPoints.map((point, index) => (
                <span key={`${point.label}-footer-${index}`}>{point.label}</span>
              ))}
            </div>
          </article>

          <div className="grid grid-rows-2 gap-6 lg:col-span-5">
            <article className="rounded-2xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.06)]">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList className="text-[#0048e2]" size={20} />
                <h3 className="font-heading text-xl font-bold text-[#2f3337]">Reminders</h3>
              </div>

              <div className="space-y-4">
                {reminderItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-full bg-[#f2f3f7] px-6 py-3"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.style}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#2f3337]">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-[#5b5f64]">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.06)]">
              <div className="mb-4 flex items-center gap-2">
                <Flame className="text-[#6f567d]" size={20} />
                <h3 className="font-heading text-xl font-bold text-[#2f3337]">Recent Activity</h3>
              </div>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-center justify-between pb-2 ${
                      index < recentActivity.length - 1
                        ? "border-b border-[#aeb2b7]/20"
                        : ""
                    }`}
                  >
                    <span className="text-sm text-[#2f3337]">{activity.label}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5b5f64]">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </section>

      <div className="fixed bottom-28 right-8 z-40 hidden flex-col items-end gap-4 md:flex">
        <button
          type="button"
          className="inline-flex items-center gap-3 rounded-full border border-[#aeb2b7]/15 bg-white px-6 py-4 text-[#2f3337] shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-sm font-bold">Log Meal</span>
          <UtensilsCrossed className="text-[#0048e2]" size={18} />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-3 rounded-full bg-gradient-to-br from-[#0048e2] to-[#0052fe] px-6 py-4 text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-sm font-bold">Start Workout</span>
          <Plus size={18} />
        </button>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#aeb2b7]/20 bg-[#f9f9fc]/90 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-around px-4 pb-6 pt-3">
          <button
            type="button"
            className="flex flex-col items-center justify-center rounded-2xl bg-[#0052ff]/10 px-4 py-2 text-[#0052ff] transition-all duration-200"
          >
            <Home size={18} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Home</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all duration-200 hover:text-[#0052ff]"
          >
            <Dumbbell size={18} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Workouts</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all duration-200 hover:text-[#0052ff]"
          >
            <UtensilsCrossed size={18} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Diet</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all duration-200 hover:text-[#0052ff]"
          >
            <Moon size={18} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Recovery</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all duration-200 hover:text-[#0052ff]"
          >
            <LogOut size={18} />
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </nav>
    </main>
  );
}

export default DashboardPage;
