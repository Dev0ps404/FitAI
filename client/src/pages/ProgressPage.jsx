import { useMemo, useState } from "react";
import {
  Bell,
  Brain,
  Calendar,
  ChevronRight,
  Dumbbell,
  Flame,
  Home,
  LineChart,
  LogOut,
  Menu,
  Monitor,
  Plus,
  Ruler,
  Salad,
  Scale,
  Target,
  Trash2,
  User,
  Watch,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

const DEFAULT_PHASE_START_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBeO1dr4ubZDXNDdgLm_7GtMwxWaLeCgRS-4Zt3hKbeRw6qwkBm7GyGsVL98zWGjhJerIpNmR7raThTOAIyutkj5DAwjY1hlhGwLyYqHjI9w9rvMQRM8sEj0VIHae0gg2cag-I1dWTpFIplC-e63eJJjcqAn4Mi9dsRNXyi0nw-uZBuvldg2wVFd7q5us69Mjg48XgNscMvX-l5nDaElMB8zKaEHDdy7NChCcV6OgBECAlEebPoxegULMqZcPdvyxjMVsLbVgS2qvg";
const DEFAULT_PHASE_NOW_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB__lhQyZSaB6hH1rhlqIh-TY6XDTDNc1qD-TjsZwDLRaHGtZXfLwHwurAdU6lx_5uB1njwe-W5YmI2ImyjVn5zI-QQztTWQ8wOv9jxEoSVlIBdy2Lq6jygFGjNnfyh5S14ITd8qmqVTt0D8TnGCCY5Mw6eaVKrskycDgg57DT5qsvzsBfIikK_rR8RQLck8nq3cYhBBwosNBdvFxsgOpH1kedUpPj8LJz1ILSv7gxu16NvSgGvq05nqbq04V9XfAQu9DH0_RfT5VQ";

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  weightKg: "",
  bodyFatPercent: "",
  caloriesBurned: "",
  chestCm: "",
  waistCm: "",
  armCm: "",
  thighCm: "",
  benchOneRepMaxKg: "",
  deadliftOneRepMaxKg: "",
  notes: "",
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value) {
  if (!value) {
    return "Recent";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recent";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatShortDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
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

function getTimeRangeDays(rangeKey) {
  return rangeKey === "7d" ? 7 : 30;
}

function buildWeightBars(timeline, rangeKey) {
  const days = getTimeRangeDays(rangeKey);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const weighted = timeline
    .filter((entry) => entry?.date)
    .filter((entry) => typeof entry.weightKg === "number")
    .filter((entry) => new Date(entry.date) >= cutoff)
    .slice(-8);

  if (weighted.length === 0) {
    const fallback = [82, 80, 79, 78, 76, 75, 74, 73];
    return fallback.map((value, index) => ({
      id: `fallback-${index}`,
      label: `W${index + 1}`,
      value,
      height: 35 + index * 7,
      isActive: index === fallback.length - 1,
    }));
  }

  const minWeight = Math.min(...weighted.map((item) => item.weightKg));
  const maxWeight = Math.max(...weighted.map((item) => item.weightKg));
  const spread = Math.max(maxWeight - minWeight, 0.01);

  return weighted.map((item, index) => {
    const normalized = (item.weightKg - minWeight) / spread;

    return {
      id: item._id || `entry-${index}`,
      label: formatShortDate(item.date),
      value: item.weightKg,
      height: Math.max(42, Math.round(40 + normalized * 50)),
      isActive: index === weighted.length - 1,
    };
  });
}

function findStrengthSeries(timeline, matcher) {
  return timeline
    .filter((entry) => Array.isArray(entry?.strengthMetrics))
    .flatMap((entry) =>
      entry.strengthMetrics
        .filter((metric) => matcher.test(metric?.exerciseName || ""))
        .map((metric) => ({
          date: entry.date,
          oneRepMaxKg: toNumber(metric.oneRepMaxKg, 0),
        })),
    )
    .sort((left, right) => new Date(left.date) - new Date(right.date));
}

function summarizeStrength(series) {
  if (!series.length) {
    return {
      latest: null,
      deltaKg: null,
      deltaPercent: null,
    };
  }

  const first = series[0].oneRepMaxKg;
  const latest = series[series.length - 1].oneRepMaxKg;
  const deltaKg = Number((latest - first).toFixed(1));
  const deltaPercent = first > 0 ? Number(((deltaKg / first) * 100).toFixed(1)) : null;

  return {
    latest,
    deltaKg,
    deltaPercent,
  };
}

function measurementValue(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value)} cm`;
}

function ProgressEntryModal({
  draft,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-[0px_30px_80px_rgba(15,23,42,0.35)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-[#2f3337]">
              Add Progress Entry
            </h2>
            <p className="mt-1 text-sm text-[#5b5f64]">
              Log body metrics and strength indicators for analytics.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-semibold text-[#5b5f64] hover:bg-[#f2f3f7]"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-[#2f3337]">
              Date
              <input
                type="date"
                value={draft.date}
                onChange={(event) => onChange("date", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                value={draft.weightKg}
                onChange={(event) => onChange("weightKg", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Body Fat (%)
              <input
                type="number"
                step="0.1"
                value={draft.bodyFatPercent}
                onChange={(event) => onChange("bodyFatPercent", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Calories Burned
              <input
                type="number"
                value={draft.caloriesBurned}
                onChange={(event) => onChange("caloriesBurned", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Chest (cm)
              <input
                type="number"
                step="0.1"
                value={draft.chestCm}
                onChange={(event) => onChange("chestCm", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Waist (cm)
              <input
                type="number"
                step="0.1"
                value={draft.waistCm}
                onChange={(event) => onChange("waistCm", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Right Arm (cm)
              <input
                type="number"
                step="0.1"
                value={draft.armCm}
                onChange={(event) => onChange("armCm", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Thigh (cm)
              <input
                type="number"
                step="0.1"
                value={draft.thighCm}
                onChange={(event) => onChange("thighCm", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337]">
              Bench 1RM (kg)
              <input
                type="number"
                step="0.1"
                value={draft.benchOneRepMaxKg}
                onChange={(event) => onChange("benchOneRepMaxKg", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337] md:col-span-3">
              Deadlift 1RM (kg)
              <input
                type="number"
                step="0.1"
                value={draft.deadliftOneRepMaxKg}
                onChange={(event) => onChange("deadliftOneRepMaxKg", event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
              />
            </label>

            <label className="text-sm font-semibold text-[#2f3337] md:col-span-3">
              Notes
              <textarea
                value={draft.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#d7dae0] px-3 py-2 outline-none focus:border-[#0052ff]"
                placeholder="Optional summary for this log"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#d7dae0] px-5 py-2 text-xs font-bold uppercase tracking-widest text-[#2f3337]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-[#0048e2] px-5 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressPage() {
  const { authUser, logout, isAuthBusy } = useAuth();
  const queryClient = useQueryClient();

  const [rangeKey, setRangeKey] = useState("30d");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entryDraft, setEntryDraft] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");

  const [analyticsQuery, listQuery, workoutsQuery, dietQuery] = useQueries({
    queries: [
      {
        queryKey: ["progress", "analytics", "page"],
        queryFn: progressApi.getAnalytics,
      },
      {
        queryKey: ["progress", "list", "page"],
        queryFn: () => progressApi.list({ page: 1, limit: 8 }),
      },
      {
        queryKey: ["workouts", "stats", "progress-page"],
        queryFn: workoutsApi.getStats,
      },
      {
        queryKey: ["diet", "summary", "progress-page"],
        queryFn: dietApi.getSummary,
      },
    ],
  });

  const createProgressMutation = useMutation({
    mutationFn: (payload) => progressApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowEntryModal(false);
      setEntryDraft(EMPTY_FORM);
      setNotice("Progress entry saved successfully.");
    },
  });

  const deleteProgressMutation = useMutation({
    mutationFn: (progressId) => progressApi.remove(progressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setNotice("Progress entry deleted.");
    },
  });

  const timeline = analyticsQuery.data?.timeline || [];
  const summary = analyticsQuery.data?.summary || {
    firstWeight: null,
    latestWeight: null,
    weightChangeKg: null,
  };
  const progressEntries = listQuery.data?.progressEntries || [];

  const weightBars = useMemo(
    () => buildWeightBars(timeline, rangeKey),
    [rangeKey, timeline],
  );

  const latestWeight = summary?.latestWeight;
  const firstWeight = summary?.firstWeight;
  const weightDelta =
    typeof latestWeight === "number" && typeof firstWeight === "number"
      ? Number((latestWeight - firstWeight).toFixed(1))
      : null;

  const weightDeltaLabel =
    weightDelta === null
      ? "No baseline"
      : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)}kg`;

  const latestBodyFat = useMemo(() => {
    const withBodyFat = [...timeline]
      .reverse()
      .find((entry) => typeof entry?.bodyFatPercent === "number");

    return withBodyFat?.bodyFatPercent ?? null;
  }, [timeline]);

  const targetBodyFat = 12;
  const bodyFatGoalProgress =
    typeof latestBodyFat === "number" && latestBodyFat > 0
      ? Math.min(100, Math.round((targetBodyFat / latestBodyFat) * 100))
      : 0;

  const benchSummary = useMemo(() => {
    const series = findStrengthSeries(timeline, /bench/i);
    return summarizeStrength(series);
  }, [timeline]);

  const deadliftSummary = useMemo(() => {
    const series = findStrengthSeries(timeline, /deadlift/i);
    return summarizeStrength(series);
  }, [timeline]);

  const latestMeasurementEntry = useMemo(
    () =>
      progressEntries.find((entry) => {
        const measurements = entry?.measurements;
        if (!measurements || typeof measurements !== "object") {
          return false;
        }

        return [
          measurements.chestCm,
          measurements.waistCm,
          measurements.armCm,
          measurements.thighCm,
        ].some((value) => typeof value === "number");
      }) || null,
    [progressEntries],
  );

  const weeklyEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    return progressEntries.filter(
      (entry) => entry?.date && new Date(entry.date) >= cutoff,
    );
  }, [progressEntries]);

  const monthlyEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    return progressEntries.filter(
      (entry) => entry?.date && new Date(entry.date) >= cutoff,
    );
  }, [progressEntries]);

  const weeklyAdherence = Math.min(
    100,
    Math.round((weeklyEntries.length / 7) * 100),
  );
  const weeklyCaloriesBurned = weeklyEntries.reduce(
    (sum, entry) => sum + toNumber(entry.caloriesBurned, 0),
    0,
  );

  const monthlyWeightChange = (() => {
    const withWeight = monthlyEntries
      .filter((entry) => typeof entry.weightKg === "number")
      .sort((left, right) => new Date(left.date) - new Date(right.date));

    if (withWeight.length < 2) {
      return null;
    }

    return Number(
      (withWeight[withWeight.length - 1].weightKg - withWeight[0].weightKg).toFixed(1),
    );
  })();

  const workoutsSummary = workoutsQuery.data?.summary || {
    completedCount: 0,
    totalCount: 0,
  };

  const timelineForPhase = timeline.filter((entry) => entry?.date);
  const phaseStartDate = timelineForPhase[0]?.date || null;
  const phaseCurrentDate = timelineForPhase[timelineForPhase.length - 1]?.date || null;

  const isBusy =
    analyticsQuery.isPending ||
    listQuery.isPending ||
    workoutsQuery.isPending ||
    dietQuery.isPending;

  const queryErrorMessage = [
    analyticsQuery.error,
    listQuery.error,
    workoutsQuery.error,
    dietQuery.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Unable to load progress insights."))
    .join(" ");

  const mutationErrorMessage = [
    createProgressMutation.error,
    deleteProgressMutation.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Action failed. Please try again."))
    .join(" ");

  function handleEntryDraftChange(field, value) {
    setEntryDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleLogout() {
    await logout();
  }

  async function handleCreateEntry(event) {
    event.preventDefault();
    setNotice("");

    const bench = parseOptionalNumber(entryDraft.benchOneRepMaxKg);
    const deadlift = parseOptionalNumber(entryDraft.deadliftOneRepMaxKg);

    const strengthMetrics = [
      typeof bench === "number"
        ? { exerciseName: "Bench Press", oneRepMaxKg: bench }
        : null,
      typeof deadlift === "number"
        ? { exerciseName: "Deadlift", oneRepMaxKg: deadlift }
        : null,
    ].filter(Boolean);

    const payload = {
      date: entryDraft.date ? new Date(entryDraft.date).toISOString() : undefined,
      weightKg: parseOptionalNumber(entryDraft.weightKg),
      bodyFatPercent: parseOptionalNumber(entryDraft.bodyFatPercent),
      caloriesBurned: parseOptionalNumber(entryDraft.caloriesBurned),
      measurements: {
        chestCm: parseOptionalNumber(entryDraft.chestCm),
        waistCm: parseOptionalNumber(entryDraft.waistCm),
        armCm: parseOptionalNumber(entryDraft.armCm),
        thighCm: parseOptionalNumber(entryDraft.thighCm),
      },
      strengthMetrics,
      notes: entryDraft.notes.trim() || undefined,
    };

    if (
      !payload.weightKg &&
      !payload.bodyFatPercent &&
      !payload.caloriesBurned &&
      !strengthMetrics.length &&
      !Object.values(payload.measurements).some((value) => typeof value === "number")
    ) {
      setNotice("Please add at least one measurable metric before saving.");
      return;
    }

    await createProgressMutation.mutateAsync(payload);
  }

  async function handleDeleteEntry(progressId) {
    if (!progressId) {
      return;
    }

    setNotice("");
    await deleteProgressMutation.mutateAsync(progressId);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f9f9fc] pb-24 text-[#2f3337]">
      <div className="pointer-events-none absolute left-[-8%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-[#0052ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12%] right-[-8%] h-[30rem] w-[30rem] rounded-full bg-[#ecccfb]/40 blur-3xl" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#aeb2b7]/20 bg-[#f9f9fc]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:pl-24">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-[#2f3337] transition-colors hover:bg-[#dfe3e8]"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              {authUser?.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt="User Profile"
                  className="h-10 w-10 rounded-full border-2 border-[#0052fe] object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#0052fe] bg-[#dee1f9] font-bold text-[#0052fe]">
                  {getInitials(authUser?.name)}
                </div>
              )}
              <span className="font-heading text-2xl font-black tracking-tighter text-[#2f3337]">
                KINETIC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full p-2 text-[#2f3337] hover:bg-[#dfe3e8]"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isAuthBusy}
              className="inline-flex items-center gap-2 rounded-full border border-[#d7dae0] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#2f3337] transition hover:bg-[#f2f3f7] disabled:opacity-60"
            >
              <LogOut size={14} />
              {isAuthBusy ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 py-8 pt-24 md:pl-24">
        <div className="mb-10">
          <h1 className="mb-2 font-heading text-4xl font-extrabold uppercase tracking-tighter text-[#2f3337] md:text-5xl">
            Performance Analytics
          </h1>
          <p className="font-body text-[#5b5f64]">
            Your biometric evolution and strength progression cycle.
          </p>
        </div>

        {isBusy ? (
          <div className="mb-6 rounded-xl border border-[#cfd3da] bg-white px-4 py-3 text-sm text-[#5b5f64]">
            Loading progress analytics...
          </div>
        ) : null}

        {queryErrorMessage ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {queryErrorMessage}
          </div>
        ) : null}

        {mutationErrorMessage ? (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mutationErrorMessage}
          </div>
        ) : null}

        {notice ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <article className="relative overflow-hidden rounded-xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.04)] md:col-span-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[#0048e2]">
                  Weight Momentum
                </span>
                <h2 className="text-2xl font-bold text-[#2f3337]">
                  {weightDeltaLabel}
                  <span className="ml-2 text-sm font-medium text-[#5b5f64]">
                    vs last {rangeKey === "7d" ? "week" : "month"}
                  </span>
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRangeKey("7d")}
                  className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-tighter ${
                    rangeKey === "7d"
                      ? "bg-[#0048e2] text-white"
                      : "bg-[#eceef2] text-[#2f3337]"
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setRangeKey("30d")}
                  className={`rounded-full px-4 py-1 text-xs font-bold uppercase tracking-tighter ${
                    rangeKey === "30d"
                      ? "bg-[#0048e2] text-white"
                      : "bg-[#eceef2] text-[#2f3337]"
                  }`}
                >
                  30D
                </button>
              </div>
            </div>

            <div className="flex h-64 items-end justify-between gap-2">
              {weightBars.map((bar) => (
                <div
                  key={bar.id}
                  className={`flex-1 rounded-t-lg transition-all ${
                    bar.isActive ? "bg-[#0052fe]" : "bg-[#0048e2]/10 hover:bg-[#0048e2]/30"
                  }`}
                  style={{ height: `${bar.height}%` }}
                  title={`${bar.label}: ${bar.value.toFixed(1)} kg`}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#aeb2b7]">
              <span>{weightBars[0]?.label || "Week 01"}</span>
              <span>{weightBars[Math.floor(weightBars.length / 3)]?.label || "Week 02"}</span>
              <span>{weightBars[Math.floor((weightBars.length * 2) / 3)]?.label || "Week 03"}</span>
              <span>{weightBars[weightBars.length - 1]?.label || "Today"}</span>
            </div>
          </article>

          <article className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-[#0052fe] p-8 text-white md:col-span-4">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] opacity-70">
                Metric Focus
              </span>
              <h3 className="mt-2 text-3xl font-black">
                {typeof latestBodyFat === "number" ? `${latestBodyFat.toFixed(1)}%` : "--"}
              </h3>
              <p className="mt-1 text-sm italic opacity-80">Estimated Body Fat</p>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Goal: {targetBodyFat}%
                </span>
                <span className="text-xs font-bold">{bodyFatGoalProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white"
                  style={{ width: `${bodyFatGoalProgress}%` }}
                />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-60">
                Calculated via bio-impedance AI
              </p>
            </div>
          </article>

          <article className="rounded-xl bg-[#f2f3f7] p-8 md:col-span-12 lg:col-span-6">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Dumbbell className="text-[#0048e2]" size={18} />
              Strength Progression
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-white p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                    Bench Press
                  </p>
                  <p className="text-xl font-black tracking-tighter text-[#2f3337]">
                    {typeof benchSummary.latest === "number"
                      ? `${benchSummary.latest.toFixed(1)} kg`
                      : "--"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#0048e2]">
                    {typeof benchSummary.deltaPercent === "number"
                      ? `${benchSummary.deltaPercent > 0 ? "+" : ""}${benchSummary.deltaPercent}%`
                      : "--"}
                  </span>
                  <p className="text-[10px] font-bold uppercase text-[#5b5f64]">
                    1RM Est.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                    Deadlift
                  </p>
                  <p className="text-xl font-black tracking-tighter text-[#2f3337]">
                    {typeof deadliftSummary.latest === "number"
                      ? `${deadliftSummary.latest.toFixed(1)} kg`
                      : "--"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#0048e2]">
                    {typeof deadliftSummary.deltaKg === "number"
                      ? `${deadliftSummary.deltaKg > 0 ? "+" : ""}${deadliftSummary.deltaKg} kg`
                      : "--"}
                  </span>
                  <p className="text-[10px] font-bold uppercase text-[#5b5f64]">
                    Personal Trend
                  </p>
                </div>
              </div>
            </div>
          </article>

          <div className="grid grid-cols-2 gap-4 md:col-span-12 lg:col-span-6">
            <article className="rounded-xl border border-white/20 bg-[#dfe3e8] p-6 shadow-sm">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#5b5f64]">
                Body Phase 01
              </p>
              <img
                src={DEFAULT_PHASE_START_IMAGE}
                alt="Progress phase start"
                className="mb-4 h-32 w-full rounded-lg object-cover grayscale"
              />
              <span className="text-xs font-bold text-[#2f3337]">
                {formatDate(phaseStartDate)}
              </span>
            </article>

            <article className="relative overflow-hidden rounded-xl border border-white/20 bg-[#dfe3e8] p-6 shadow-sm">
              <div className="absolute right-0 top-0 bg-[#0048e2] px-2 py-1 text-[8px] font-black uppercase text-white">
                Active
              </div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#5b5f64]">
                Body Phase 02
              </p>
              <img
                src={DEFAULT_PHASE_NOW_IMAGE}
                alt="Progress phase current"
                className="mb-4 h-32 w-full rounded-lg object-cover"
              />
              <span className="text-xs font-bold text-[#2f3337]">
                {formatDate(phaseCurrentDate)}
              </span>
            </article>
          </div>

          <article className="rounded-xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.04)] md:col-span-12">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-xl font-bold uppercase tracking-tighter">Biometric Log</h3>
              <button
                type="button"
                onClick={() => setShowHistory((previous) => !previous)}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#0048e2]"
              >
                {showHistory ? "Hide History" : "View History"}
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="border-l-2 border-[#0052fe] pl-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Chest
                </span>
                <p className="text-2xl font-black text-[#2f3337]">
                  {measurementValue(latestMeasurementEntry?.measurements?.chestCm)}
                </p>
              </div>

              <div className="border-l-2 border-[#dfe3e8] pl-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Waist
                </span>
                <p className="text-2xl font-black text-[#2f3337]">
                  {measurementValue(latestMeasurementEntry?.measurements?.waistCm)}
                </p>
              </div>

              <div className="border-l-2 border-[#0052fe] pl-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Arms (R)
                </span>
                <p className="text-2xl font-black text-[#2f3337]">
                  {measurementValue(latestMeasurementEntry?.measurements?.armCm)}
                </p>
              </div>

              <div className="border-l-2 border-[#dfe3e8] pl-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Thighs
                </span>
                <p className="text-2xl font-black text-[#2f3337]">
                  {measurementValue(latestMeasurementEntry?.measurements?.thighCm)}
                </p>
              </div>
            </div>

            {showHistory ? (
              <div className="mt-8 space-y-3">
                {progressEntries.length === 0 ? (
                  <div className="rounded-lg bg-[#f2f3f7] px-4 py-3 text-sm text-[#5b5f64]">
                    No progress entries recorded yet.
                  </div>
                ) : (
                  progressEntries.map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-center justify-between rounded-lg border border-[#e3e6ec] bg-[#f9f9fc] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#2f3337]">
                          {formatDate(entry.date)}
                        </p>
                        <p className="text-xs text-[#5b5f64]">
                          Weight: {typeof entry.weightKg === "number" ? `${entry.weightKg.toFixed(1)} kg` : "--"} | Body Fat: {typeof entry.bodyFatPercent === "number" ? `${entry.bodyFatPercent.toFixed(1)}%` : "--"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry._id)}
                        disabled={deleteProgressMutation.isPending}
                        className="rounded-full p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                        aria-label="Delete entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </article>

          <div className="flex flex-wrap gap-4 md:col-span-12">
            <article className="flex min-w-[300px] flex-1 items-center gap-6 rounded-xl bg-[#dee1f9] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0052fe]">
                <Calendar size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tighter text-[#4d5164]">
                  Weekly Intelligence
                </h4>
                <p className="text-xs text-[#4d5164] opacity-80">
                  {weeklyEntries.length} log(s), {weeklyCaloriesBurned} kcal tracked, {weeklyAdherence}% adherence.
                </p>
              </div>
              <button
                type="button"
                className="ml-auto rounded-lg bg-[#0052fe] px-4 py-2 text-xs font-black uppercase text-white"
                onClick={() => setShowHistory(true)}
              >
                Open
              </button>
            </article>

            <article className="flex min-w-[300px] flex-1 items-center gap-6 rounded-xl bg-[#ecccfb] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6f567d]">
                <Brain size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-tighter text-[#594268]">
                  Monthly Deep Dive
                </h4>
                <p className="text-xs text-[#594268] opacity-80">
                  {monthlyWeightChange === null
                    ? "Need more weight logs for monthly trend."
                    : `Weight trend ${monthlyWeightChange > 0 ? "+" : ""}${monthlyWeightChange} kg across 30 days.`}{" "}
                  {workoutsSummary.completedCount} workouts completed.
                </p>
              </div>
              <button
                type="button"
                className="ml-auto rounded-lg bg-[#6f567d] px-4 py-2 text-xs font-black uppercase text-white"
                onClick={() => setRangeKey("30d")}
              >
                Review
              </button>
            </article>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setShowEntryModal(true)}
        className="fixed bottom-24 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#0048e2] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_16px_32px_rgba(0,72,226,0.35)] transition hover:opacity-90"
      >
        <Plus size={14} />
        Add Entry
      </button>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-lg bg-[#ffffff]/80 px-4 pb-6 pt-2 shadow-[0px_-10px_30px_rgba(47,51,55,0.04)] backdrop-blur-xl md:hidden">
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <Home size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Home</span>
        </Link>
        <Link
          to="/progress"
          className="flex scale-105 flex-col items-center justify-center rounded-md bg-[#0048e2] px-4 py-2 text-white"
        >
          <Monitor size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Progress</span>
        </Link>
        <Link
          to="/workout"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <Dumbbell size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Plans</span>
        </Link>
        <Link
          to="/profile"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <User size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Profile</span>
        </Link>
      </nav>

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-24 flex-col items-center gap-10 bg-white py-8 shadow-xl md:flex">
        <div className="mb-4 font-heading text-xl font-black text-[#0048e2]">K</div>
        <nav className="flex flex-col gap-8">
          <Link to="/dashboard" className="text-[#2f3337] hover:text-[#0048e2]">
            <Home size={26} />
          </Link>
          <Link to="/progress" className="text-[#0048e2]">
            <LineChart size={26} />
          </Link>
          <Link to="/workout" className="text-[#2f3337] hover:text-[#0048e2]">
            <Dumbbell size={26} />
          </Link>
          <Link to="/profile" className="text-[#2f3337] hover:text-[#0048e2]">
            <User size={26} />
          </Link>
        </nav>
        <div className="mt-auto mb-2">
          <button
            type="button"
            onClick={() => setShowEntryModal(true)}
            className="text-[#2f3337] transition hover:text-[#0048e2]"
            aria-label="Open progress logger"
          >
            <Ruler size={24} />
          </button>
        </div>
      </aside>

      {showEntryModal ? (
        <ProgressEntryModal
          draft={entryDraft}
          isSaving={createProgressMutation.isPending}
          onChange={handleEntryDraftChange}
          onClose={() => setShowEntryModal(false)}
          onSubmit={handleCreateEntry}
        />
      ) : null}
    </main>
  );
}

export default ProgressPage;
