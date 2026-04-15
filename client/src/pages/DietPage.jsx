import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Brain,
  Dumbbell,
  Home,
  Menu,
  Moon,
  Plus,
  Salad,
  Sunrise,
  Sun,
  Trash2,
  User,
  Utensils,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../services/fitnessApi";
import { getApiErrorMessage } from "../services/apiClient";

const DAILY_TARGETS = {
  calories: 2200,
  proteinG: 160,
  carbsG: 220,
  fatsG: 65,
  waterMl: 2500,
  waterStepMl: 250,
};

const WATER_SLOTS = 8;
const WATER_STORAGE_KEY = "fitai:water-slots";
const CALORIE_RING_CIRCUMFERENCE = 251.2;

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_CONFIG = {
  breakfast: {
    label: "Breakfast",
    recommendation: "Recommended: 450 - 550 kcal",
    icon: Sunrise,
    iconWrapClass: "bg-[#dee1f9]/30 text-[#4d5164]",
  },
  lunch: {
    label: "Lunch",
    recommendation: "Recommended: 600 - 750 kcal",
    icon: Sun,
    iconWrapClass: "bg-[#0052fe]/10 text-[#0048e2]",
  },
  dinner: {
    label: "Dinner",
    recommendation: "Recommended: 500 - 650 kcal",
    icon: Moon,
    iconWrapClass: "bg-[#ecccfb]/30 text-[#594268]",
  },
  snack: {
    label: "Snack",
    recommendation: "Recommended: 150 - 250 kcal",
    icon: Utensils,
    iconWrapClass: "bg-[#f2f3f7] text-[#2f3337]",
  },
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(toNumber(value, 0)));
}

