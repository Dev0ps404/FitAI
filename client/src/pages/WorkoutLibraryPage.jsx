import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Brain,
  Dumbbell,
  Home,
  Menu,
  Plus,
  Salad,
  Search,
  User,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workoutsApi } from "../services/fitnessApi";
import { getApiErrorMessage } from "../services/apiClient";

const MUSCLE_FILTERS = [
  "all",
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
];

const DIFFICULTY_FILTERS = ["all", "beginner", "intermediate", "advanced"];

const MUSCLE_THEME = {
  chest: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjWxjb9dvrrAy1Ol_YQoThiLSlKPGp2nUjsEFLp_4qmWFMV--4nyh15FnMAfhTRG9Yc0ftrtQ0EUc6XrCQuvDMy0dNKravls_UFKRSIAmwtOGNadAL-3HCJ15TvzHeCrUoXPqrndHgD3M0aJNMSfAyXkEv8lO7ex2JI5LFa4WZNg4yv2BttpQRyhs3PY15xfTlNWiMlHVxeXc9oBeVgtZoi-7L-iJqFYx8al4Ovlo7Ylf6Mp3VekErsQ0eTmdKLHYSB_bwiqHya40",
    tagClass: "bg-[#dee1f9] text-[#4d5164]",
  },
  back: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7BgrH3bb0FEo9DlZ2dey5dBpqE0xs2lLVDv7iccejX6PcCTTxuUmRwwUlfavB3PHmSoKAYU2nWS4Qh0McV_SRp3N1RSTKkfhX9n70EXEQcae13F4JuYoq98N_k51Qu7qoNJlTQz-zo6i_oKoWZLJNmGpiqw6vHvKvOFsht2yf8BW2DCrCHcakAO79euqL3IOYb1j36TOnK8SQ-RgcLNXFqQJLZHZle3B5O7ML7hs51Kz6Rgt_R40qDne00G7mlQDiqgksZXvWYdM",
    tagClass: "bg-[#ecccfb] text-[#594268]",
  },
  legs: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMsdr7kb3dD0BWXkuWtRP9S0OwcJFjLEi9nb8Q8W36PJOaDzpAVtGymoeqOQD6I_EbW3Q_E5zk0DW2R9nj3QZ80csdxnNW7F41VjGISpR7BvIz0cmblHYgZvYjA7mgcNB-MI7nA7ISdtgimj8w36h6Lh-mTN4oBSVxqADVeZHOLDw5u8jQS44e-_YUYDp0NNMbUWp9b9sqLxoejNhOlh0Kqi6kuAgiV4mJLj7td50SZsTC5dUaYINjJGyjHlAsDZKznCDHh0NbWoU",
    tagClass: "bg-[#dee1f9] text-[#4d5164]",
  },
  shoulders: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRVEGd6yNUZQ1RJ4R8ifpVobiK2THH8dJZ08E4okVz45ZD7_zUGFwDXcvuBWRxvR7HURRF5KeVJ0h65xULc9BlhIlZ8Z8WRGn6ieuljxJkYUOStQeB3rqSflLeDOJ3gpRrN3pwqFE8hY0xNzEX9ajcgZiIJLVr1d1OPxNpF0ZjYMWleD4_rzaf6egNw75iOhcSPoqmXlNR3WmlCEq6O2a1ioCvoY8TA_jx4Jop-zIXqTrKulABnsWdw3zpW96WKcAirDFj9Oj2UCY",
    tagClass: "bg-[#ecccfb] text-[#594268]",
  },
  arms: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBRVEGd6yNUZQ1RJ4R8ifpVobiK2THH8dJZ08E4okVz45ZD7_zUGFwDXcvuBWRxvR7HURRF5KeVJ0h65xULc9BlhIlZ8Z8WRGn6ieuljxJkYUOStQeB3rqSflLeDOJ3gpRrN3pwqFE8hY0xNzEX9ajcgZiIJLVr1d1OPxNpF0ZjYMWleD4_rzaf6egNw75iOhcSPoqmXlNR3WmlCEq6O2a1ioCvoY8TA_jx4Jop-zIXqTrKulABnsWdw3zpW96WKcAirDFj9Oj2UCY",
    tagClass: "bg-[#ecccfb] text-[#594268]",
  },
  core: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAEjvq1MMsQ9yAlLzwwT0olHxHNpjnb4vTmI_JGj3UFBTj7X6T3HV_TTScGBmreIAAQhzBWbBW0Yp19SL3FMID6Vfq7FSMjQfkPfko4wdldWVnI7RjDyMZEhn5jVGgEclX21LAPtxynOexn0Om04xS7C-djb7WU2vAamzCZwRBpizVMIYeGKmO9OHZ8wNFtoCt7bnVRO1hqVSJli-Fk73p7UXiZBOidB6iJ1WLdlTcmoEU4xkAyC59mTdsgeTnI0qsD-3ORT8Szhz8",
    tagClass: "bg-[#dee1f9] text-[#4d5164]",
  },
  all: {
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjWxjb9dvrrAy1Ol_YQoThiLSlKPGp2nUjsEFLp_4qmWFMV--4nyh15FnMAfhTRG9Yc0ftrtQ0EUc6XrCQuvDMy0dNKravls_UFKRSIAmwtOGNadAL-3HCJ15TvzHeCrUoXPqrndHgD3M0aJNMSfAyXkEv8lO7ex2JI5LFa4WZNg4yv2BttpQRyhs3PY15xfTlNWiMlHVxeXc9oBeVgtZoi-7L-iJqFYx8al4Ovlo7Ylf6Mp3VekErsQ0eTmdKLHYSB_bwiqHya40",
    tagClass: "bg-[#dee1f9] text-[#4d5164]",
  },
};

