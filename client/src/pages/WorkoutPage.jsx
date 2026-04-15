import { useMemo, useState } from "react";
import {
  Bell,
  Brain,
  CheckCircle2,
  Circle,
  Dumbbell,
  Flame,
  Home,
  Menu,
  Play,
  Plus,
  Salad,
  Timer,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workoutsApi } from "../services/fitnessApi";
import { getApiErrorMessage } from "../services/apiClient";

const TAB_ITEMS = [
  { id: "today", label: "Today" },
  { id: "history", label: "History" },
  { id: "plans", label: "Plans" },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateKey(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(toNumber(totalMinutes, 0)));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours <= 0) {
    return `${rest} min`;
  }

  if (rest <= 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${rest}m`;
}

function formatCompactDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWeight(weightKg) {
  const weight = toNumber(weightKg, 0);
  if (weight <= 0) {
    return "Bodyweight";
  }

  return `${weight}kg`;
}

function formatVolume(value) {
  const volume = Math.round(Math.max(0, toNumber(value, 0)));
  return new Intl.NumberFormat("en-US").format(volume);
}

function getExerciseCategory(exerciseName = "") {
  const normalized = exerciseName.toLowerCase();

  if (normalized.includes("bench") || normalized.includes("push")) {
    return "Chest / Primary";
  }

  if (
    normalized.includes("pull") ||
    normalized.includes("row") ||
    normalized.includes("lat")
  ) {
    return "Back / Compound";
  }

  if (
    normalized.includes("raise") ||
    normalized.includes("shoulder") ||
    normalized.includes("press")
  ) {
    return "Shoulders / Isolated";
  }

  if (normalized.includes("squat") || normalized.includes("lunge")) {
    return "Legs / Strength";
  }

  return "General / Strength";
}

function toExercisePayload(exercise = {}) {
  return {
    name: exercise.name || "Exercise",
    sets: Math.max(0, Math.min(30, Math.round(toNumber(exercise.sets, 0)))),
    reps: Math.max(0, Math.min(100, Math.round(toNumber(exercise.reps, 0)))),
    weightKg: Math.max(0, Math.min(1000, toNumber(exercise.weightKg, 0))),
    durationMin: Math.max(0, Math.min(600, toNumber(exercise.durationMin, 0))),
    caloriesBurned: Math.max(
      0,
      Math.min(5000, toNumber(exercise.caloriesBurned, 0)),
    ),
    notes:
      typeof exercise.notes === "string" && exercise.notes.trim()
        ? exercise.notes.trim()
        : undefined,
  };
}

function computeWorkoutVolume(workout) {
  if (!workout || !Array.isArray(workout.exercises)) {
    return 0;
  }

  return workout.exercises.reduce((total, exercise) => {
    const sets = Math.max(0, toNumber(exercise.sets, 0));
    const reps = Math.max(0, toNumber(exercise.reps, 0));
    const weight = Math.max(0, toNumber(exercise.weightKg, 0));
    return total + sets * reps * weight;
  }, 0);
}

function createTemplateWorkoutPayload() {
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date());

  return {
    name: `Custom Session ${todayLabel}`,
    status: "planned",
    planSource: "custom",
    exercises: [
      {
        name: "Barbell Bench Press",
        sets: 4,
        reps: 8,
        weightKg: 60,
        durationMin: 14,
        caloriesBurned: 120,
      },
      {
        name: "Weighted Pull-Ups",
        sets: 3,
        reps: 8,
        weightKg: 8,
        durationMin: 12,
        caloriesBurned: 90,
      },
      {
        name: "Dumbbell Lateral Raises",
        sets: 3,
        reps: 15,
        weightKg: 10,
        durationMin: 10,
        caloriesBurned: 70,
      },
    ],
  };
}

function WorkoutPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [notice, setNotice] = useState("");

  const workoutsQuery = useQuery({
    queryKey: ["workouts", "list", "workout-page"],
    queryFn: () => workoutsApi.list({ page: 1, perPage: 30 }),
  });

  const statsQuery = useQuery({
    queryKey: ["workouts", "stats"],
    queryFn: workoutsApi.getStats,
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: ({ workoutId, payload }) =>
      workoutsApi.update(workoutId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (payload) => workoutsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const workouts = workoutsQuery.data?.workouts || [];
  const statsSummary = statsQuery.data?.summary || {
    totalDurationMin: 0,
    totalCalories: 0,
    totalCount: 0,
    completedCount: 0,
  };

  const todayKey = toDateKey(new Date());

  const todayWorkouts = useMemo(
    () => workouts.filter((workout) => toDateKey(workout?.date) === todayKey),
    [todayKey, workouts],
  );

  const completedWorkouts = useMemo(
    () => workouts.filter((workout) => workout?.status === "completed"),
    [workouts],
  );

  const plannedWorkouts = useMemo(
    () => workouts.filter((workout) => workout?.status === "planned"),
    [workouts],
  );

  const tabWorkouts = useMemo(() => {
    if (activeTab === "history") {
      return completedWorkouts;
    }

    if (activeTab === "plans") {
      return plannedWorkouts;
    }

    return todayWorkouts.length > 0 ? todayWorkouts : plannedWorkouts;
  }, [activeTab, completedWorkouts, plannedWorkouts, todayWorkouts]);

  const currentWorkout = useMemo(() => {
    if (tabWorkouts.length > 0) {
      return tabWorkouts[0];
    }

    return workouts[0] || null;
  }, [tabWorkouts, workouts]);

  const workoutExercises = currentWorkout?.exercises || [];
  const currentVolume = useMemo(
    () => computeWorkoutVolume(currentWorkout),
    [currentWorkout],
  );

  const pendingCount = Math.max(
    0,
    toNumber(statsSummary.totalCount, 0) -
      toNumber(statsSummary.completedCount, 0),
  );

  const volumeLabel = `${formatVolume(currentVolume)} kg`;

  const isBusy =
    workoutsQuery.isPending ||
    statsQuery.isPending ||
    updateWorkoutMutation.isPending ||
    createWorkoutMutation.isPending;

  const loadErrorMessage = [workoutsQuery.error, statsQuery.error]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Unable to load workouts."))
    .join(" ");

  const actionErrorMessage = [
    updateWorkoutMutation.error,
    createWorkoutMutation.error,
  ]
    .filter(Boolean)
    .map((error) =>
      getApiErrorMessage(error, "Workout action failed. Please try again."),
    )
    .join(" ");

  async function handleStartWorkout() {
    setNotice("");

    if (!currentWorkout?._id) {
      setNotice("Create a workout first to start a session.");
      return;
    }

    await updateWorkoutMutation.mutateAsync({
      workoutId: currentWorkout._id,
      payload: {
        status: "completed",
      },
    });

    setNotice("Workout marked as completed.");
  }

  async function handleCreateWorkout() {
    setNotice("");
    await createWorkoutMutation.mutateAsync(createTemplateWorkoutPayload());
    setNotice("Custom workout generated.");
  }

  async function handleLogExerciseRep(exerciseIndex) {
    if (!currentWorkout?._id || !Array.isArray(currentWorkout.exercises)) {
      return;
    }

    const nextExercises = currentWorkout.exercises.map((exercise, index) => {
      if (index !== exerciseIndex) {
        return toExercisePayload(exercise);
      }

      return toExercisePayload({
        ...exercise,
        reps: Math.max(0, toNumber(exercise.reps, 0) + 1),
        caloriesBurned: Math.max(0, toNumber(exercise.caloriesBurned, 0) + 6),
      });
    });

    setNotice("");
    await updateWorkoutMutation.mutateAsync({
      workoutId: currentWorkout._id,
      payload: {
        exercises: nextExercises,
      },
    });

    setNotice("Exercise log updated.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f9f9fc] pb-32 font-body text-[#2f3337]">
      <div className="pointer-events-none absolute -left-14 -top-14 h-56 w-56 rounded-full bg-[#0052fe]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-16 h-64 w-64 rounded-full bg-[#ecccfb]/40 blur-3xl" />

      <header className="fixed top-0 z-50 w-full bg-[#f9f9fc]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-[#dfe3e8]"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-headline text-2xl font-extrabold tracking-tighter">
              FITAI
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden gap-8 md:flex">
              <button
                type="button"
                className="text-sm font-bold text-[#0052ff]"
              >
                Workouts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="text-sm text-[#2f3337]/60 transition-colors hover:text-[#0052ff]"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("plans")}
                className="text-sm text-[#2f3337]/60 transition-colors hover:text-[#0052ff]"
              >
                Plans
              </button>
            </div>
            <button
              type="button"
              className="rounded-full p-2 transition-colors hover:bg-[#dfe3e8]"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 pb-20 pt-24">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#0048e2]">
              Current Session
            </span>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-[#2f3337]">
              {currentWorkout?.name || "Upper Body Power"}
            </h2>
            <p className="mt-2 text-[#5b5f64]">
              {currentWorkout
                ? `Session date: ${formatCompactDate(currentWorkout.date)}`
                : "Focused on explosive strength and metabolic conditioning."}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleStartWorkout}
              disabled={isBusy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] px-6 py-3 font-bold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play size={16} />
              {updateWorkoutMutation.isPending
                ? "Starting..."
                : "Start Workout"}
            </button>
            <button
              type="button"
              onClick={handleCreateWorkout}
              disabled={isBusy}
              className="rounded-xl bg-[#e6e8ed] px-4 py-3 text-[#0048e2] transition-colors hover:bg-[#dfe3e8] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Create workout"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="mb-8 flex gap-8 border-b-0">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "relative pb-2 text-lg font-semibold transition-colors",
                activeTab === tab.id
                  ? "font-bold text-[#2f3337] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-[#0048e2]"
                  : "text-[#5b5f64] hover:text-[#2f3337]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loadErrorMessage ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadErrorMessage}
          </p>
        ) : null}

        {actionErrorMessage ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionErrorMessage}
          </p>
        ) : null}

        {notice ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        {workoutsQuery.isPending ? (
          <div className="mb-6 rounded-xl border border-[#aeb2b7]/30 bg-white px-4 py-3 text-sm text-[#5b5f64]">
            Loading workout plans...
          </div>
        ) : null}

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-full bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.04)] md:col-span-1">
            <h3 className="mb-6 font-headline text-lg font-bold">
              Stats Summary
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#0052fe]/10 p-2 text-[#0048e2]">
                    <Timer size={18} />
                  </span>
                  <span className="text-sm text-[#5b5f64]">Duration</span>
                </div>
                <span className="font-headline font-bold">
                  {formatDuration(statsSummary.totalDurationMin)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#ecccfb]/25 p-2 text-[#6f567d]">
                    <Flame size={18} />
                  </span>
                  <span className="text-sm text-[#5b5f64]">Est. Burn</span>
                </div>
                <span className="font-headline font-bold">
                  {formatVolume(statsSummary.totalCalories)} kcal
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-[#dee1f9]/60 p-2 text-[#4e5266]">
                    <Dumbbell size={18} />
                  </span>
                  <span className="text-sm text-[#5b5f64]">Volume</span>
                </div>
                <span className="font-headline font-bold">{volumeLabel}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            {workoutExercises.length > 0 ? (
              workoutExercises.map((exercise, index) => {
                const badgeClass =
                  index % 3 === 0
                    ? "bg-[#dee1f9] text-[#4d5164]"
                    : index % 3 === 1
                      ? "bg-[#ecccfb] text-[#594268]"
                      : "bg-[#dfe3e8] text-[#2f3337]";

                const setPreviewCount = Math.max(
                  1,
                  Math.min(4, Math.round(toNumber(exercise.sets, 1))),
                );

                return (
                  <article
                    key={`${exercise.name}-${index}`}
                    className="rounded-full bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#f2f3f7] text-[#5b5f64]">
                          <Dumbbell size={22} />
                        </div>
                        <div>
                          <h4 className="font-headline text-base font-bold">
                            {exercise.name || "Exercise"}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                          >
                            {getExerciseCategory(exercise.name)}
                          </span>
                        </div>
                      </div>

                      {currentWorkout?.status === "completed" ? (
                        <CheckCircle2 className="text-[#0048e2]" size={22} />
                      ) : (
                        <Circle className="text-[#aeb2b7]" size={22} />
                      )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {Array.from({ length: setPreviewCount }).map(
                        (_, setIndex) => (
                          <div
                            key={`${exercise.name}-set-${setIndex}`}
                            className={`min-w-[88px] flex-shrink-0 rounded-xl px-4 py-2 text-center ${
                              setIndex === setPreviewCount - 1
                                ? "border-2 border-[#0048e2]/20 bg-[#0052fe]/10"
                                : "bg-[#f2f3f7]"
                            }`}
                          >
                            <span
                              className={`block text-[10px] font-bold uppercase ${
                                setIndex === setPreviewCount - 1
                                  ? "text-[#0048e2]"
                                  : "text-[#5b5f64]"
                              }`}
                            >
                              Set {setIndex + 1}
                            </span>
                            <span
                              className={`font-headline text-sm font-extrabold ${
                                setIndex === setPreviewCount - 1
                                  ? "text-[#0048e2]"
                                  : "text-[#2f3337]"
                              }`}
                            >
                              {formatWeight(exercise.weightKg)} x{" "}
                              {Math.max(0, toNumber(exercise.reps, 0))}
                            </span>
                          </div>
                        ),
                      )}

                      <button
                        type="button"
                        onClick={() => handleLogExerciseRep(index)}
                        disabled={updateWorkoutMutation.isPending}
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#e6e8ed] text-[#5b5f64] transition-colors hover:text-[#0048e2] disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Log ${exercise.name}`}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="rounded-full bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]">
                <p className="text-sm text-[#5b5f64]">
                  No exercises found for this tab. Create a custom workout to
                  get started.
                </p>
              </article>
            )}
          </div>
        </div>

        <section className="mb-20">
          <div className="relative overflow-hidden rounded-full bg-[#0052fe] p-8 text-white">
            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="font-headline text-2xl font-extrabold leading-tight">
                  Need something more specific?
                </h3>
                <p className="mt-1 max-w-md text-sm text-[#edeeff]">
                  Our AI trainer can generate a custom workout tailored to your
                  equipment and goals in seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateWorkout}
                disabled={isBusy}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-8 py-4 font-bold text-[#0048e2] shadow-xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Brain size={18} />
                {createWorkoutMutation.isPending
                  ? "Generating..."
                  : "Create Custom Workout"}
              </button>
            </div>
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-black/10 blur-3xl" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#aeb2b7]/25 bg-white p-4 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]">
          <h3 className="font-headline text-base font-bold">Quick Snapshot</h3>
          <p className="mt-2 text-sm text-[#5b5f64]">
            Active tab has {tabWorkouts.length} workout plan(s) and{" "}
            {pendingCount} pending in total.
          </p>
        </section>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-3xl bg-[#f9f9fc]/90 shadow-[0px_-10px_40px_rgba(47,51,55,0.04)] backdrop-blur-2xl">
        <div className="flex items-center justify-around px-4 pb-6 pt-3">
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all hover:text-[#0052ff]"
          >
            <Home size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Home
            </span>
          </Link>
          <div className="flex cursor-default flex-col items-center justify-center rounded-2xl bg-[#0052ff]/10 px-4 py-2 text-[#0052ff]">
            <Dumbbell size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Workouts
            </span>
          </div>
          <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
            <Salad size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Diet
            </span>
          </div>
          <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
            <Brain size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              AI Trainer
            </span>
          </div>
          <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
            <User size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Profile
            </span>
          </div>
        </div>
      </nav>
    </main>
  );
}

export default WorkoutPage;