function formatDateLong(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startToday - startDate) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function titleMeal(mealType) {
  const value = String(mealType || "").toLowerCase();
  return MEAL_CONFIG[value]?.label || "Meal";
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function computeTotalsFromFoods(foods = []) {
  return foods.reduce(
    (totals, food) => ({
      calories: totals.calories + toNumber(food?.calories, 0),
      proteinG: totals.proteinG + toNumber(food?.proteinG, 0),
      carbsG: totals.carbsG + toNumber(food?.carbsG, 0),
      fatsG: totals.fatsG + toNumber(food?.fatsG, 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
  );
}

function getDefaultFoodTemplate(mealType) {
  if (mealType === "breakfast") {
    return {
      name: "3 Scrambled Eggs with Avocado",
      quantity: 1,
      unit: "plate",
      calories: 380,
      proteinG: 24,
      carbsG: 12,
      fatsG: 20,
    };
  }

  if (mealType === "lunch") {
    return {
      name: "Chicken Quinoa Bowl",
      quantity: 1,
      unit: "bowl",
      calories: 540,
      proteinG: 42,
      carbsG: 48,
      fatsG: 16,
    };
  }

  if (mealType === "dinner") {
    return {
      name: "Grilled Salmon and Quinoa",
      quantity: 1,
      unit: "plate",
      calories: 420,
      proteinG: 38,
      carbsG: 30,
      fatsG: 14,
    };
  }

  return {
    name: "Protein Bar",
    quantity: 1,
    unit: "bar",
    calories: 190,
    proteinG: 18,
    carbsG: 20,
    fatsG: 7,
  };
}

function getAiPreview(planText) {
  if (!planText || typeof planText !== "string") {
    return {
      summary:
        "Based on your activity, generate a personalized meal strategy for optimal recovery.",
      featuredTitle: "Grilled Salmon and Quinoa",
      featuredMeta: "420 KCAL - 38G PRO",
    };
  }

  const normalizedLines = planText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);

  const summary = normalizedLines[0] || planText.trim();
  const featuredTitle = normalizedLines[1] || "Personalized Meal Plan Ready";

  const kcalMatch = planText.match(/(\d{2,4})\s*kcal/i);
  const proteinMatch = planText.match(/(\d{1,3})\s*g\s*(?:protein|pro)/i);

  const metaParts = [];

  if (kcalMatch) {
    metaParts.push(`${kcalMatch[1]} KCAL`);
  }

  if (proteinMatch) {
    metaParts.push(`${proteinMatch[1]}G PRO`);
  }

  return {
    summary,
    featuredTitle,
    featuredMeta: metaParts.join(" - ") || "AI GENERATED",
  };
}

function DietPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [aiObjective, setAiObjective] = useState(
    "High-protein dinner for muscle recovery",
  );
  const [waterSlots, setWaterSlots] = useState(() => {
    if (typeof window === "undefined") {
      return 3;
    }

    const raw = window.localStorage.getItem(WATER_STORAGE_KEY);
    const parsed = Number.parseInt(raw || "", 10);

    if (!Number.isFinite(parsed)) {
      return 3;
    }

    return Math.max(0, Math.min(WATER_SLOTS, parsed));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WATER_STORAGE_KEY, String(waterSlots));
    }
  }, [waterSlots]);

  const dietLogsQuery = useQuery({
    queryKey: ["diet", "logs", "diet-page"],
    queryFn: () => dietApi.list({ page: 1, perPage: 120 }),
  });

  const summaryQuery = useQuery({
    queryKey: ["diet", "summary"],
    queryFn: dietApi.getSummary,
  });

  const createDietLogMutation = useMutation({
    mutationFn: (payload) => dietApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const updateDietLogMutation = useMutation({
    mutationFn: ({ dietLogId, payload }) => dietApi.update(dietLogId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const removeDietLogMutation = useMutation({
    mutationFn: (dietLogId) => dietApi.remove(dietLogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const aiPlanMutation = useMutation({
    mutationFn: (objective) => dietApi.requestAiPlan({ objective }),
  });

  const dietLogs = useMemo(() => {
    const logs = dietLogsQuery.data?.dietLogs || [];
    return [...logs].sort(
      (left, right) => new Date(right.date) - new Date(left.date),
    );
  }, [dietLogsQuery.data]);

  const todayKey = toDateKey(new Date());

  const todayLogs = useMemo(
    () => dietLogs.filter((log) => toDateKey(log?.date) === todayKey),
    [dietLogs, todayKey],
  );

  const mealBuckets = useMemo(() => {
    const base = Object.fromEntries(
      MEAL_ORDER.map((mealType) => [mealType, { mealType, logs: [], foods: [] }]),
    );

    for (const log of todayLogs) {
      const mealType = String(log?.mealType || "").toLowerCase();
      if (!base[mealType]) {
        continue;
      }

      base[mealType].logs.push(log);

      const foods = Array.isArray(log?.foods) ? log.foods : [];
      foods.forEach((food, foodIndex) => {
        base[mealType].foods.push({
          logId: log._id,
          foodIndex,
          ...food,
        });
      });
    }

    return base;
  }, [todayLogs]);

  const todayTotals = useMemo(
    () =>
      todayLogs.reduce(
        (total, log) => {
          const fallbackTotals = computeTotalsFromFoods(log?.foods || []);
          const logTotals = log?.totals || fallbackTotals;

          return {
            calories: total.calories + toNumber(logTotals.calories, 0),
            proteinG: total.proteinG + toNumber(logTotals.proteinG, 0),
            carbsG: total.carbsG + toNumber(logTotals.carbsG, 0),
            fatsG: total.fatsG + toNumber(logTotals.fatsG, 0),
          };
        },
        { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
      ),
    [todayLogs],
  );

  const summaryTotals = summaryQuery.data?.summary || {
    totalCalories: 0,
    totalProteinG: 0,
    totalCarbsG: 0,
    totalFatsG: 0,
    logCount: 0,
  };

  const caloriesLeft = Math.max(0, DAILY_TARGETS.calories - todayTotals.calories);
  const calorieGoalPercent = clampPercent(
    (todayTotals.calories / DAILY_TARGETS.calories) * 100,
  );
  const ringDashOffset =
    CALORIE_RING_CIRCUMFERENCE * (1 - calorieGoalPercent / 100);

  const macroRows = [
    {
      key: "protein",
      label: "Protein",
      consumed: todayTotals.proteinG,
      target: DAILY_TARGETS.proteinG,
      badge: "High",
      barClass: "bg-[#0048e2]",
      badgeClass: "bg-[#0052fe]/10 text-[#0048e2]",
    },
    {
      key: "carbs",
      label: "Carbohydrates",
      consumed: todayTotals.carbsG,
      target: DAILY_TARGETS.carbsG,
      badge: "",
      barClass: "bg-[#4e5266]",
      badgeClass: "",
    },
    {
      key: "fats",
      label: "Fats",
      consumed: todayTotals.fatsG,
      target: DAILY_TARGETS.fatsG,
      badge: "",
      barClass: "bg-[#6f567d]",
      badgeClass: "",
    },
  ];

  const historyEntries = useMemo(() => {
    return dietLogs.slice(0, 8).map((log) => {
      const foods = Array.isArray(log?.foods) ? log.foods : [];
      const firstFood = foods[0];
      const fallbackTotals = computeTotalsFromFoods(foods);
      const calories = toNumber(log?.totals?.calories, fallbackTotals.calories);

      return {
        id: log?._id || `${log?.date || "log"}-${log?.mealType || "meal"}`,
        title: firstFood?.name || `${titleMeal(log?.mealType)} log`,
        subtitle: `${formatRelativeDate(log?.date)} - ${titleMeal(log?.mealType)}`,
        calories,
      };
    });
  }, [dietLogs]);

  const aiPlanText = aiPlanMutation.data?.plan || "";
  const aiPreview = useMemo(() => getAiPreview(aiPlanText), [aiPlanText]);

  const isBusy =
    dietLogsQuery.isPending ||
    summaryQuery.isPending ||
    createDietLogMutation.isPending ||
    updateDietLogMutation.isPending ||
    removeDietLogMutation.isPending;

  const loadErrorMessage = [dietLogsQuery.error, summaryQuery.error]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Unable to load nutrition data."))
    .join(" ");

  const actionErrorMessage = [
    createDietLogMutation.error,
    updateDietLogMutation.error,
    removeDietLogMutation.error,
    aiPlanMutation.error,
  ]
    .filter(Boolean)
    .map((error) =>
      getApiErrorMessage(error, "Nutrition action failed. Please retry."),
    )
    .join(" ");

  async function handleAddFood(mealType) {
    setNotice("");
    const bucket = mealBuckets[mealType];
    const existingLog = bucket?.logs?.[0];
    const defaultFood = getDefaultFoodTemplate(mealType);

    if (!existingLog?._id) {
      await createDietLogMutation.mutateAsync({
        date: new Date().toISOString(),
        mealType,
        foods: [defaultFood],
      });
      setNotice(`${titleMeal(mealType)} item added.`);
      return;
    }

    const existingFoods = Array.isArray(existingLog.foods) ? existingLog.foods : [];

    await updateDietLogMutation.mutateAsync({
      dietLogId: existingLog._id,
      payload: {
        foods: [...existingFoods, defaultFood],
      },
    });

    setNotice(`${titleMeal(mealType)} item added.`);
  }

  async function handleDeleteFood(mealType, logId, foodIndex) {
    setNotice("");

    const mealLog = mealBuckets[mealType]?.logs?.find((log) => log._id === logId);
    if (!mealLog) {
      return;
    }

    const currentFoods = Array.isArray(mealLog.foods) ? mealLog.foods : [];
    const nextFoods = currentFoods.filter((_, index) => index !== foodIndex);

    if (nextFoods.length === 0) {
      await removeDietLogMutation.mutateAsync(logId);
      setNotice(`${titleMeal(mealType)} entry removed.`);
      return;
    }

    await updateDietLogMutation.mutateAsync({
      dietLogId: logId,
      payload: {
        foods: nextFoods,
      },
    });

    setNotice("Meal item removed.");
  }

  function handleWaterAdd() {
    setWaterSlots((current) => Math.min(WATER_SLOTS, current + 1));
  }

  function handleWaterSlotClick(slotIndex) {
    setWaterSlots(slotIndex + 1);
  }

  async function handleGenerateAiPlan() {
    setNotice("");
    const objective = aiObjective.trim();

    if (objective.length < 5) {
      setNotice("Objective should be at least 5 characters.");
      return;
    }

    await aiPlanMutation.mutateAsync(objective);
    setNotice("New AI meal plan generated.");
  }

  const hydratedLiters = (waterSlots * DAILY_TARGETS.waterStepMl) / 1000;
  const goalLiters = DAILY_TARGETS.waterMl / 1000;

  return (
    <main className="min-h-screen bg-[#f9f9fc] pb-32 font-body text-[#2f3337]">
      <header className="fixed top-0 z-50 w-full bg-[#f9f9fc]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="cursor-pointer text-[#2f3337] transition-all duration-200 active:scale-95"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-headline text-2xl font-extrabold tracking-tighter text-[#2f3337]">
              FITAI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer text-[#2f3337] transition-all duration-200 active:scale-95"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-32 pt-24">
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

        {isBusy ? (
          <div className="mb-4 rounded-xl border border-[#aeb2b7]/35 bg-white px-4 py-3 text-sm text-[#5b5f64]">
            Refreshing nutrition metrics...
          </div>
        ) : null}

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="relative overflow-hidden rounded-xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] md:col-span-1">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-headline text-lg font-bold">Daily Calories</h3>
              <span className="text-sm font-bold text-[#0048e2]">
                {Math.round(calorieGoalPercent)}% Goal
              </span>
            </div>

            <div className="relative flex items-center justify-center py-4">
              <svg className="-rotate-90" width="180" height="180" viewBox="0 0 100 100">
                <circle
                  className="text-[#f2f3f7]"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  className="text-[#0048e2]"
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={CALORIE_RING_CIRCUMFERENCE}
                  strokeDashoffset={ringDashOffset}
                />
              </svg>

              <div className="absolute mt-6 flex flex-col items-center justify-center">
                <span className="font-headline text-3xl font-extrabold leading-none">
                  {formatNumber(caloriesLeft)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#777b80]">
                  kcal left
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] md:col-span-2">
            <h3 className="mb-8 font-headline text-lg font-bold">Macro Distribution</h3>
            <div className="space-y-8">
              {macroRows.map((macro) => {
                const progress = clampPercent((macro.consumed / macro.target) * 100);

                return (
                  <div key={macro.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        {macro.label}
                        {macro.badge ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${macro.badgeClass}`}
                          >
                            {macro.badge}
                          </span>
                        ) : null}
                      </span>
                      <span>
                        {Math.round(macro.consumed)}g / {macro.target}g
                      </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#f2f3f7]">
                      <div
                        className={`h-full rounded-full ${macro.barClass}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-8">
            <div className="mb-2 flex items-end justify-between">
              <h2 className="font-headline text-2xl font-extrabold tracking-tight">
                Today's Meals
              </h2>
              <p className="text-sm font-semibold text-[#777b80]">
                {formatDateLong(new Date())}
              </p>
            </div>

            {MEAL_ORDER.map((mealType) => {
              const mealConfig = MEAL_CONFIG[mealType];
              const mealIconClass = mealConfig.iconWrapClass;
              const MealIcon = mealConfig.icon;
              const mealFoods = mealBuckets[mealType]?.foods || [];

              return (
                <article
                  key={mealType}
                  className="overflow-hidden rounded-xl bg-white"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${mealIconClass}`}
                        >
                          <MealIcon size={18} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold">{mealConfig.label}</h4>
                          <p className="text-xs font-medium text-[#777b80]">
                            {mealConfig.recommendation}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddFood(mealType)}
                        disabled={
                          createDietLogMutation.isPending ||
                          updateDietLogMutation.isPending
                        }
                        className="flex items-center gap-1 rounded-xl bg-[#0048e2] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#0048e2]/20 transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus size={15} />
                        Add
                      </button>
                    </div>

                    {mealFoods.length > 0 ? (
                      <div className="space-y-4">
                        {mealFoods.map((food) => (
                          <div
                            key={`${food.logId}-${food.foodIndex}`}
                            className="flex items-center justify-between rounded-xl bg-[#f2f3f7] p-3"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dfe3e8] text-[#5b5f64]">
                                <Utensils size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold">{food.name}</p>
                                <p className="text-xs text-[#777b80]">
                                  {formatNumber(food.calories)} kcal - {Math.round(toNumber(food.proteinG, 0))}g Protein
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteFood(mealType, food.logId, food.foodIndex)
                              }
                              disabled={
                                removeDietLogMutation.isPending ||
                                updateDietLogMutation.isPending
                              }
                              className="text-[#777b80] transition-colors hover:text-[#a8364b] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Delete ${food.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#aeb2b7]/30 py-8">
                        <p className="text-sm font-medium text-[#777b80]">No items logged yet</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="space-y-8 lg:col-span-4">
            <article className="rounded-xl bg-gradient-to-br from-white to-[#dee1f9]/20 p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.06)]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-headline text-lg font-bold">Water Intake</h3>
                <span className="font-bold text-[#0048e2]">
                  {hydratedLiters.toFixed(1)}L / {goalLiters.toFixed(1)}L
                </span>
              </div>

              <div className="mb-6 grid grid-cols-4 gap-3">
                {Array.from({ length: WATER_SLOTS }).map((_, slotIndex) => {
                  const isFilled = slotIndex < waterSlots;

                  return (
                    <button
                      key={`water-slot-${slotIndex}`}
                      type="button"
                      onClick={() => handleWaterSlotClick(slotIndex)}
                      className={[
                        "aspect-square rounded-xl transition-colors",
                        "flex items-center justify-center",
                        isFilled
                          ? "bg-[#0048e2] text-white shadow-md"
                          : "bg-[#f2f3f7] text-[#0048e2] hover:bg-[#0048e2]/10",
                      ].join(" ")}
                      aria-label={`Set water to ${slotIndex + 1} glasses`}
                    >
                      <Waves size={18} />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleWaterAdd}
                disabled={waterSlots >= WATER_SLOTS}
                className="w-full rounded-xl border border-[#0048e2]/20 bg-white py-3 text-sm font-bold text-[#0048e2] transition-all hover:bg-[#0048e2]/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                + Add {DAILY_TARGETS.waterStepMl}ml
              </button>
            </article>

            <article className="relative overflow-hidden rounded-xl bg-[#0c0e10] p-6 text-white">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#0048e2]/20 blur-3xl" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <Brain size={18} className="text-[#0052fe]" />
                  <h3 className="font-headline text-lg font-bold">AI Suggestion</h3>
                </div>

                <label htmlFor="ai-objective" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">
                  Objective
                </label>
                <input
                  id="ai-objective"
                  value={aiObjective}
                  onChange={(event) => setAiObjective(event.target.value)}
                  className="mb-4 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#0052fe] focus:outline-none"
                  placeholder="Ex: lean muscle dinner ideas"
                />

                <p className="mb-6 text-sm leading-relaxed text-white/70">
                  {aiPreview.summary}
                </p>

                <div className="mb-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#1f2937]">
                      <Salad size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{aiPreview.featuredTitle}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                        {aiPreview.featuredMeta}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiPlan}
                  disabled={aiPlanMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0048e2] py-3 text-sm font-bold text-white shadow-xl shadow-[#0048e2]/30 transition duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiPlanMutation.isPending ? "Generating..." : "View Plan Details"}
                </button>
              </div>
            </article>
          </aside>
        </div>

        <section className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-xl font-extrabold">Recent Food History</h3>
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-bold text-[#0048e2]"
            >
              See All
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-[0px_20px_40px_rgba(47,51,55,0.06)]">
            {historyEntries.length > 0 ? (
              historyEntries.slice(0, 6).map((entry, entryIndex) => (
                <div
                  key={entry.id}
                  className={[
                    "flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-[#f2f3f7]",
                    entryIndex > 0 ? "border-t border-[#eceef2]" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dee1f9]/20 text-[#4d5164]">
                      <Utensils size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{entry.title}</p>
                      <p className="text-xs text-[#777b80]">{entry.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold">{formatNumber(entry.calories)} kcal</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-[#777b80]">
                No history available yet. Add your first meal to begin tracking.
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-[#aeb2b7]/25 bg-white px-4 py-3 text-xs text-[#5b5f64]">
            30-day summary: {formatNumber(summaryTotals.totalCalories)} kcal, {Math.round(toNumber(summaryTotals.totalProteinG, 0))}g protein, {Math.round(toNumber(summaryTotals.totalCarbsG, 0))}g carbs, {Math.round(toNumber(summaryTotals.totalFatsG, 0))}g fats across {Math.round(toNumber(summaryTotals.logCount, 0))} logs.
          </div>
        </section>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 w-full rounded-t-3xl bg-[#f9f9fc]/90 px-4 pb-6 pt-3 shadow-[0px_-10px_40px_rgba(47,51,55,0.04)] backdrop-blur-2xl">
        <div className="flex items-center justify-around">
          <Link
            to="/dashboard"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all hover:text-[#0052ff]"
          >
            <Home size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Home</span>
          </Link>

          <Link
            to="/workout"
            className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50 transition-all hover:text-[#0052ff]"
          >
            <Dumbbell size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Workouts</span>
          </Link>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-[#0052ff]/10 px-4 py-2 text-[#0052ff]">
            <Salad size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Diet</span>
          </div>

          <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
            <Brain size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">AI Trainer</span>
          </div>

          <div className="flex cursor-default flex-col items-center justify-center px-4 py-2 text-[#2f3337]/50">
            <User size={18} className="mb-1" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
          </div>
        </div>
      </nav>
    </main>
  );
}

export default DietPage;