const SEED_LIBRARY = [
  {
    name: "Incline Bench Press",
    muscleGroup: "chest",
    difficulty: "intermediate",
    description: "Focuses on the clavicular head of the pectoralis major.",
  },
  {
    name: "Wide Grip Pull-Ups",
    muscleGroup: "back",
    difficulty: "advanced",
    description: "The ultimate compound movement for latissimus dorsi width.",
  },
  {
    name: "Barbell Back Squat",
    muscleGroup: "legs",
    difficulty: "advanced",
    description: "Builds massive lower body strength and core stability.",
  },
  {
    name: "Lateral Raises",
    muscleGroup: "shoulders",
    difficulty: "beginner",
    description: "Isolation movement for the medial deltoid head.",
  },
  {
    name: "Weighted Plank",
    muscleGroup: "core",
    difficulty: "intermediate",
    description: "Advanced isometric hold for core endurance.",
  },
  {
    name: "Leg Press",
    muscleGroup: "legs",
    difficulty: "intermediate",
    description: "Focused quad development without spinal loading.",
  },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKey(value = "") {
  return String(value).trim().toLowerCase();
}

function formatTitle(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "Unknown";
  }

  return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No history";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function inferMuscleGroup(name = "") {
  const value = normalizeKey(name);

  if (/(bench|push|pec|fly)/.test(value)) {
    return "chest";
  }

  if (/(pull|row|lat|deadlift|shrug)/.test(value)) {
    return "back";
  }

  if (/(squat|lunge|leg|calf|hamstring|quad)/.test(value)) {
    return "legs";
  }

  if (/(shoulder|raise|deltoid|overhead press|press)/.test(value)) {
    return "shoulders";
  }

  if (/(bicep|tricep|curl|extension|forearm)/.test(value)) {
    return "arms";
  }

  if (/(core|plank|crunch|sit-up|ab|hollow)/.test(value)) {
    return "core";
  }

  return "all";
}

function inferDifficulty({ avgWeightKg, avgReps, avgSets }) {
  if (avgWeightKg >= 70 || avgReps <= 6 || avgSets >= 5) {
    return "advanced";
  }

  if (avgWeightKg >= 30 || avgReps <= 10 || avgSets >= 4) {
    return "intermediate";
  }

  return "beginner";
}

function buildDescription(name, muscleGroup, stats) {
  const fallbackMap = {
    chest: "Build pressing strength and upper-body power with controlled reps.",
    back: "Develop posterior-chain strength and improve pulling mechanics.",
    legs: "Strengthen lower body output, balance, and movement stability.",
    shoulders: "Refine shoulder control and improve deltoid activation.",
    arms: "Increase arm hypertrophy and elbow flexion/extension strength.",
    core: "Improve bracing capacity and trunk endurance under load.",
    all: "A foundational movement to improve overall training capacity.",
  };

  if (stats.sampleNote) {
    return stats.sampleNote;
  }

  const text = fallbackMap[muscleGroup] || fallbackMap.all;
  return `${text} Primary movement: ${name}.`;
}

function createExerciseCardData(seedItem, dynamicStats) {
  const muscleGroup = dynamicStats?.muscleGroup || seedItem?.muscleGroup || "all";
  const theme = MUSCLE_THEME[muscleGroup] || MUSCLE_THEME.all;

  const avgSets = Math.max(1, Math.round(toNumber(dynamicStats?.avgSets, 3)));
  const avgReps = Math.max(1, Math.round(toNumber(dynamicStats?.avgReps, 10)));
  const avgWeightKg = Math.max(0, Math.round(toNumber(dynamicStats?.avgWeightKg, 0)));
  const avgDurationMin = Math.max(
    1,
    Math.round(toNumber(dynamicStats?.avgDurationMin, 12)),
  );
  const avgCalories = Math.max(1, Math.round(toNumber(dynamicStats?.avgCalories, 75)));

  return {
    id: normalizeKey(dynamicStats?.name || seedItem?.name),
    name: dynamicStats?.name || seedItem?.name || "Exercise",
    muscleGroup,
    difficulty:
      dynamicStats?.difficulty ||
      seedItem?.difficulty ||
      inferDifficulty({ avgWeightKg, avgReps, avgSets }),
    description:
      dynamicStats?.description ||
      seedItem?.description ||
      buildDescription(dynamicStats?.name || seedItem?.name, muscleGroup, {
        sampleNote: dynamicStats?.sampleNote,
      }),
    imageUrl: dynamicStats?.imageUrl || seedItem?.imageUrl || theme.imageUrl,
    tagClass: theme.tagClass,
    usageCount: Math.max(0, Math.round(toNumber(dynamicStats?.usageCount, 0))),
    avgSets,
    avgReps,
    avgWeightKg,
    avgDurationMin,
    avgCalories,
    lastPerformed: dynamicStats?.lastPerformed || null,
  };
}

function deriveExerciseLibrary(workouts = []) {
  const map = new Map();

  for (const workout of workouts) {
    const exercises = Array.isArray(workout?.exercises) ? workout.exercises : [];

    for (const exercise of exercises) {
      const name = String(exercise?.name || "").trim();
      if (!name) {
        continue;
      }

      const key = normalizeKey(name);
      const record =
        map.get(key) ||
        {
          name,
          muscleGroup: inferMuscleGroup(name),
          usageCount: 0,
          sumSets: 0,
          sumReps: 0,
          sumWeight: 0,
          sumDuration: 0,
          sumCalories: 0,
          sampleNote: "",
          lastPerformed: null,
        };

      record.usageCount += 1;
      record.sumSets += toNumber(exercise?.sets, 0);
      record.sumReps += toNumber(exercise?.reps, 0);
      record.sumWeight += toNumber(exercise?.weightKg, 0);
      record.sumDuration += toNumber(exercise?.durationMin, 0);
      record.sumCalories += toNumber(exercise?.caloriesBurned, 0);

      if (!record.sampleNote && typeof exercise?.notes === "string") {
        const note = exercise.notes.trim();
        if (note.length > 6) {
          record.sampleNote = note.slice(0, 180);
        }
      }

      const workoutDate = workout?.date ? new Date(workout.date) : null;
      if (workoutDate && !Number.isNaN(workoutDate.getTime())) {
        if (!record.lastPerformed || workoutDate > record.lastPerformed) {
          record.lastPerformed = workoutDate;
        }
      }

      map.set(key, record);
    }
  }

  const derivedCards = Array.from(map.values()).map((record) => {
    const usageCount = Math.max(1, record.usageCount);
    const avgSets = record.sumSets / usageCount;
    const avgReps = record.sumReps / usageCount;
    const avgWeightKg = record.sumWeight / usageCount;
    const avgDurationMin = record.sumDuration / usageCount;
    const avgCalories = record.sumCalories / usageCount;

    return createExerciseCardData(undefined, {
      name: record.name,
      muscleGroup: record.muscleGroup,
      difficulty: inferDifficulty({ avgWeightKg, avgReps, avgSets }),
      description: buildDescription(record.name, record.muscleGroup, {
        sampleNote: record.sampleNote,
      }),
      usageCount,
      avgSets,
      avgReps,
      avgWeightKg,
      avgDurationMin,
      avgCalories,
      sampleNote: record.sampleNote,
      lastPerformed: record.lastPerformed,
    });
  });

  const combined = new Map();

  for (const seedItem of SEED_LIBRARY) {
    const key = normalizeKey(seedItem.name);
    combined.set(key, createExerciseCardData(seedItem));
  }

  for (const derived of derivedCards) {
    const key = normalizeKey(derived.name);
    const seed = combined.get(key);

    if (!seed) {
      combined.set(key, derived);
      continue;
    }

    combined.set(key, {
      ...seed,
      ...derived,
      imageUrl: seed.imageUrl || derived.imageUrl,
      tagClass: seed.tagClass || derived.tagClass,
      description: derived.description || seed.description,
    });
  }

  return Array.from(combined.values()).sort((left, right) => {
    if (right.usageCount !== left.usageCount) {
      return right.usageCount - left.usageCount;
    }

    return left.name.localeCompare(right.name);
  });
}

function WorkoutLibraryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [notice, setNotice] = useState("");

  const workoutsQuery = useQuery({
    queryKey: ["workouts", "library", "source"],
    queryFn: () => workoutsApi.list({ page: 1, limit: 100 }),
  });

  const createWorkoutMutation = useMutation({
    mutationFn: (payload) => workoutsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const exercises = useMemo(() => {
    const workouts = workoutsQuery.data?.workouts || [];
    return deriveExerciseLibrary(workouts);
  }, [workoutsQuery.data]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = normalizeKey(searchTerm);

    return exercises.filter((exercise) => {
      if (selectedMuscle !== "all" && exercise.muscleGroup !== selectedMuscle) {
        return false;
      }

      if (
        selectedDifficulty !== "all" &&
        exercise.difficulty !== selectedDifficulty
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = `${exercise.name} ${exercise.description} ${exercise.muscleGroup} ${exercise.difficulty}`;
      return normalizeKey(haystack).includes(normalizedSearch);
    });
  }, [exercises, searchTerm, selectedMuscle, selectedDifficulty]);

  const errorMessage = [workoutsQuery.error, createWorkoutMutation.error]
    .filter(Boolean)
    .map((error) =>
      getApiErrorMessage(error, "Workout library is currently unavailable."),
    )
    .join(" ");

  async function handleAddToWorkout(exercise) {
    if (!exercise) {
      return;
    }

    setNotice("");

    await createWorkoutMutation.mutateAsync({
      name: `${exercise.name} Drill`,
      status: "planned",
      planSource: "custom",
      exercises: [
        {
          name: exercise.name,
          sets: exercise.avgSets,
          reps: exercise.avgReps,
          weightKg: exercise.avgWeightKg,
          durationMin: exercise.avgDurationMin,
          caloriesBurned: exercise.avgCalories,
          notes: exercise.description,
        },
      ],
    });

    setNotice(`${exercise.name} added to your workout plans.`);
  }

  async function handleFabAdd() {
    if (filteredExercises.length <= 0) {
      setNotice("No exercise is available for the current filter.");
      return;
    }

    await handleAddToWorkout(filteredExercises[0]);
  }

  return (
    <main className="bg-[#f9f9fc] font-body text-[#2f3337]">
      <header className="fixed top-0 z-50 w-full bg-[#f9f9fc]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-[#2f3337] transition-all duration-200 active:scale-95"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <span className="font-headline text-2xl font-extrabold tracking-tighter">
              FITAI
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden font-headline text-sm font-bold text-[#0052ff] md:block">
              Exercise Library
            </span>
            <button
              type="button"
              className="text-[#2f3337] transition-all duration-200 active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-32 pt-24">
        {errorMessage ? (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {notice ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        {workoutsQuery.isPending ? (
          <div className="mb-4 rounded-xl border border-[#aeb2b7]/30 bg-white px-4 py-3 text-sm text-[#5b5f64]">
            Loading exercise library...
          </div>
        ) : null}

        <section className="mb-10">
          <h1 className="mb-6 font-headline text-[3.5rem] font-extrabold leading-none tracking-tighter text-[#2f3337]">
            Master Your <span className="text-[#0048e2]">Form</span>.
          </h1>

          <div className="group relative max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#777b80]">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search 500+ exercises..."
              className="w-full rounded-xl border-none bg-white py-5 pl-12 pr-6 text-[#2f3337] placeholder-[#aeb2b7] shadow-[0px_20px_40px_rgba(47,51,55,0.06)] focus:ring-2 focus:ring-[#0048e2]/20"
            />
          </div>
        </section>

        <section className="mb-10 overflow-x-auto">
          <div className="flex min-w-max flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-[#777b80]">
                Muscles
              </span>
              {MUSCLE_FILTERS.map((muscle) => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => setSelectedMuscle(muscle)}
                  className={[
                    "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
                    selectedMuscle === muscle
                      ? "bg-[#0052fe] text-white"
                      : "bg-[#e6e8ed] text-[#2f3337] hover:bg-[#dfe3e8]",
                  ].join(" ")}
                >
                  {formatTitle(muscle)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-[#777b80]">
                Level
              </span>
              {DIFFICULTY_FILTERS.map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={[
                    "rounded-full px-5 py-2 text-xs font-bold uppercase transition-colors",
                    selectedDifficulty === difficulty
                      ? "bg-[#dee1f9] text-[#4d5164]"
                      : "bg-[#e6e8ed] text-[#2f3337] hover:bg-[#dfe3e8]",
                  ].join(" ")}
                >
                  {formatTitle(difficulty)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <article
                key={exercise.id}
                className="group overflow-hidden rounded-xl bg-white shadow-[0px_20px_40px_rgba(47,51,55,0.06)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className="flex items-center rounded-md bg-[#f9f9fc]/90 px-2 py-1">
                      <Dumbbell size={15} className="text-[#0048e2]" />
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-headline text-lg font-bold text-[#2f3337]">
                      {exercise.name}
                    </h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${exercise.tagClass}`}
                    >
                      {formatTitle(exercise.muscleGroup)}
                    </span>
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#777b80]">
                    {formatTitle(exercise.difficulty)}
                  </p>

                  <p className="mb-4 text-sm text-[#777b80]">{exercise.description}</p>

                  <button
                    type="button"
                    onClick={() => setSelectedExercise(exercise)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e6e8ed] py-3 font-bold text-[#0048e2] transition-all hover:bg-[#0048e2] hover:text-white"
                  >
                    View Technique
                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-[#aeb2b7]/35 bg-white px-4 py-6 text-sm text-[#5b5f64]">
              No exercises match this search and filter combination.
            </div>
          )}
        </section>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-3xl bg-[#f9f9fc]/90 px-4 pb-6 pt-3 shadow-[0px_-10px_40px_rgba(47,51,55,0.04)] backdrop-blur-2xl">
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all hover:text-[#0052ff]"
        >
          <Home size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            Home
          </span>
        </Link>

        <Link
          to="/workout"
          className="flex flex-col items-center justify-center rounded-2xl bg-[#0052ff]/10 px-4 py-2 text-[#0052ff]"
        >
          <Dumbbell size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            Workouts
          </span>
        </Link>

        <Link
          to="/diet"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all hover:text-[#0052ff]"
        >
          <Salad size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            Diet
          </span>
        </Link>

        <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
          <Brain size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            AI Trainer
          </span>
        </div>

        <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
          <User size={18} />
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">
            Profile
          </span>
        </div>
      </nav>

      <button
        type="button"
        onClick={handleFabAdd}
        disabled={createWorkoutMutation.isPending || filteredExercises.length <= 0}
        className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] text-white shadow-xl transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Add filtered exercise to workout"
      >
        <Plus size={24} />
      </button>

      {selectedExercise ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0e10]/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#777b80]">
                  Technique Overview
                </p>
                <h2 className="font-headline text-2xl font-extrabold text-[#2f3337]">
                  {selectedExercise.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="rounded-full bg-[#f2f3f7] p-2 text-[#5b5f64] transition-colors hover:bg-[#dfe3e8]"
                aria-label="Close technique"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-4 text-sm text-[#5b5f64]">{selectedExercise.description}</p>

            <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f2f3f7] p-3 text-xs text-[#2f3337]">
              <div>
                <span className="block text-[#777b80]">Muscle</span>
                <strong>{formatTitle(selectedExercise.muscleGroup)}</strong>
              </div>
              <div>
                <span className="block text-[#777b80]">Difficulty</span>
                <strong>{formatTitle(selectedExercise.difficulty)}</strong>
              </div>
              <div>
                <span className="block text-[#777b80]">Avg Prescription</span>
                <strong>
                  {selectedExercise.avgSets} sets x {selectedExercise.avgReps} reps
                </strong>
              </div>
              <div>
                <span className="block text-[#777b80]">Avg Load</span>
                <strong>{selectedExercise.avgWeightKg}kg</strong>
              </div>
              <div>
                <span className="block text-[#777b80]">Avg Duration</span>
                <strong>{selectedExercise.avgDurationMin} min</strong>
              </div>
              <div>
                <span className="block text-[#777b80]">Last Performed</span>
                <strong>{formatDate(selectedExercise.lastPerformed)}</strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                className="flex-1 rounded-xl border border-[#aeb2b7]/35 bg-white py-3 text-sm font-bold text-[#2f3337]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleAddToWorkout(selectedExercise);
                  setSelectedExercise(null);
                }}
                disabled={createWorkoutMutation.isPending}
                className="flex-1 rounded-xl bg-[#0048e2] py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add To Workout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default WorkoutLibraryPage;
