import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Bot,
  Dumbbell,
  Flame,
  History,
  LifeBuoy,
  LogOut,
  Monitor,
  Plus,
  Salad,
  SendHorizontal,
  Settings,
  Target,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { aiApi, dietApi, progressApi, workoutsApi } from "../services/fitnessApi";

const PROMPT_CHIPS = [
  "How's my sleep?",
  "Adjust my macros",
  "Injury prevention",
  "Lower body power progression",
];

const SIDEBAR_ITEMS = [
  {
    id: "history",
    label: "History",
    icon: History,
    helper: "Select any previous AI session from below.",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    helper: "Settings module is coming soon.",
  },
  {
    id: "community",
    label: "Community",
    icon: Users,
    helper: "Community board will be available soon.",
  },
  {
    id: "support",
    label: "Support",
    icon: LifeBuoy,
    helper: "Support desk opens from your account menu.",
  },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(toNumber(value, 0)));
}

function formatDateTime(value) {
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
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatShortDate(value) {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
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

function getFirstName(name) {
  if (!name || typeof name !== "string") {
    return "Athlete";
  }

  return name.trim().split(" ")[0] || "Athlete";
}

function capitalizeText(value) {
  if (!value || typeof value !== "string") {
    return "User";
  }

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function buildFatigueBars(timeline = []) {
  const sortedTimeline = [...timeline]
    .filter((item) => item?._id)
    .sort((left, right) => new Date(left._id) - new Date(right._id))
    .slice(-6);

  if (!sortedTimeline.length) {
    return [40, 60, 55, 80, 70, 90].map((height, index) => ({
      id: `fatigue-fallback-${index}`,
      height,
      label: `S${index + 1}`,
      isActive: index === 5,
    }));
  }

  const maxDuration = Math.max(
    ...sortedTimeline.map((item) => toNumber(item.durationMin, 0)),
    1,
  );

  return sortedTimeline.map((item, index) => {
    const normalized = toNumber(item.durationMin, 0) / maxDuration;

    return {
      id: item._id || `fatigue-${index}`,
      height: Math.max(35, Math.round(normalized * 90)),
      label: formatShortDate(item._id),
      isActive: index === sortedTimeline.length - 1,
    };
  });
}

function buildRecommendationCards(recommendations = [], context = {}) {
  const mappedCards = recommendations
    .filter((item) => typeof item?.message === "string" && item.message.trim())
    .map((item, index) => {
      const recommendationType = String(item.type || "").toLowerCase();

      if (recommendationType.includes("workout")) {
        return {
          id: item.type || `recommendation-${index}`,
          title: "Workout Advice",
          tone: "workout",
          message: item.message,
        };
      }

      if (recommendationType.includes("progress")) {
        return {
          id: item.type || `recommendation-${index}`,
          title: "Progress Signal",
          tone: "progress",
          message: item.message,
        };
      }

      return {
        id: item.type || `recommendation-${index}`,
        title: "Coach Insight",
        tone: "progress",
        message: item.message,
      };
    });

  const safeCompletedCount = toNumber(context.completedCount, 0);
  const safeDailyCalories = toNumber(context.dailyCalories, 0);
  const safeTargetCalories = Math.max(1, toNumber(context.targetCalories, 2600));
  const safeWeightChange = toNumber(context.weightChange, 0);

  if (!mappedCards.some((card) => card.tone === "workout")) {
    mappedCards.unshift({
      id: "fallback-workout",
      title: "Workout Advice",
      tone: "workout",
      message:
        safeCompletedCount < 3
          ? "Your recent workout volume is low. Start with 3 focused sessions this week and track recovery quality daily."
          : "Power output is trending stable. Add 1 explosive primer movement before your main lift block.",
    });
  }

  if (!mappedCards.some((card) => card.tone === "diet")) {
    const calorieGap = safeTargetCalories - safeDailyCalories;

    mappedCards.push({
      id: "fallback-diet",
      title: "Diet Suggestion",
      tone: "diet",
      message:
        calorieGap > 150
          ? `Increase intake by about ${Math.round(calorieGap)} kcal to stay on target and protect recovery.`
          : safeWeightChange <= -0.6
            ? "Weight trend is dropping quickly. Increase carbs around training to preserve performance."
            : "Current nutrition trend is balanced. Prioritize protein timing around your next session.",
    });
  }

  return mappedCards.slice(0, 2);
}

function AiPage() {
  const { authUser, isAuthBusy, logout } = useAuth();
  const queryClient = useQueryClient();
  const chatViewportRef = useRef(null);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [isNewSession, setIsNewSession] = useState(false);
  const [composer, setComposer] = useState("");
  const [outgoingMessage, setOutgoingMessage] = useState("");
  const [notice, setNotice] = useState("");

  const [sessionsQuery, recommendationsQuery, workoutsQuery, progressQuery, dietQuery] =
    useQueries({
      queries: [
        {
          queryKey: ["ai", "sessions"],
          queryFn: aiApi.listSessions,
        },
        {
          queryKey: ["ai", "recommendations"],
          queryFn: aiApi.getRecommendations,
        },
        {
          queryKey: ["workouts", "stats", "ai-page"],
          queryFn: workoutsApi.getStats,
        },
        {
          queryKey: ["progress", "analytics", "ai-page"],
          queryFn: progressApi.getAnalytics,
        },
        {
          queryKey: ["diet", "summary", "ai-page"],
          queryFn: dietApi.getSummary,
        },
      ],
    });

  const sessions = useMemo(
    () => sessionsQuery.data?.sessions || [],
    [sessionsQuery.data?.sessions],
  );

  const activeSessionId = useMemo(() => {
    if (isNewSession) {
      return null;
    }

    if (
      selectedSessionId &&
      sessions.some((session) => session._id === selectedSessionId)
    ) {
      return selectedSessionId;
    }

    return sessions[0]?._id || null;
  }, [isNewSession, selectedSessionId, sessions]);

  const activeSessionQuery = useQuery({
    queryKey: ["ai", "session", activeSessionId],
    queryFn: () => aiApi.getSession(activeSessionId),
    enabled: typeof activeSessionId === "string" && activeSessionId.length > 0,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, sessionId }) => {
      const sentMessageResult = await aiApi.sendMessage({
        message,
        ...(sessionId ? { sessionId } : {}),
      });

      const resolvedSessionId = sentMessageResult?.sessionId || sessionId || null;
      let sessionResult = null;

      if (resolvedSessionId) {
        sessionResult = await aiApi.getSession(resolvedSessionId);
      }

      return {
        resolvedSessionId,
        sessionResult,
      };
    },
    onSuccess: ({ resolvedSessionId, sessionResult }) => {
      if (resolvedSessionId) {
        setSelectedSessionId(resolvedSessionId);
        setIsNewSession(false);

        if (sessionResult) {
          queryClient.setQueryData(
            ["ai", "session", resolvedSessionId],
            sessionResult,
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["ai", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "recommendations"] });
    },
    onError: (error, variables) => {
      setComposer(variables.message);
      setNotice(getApiErrorMessage(error, "Unable to send message right now."));
    },
    onSettled: () => {
      setOutgoingMessage("");
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId) => aiApi.deleteSession(sessionId),
    onSuccess: (_, deletedSessionId) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "sessions"] });
      queryClient.removeQueries({ queryKey: ["ai", "session", deletedSessionId] });
      setSelectedSessionId((currentSessionId) =>
        currentSessionId === deletedSessionId ? "" : currentSessionId,
      );
      setNotice("Session deleted.");
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Unable to delete this session."));
    },
  });

  const workoutSummary = workoutsQuery.data?.summary || {
    completedCount: 0,
    totalCount: 0,
    totalDurationMin: 0,
  };
  const workoutTimeline = useMemo(
    () => workoutsQuery.data?.timeline || [],
    [workoutsQuery.data?.timeline],
  );

  const progressSummary = progressQuery.data?.summary || {
    weightChangeKg: null,
  };
  const progressTimeline = useMemo(
    () => progressQuery.data?.timeline || [],
    [progressQuery.data?.timeline],
  );

  const nutritionSummary = dietQuery.data?.summary || {
    totalCalories: 0,
    logCount: 0,
  };

  const activeSession = activeSessionQuery.data?.session || null;
  const activeSessionMeta = sessions.find((session) => session._id === activeSessionId);

  const messages = useMemo(
    () =>
      (activeSession?.messages || []).filter(
        (message) => message?.role === "assistant" || message?.role === "user",
      ),
    [activeSession],
  );

  const fatigueBars = useMemo(() => buildFatigueBars(workoutTimeline), [workoutTimeline]);

  const fatigueAverage = useMemo(() => {
    if (!fatigueBars.length) {
      return 0;
    }

    return Math.round(
      fatigueBars.reduce((sum, item) => sum + toNumber(item.height, 0), 0) /
        fatigueBars.length,
    );
  }, [fatigueBars]);

  const fatigueStatus =
    fatigueAverage >= 75
      ? {
          label: "High",
          className: "text-rose-600",
        }
      : fatigueAverage >= 58
        ? {
            label: "Moderate",
            className: "text-[#a8364b]",
          }
        : {
            label: "Low",
            className: "text-emerald-600",
          };

  const recoveryScore = clamp(Math.round(104 - fatigueAverage * 0.55), 52, 97);

  const targetCalories = useMemo(() => {
    const currentWeight = toNumber(authUser?.currentWeightKg, 70);
    const fitnessLevel = String(authUser?.fitnessLevel || "").toLowerCase();

    let multiplier = 36;

    if (fitnessLevel === "advanced") {
      multiplier = 40;
    } else if (fitnessLevel === "beginner") {
      multiplier = 33;
    }

    return Math.round(currentWeight * multiplier);
  }, [authUser?.currentWeightKg, authUser?.fitnessLevel]);

  const averageDailyCalories =
    toNumber(nutritionSummary.logCount, 0) > 0
      ? Math.round(
          toNumber(nutritionSummary.totalCalories, 0) /
            toNumber(nutritionSummary.logCount, 1),
        )
      : Math.round(targetCalories * 0.65);

  const dailyTargetProgress = clamp(
    Math.round((averageDailyCalories / Math.max(1, targetCalories)) * 100),
    0,
    100,
  );

  const recommendationCards = useMemo(
    () =>
      buildRecommendationCards(recommendationsQuery.data?.recommendations, {
        completedCount: workoutSummary.completedCount,
        dailyCalories: averageDailyCalories,
        targetCalories,
        weightChange: progressSummary.weightChangeKg,
      }),
    [
      recommendationsQuery.data?.recommendations,
      workoutSummary.completedCount,
      averageDailyCalories,
      targetCalories,
      progressSummary.weightChangeKg,
    ],
  );

  const sessionVolume = useMemo(() => {
    const referenceTimestamp = workoutTimeline.reduce((latest, item) => {
      const timestamp = new Date(item?._id).getTime();

      if (!Number.isFinite(timestamp)) {
        return latest;
      }

      return Math.max(latest, timestamp);
    }, 0);

    if (!referenceTimestamp) {
      return {
        volumeKg: 0,
        changePercent: null,
      };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const recentWindow = referenceTimestamp - 14 * dayMs;
    const previousWindow = referenceTimestamp - 28 * dayMs;

    let recentDuration = 0;
    let previousDuration = 0;

    for (const item of workoutTimeline) {
      const timestamp = new Date(item?._id).getTime();

      if (!Number.isFinite(timestamp)) {
        continue;
      }

      const duration = toNumber(item?.durationMin, 0);

      if (timestamp >= recentWindow) {
        recentDuration += duration;
      } else if (timestamp >= previousWindow) {
        previousDuration += duration;
      }
    }

    const strengthLoad = progressTimeline.reduce((sum, entry) => {
      const metrics = Array.isArray(entry?.strengthMetrics)
        ? entry.strengthMetrics
        : [];

      const aggregate = metrics.reduce(
        (metricSum, metric) => metricSum + toNumber(metric?.oneRepMaxKg, 0),
        0,
      );

      return sum + aggregate;
    }, 0);

    const volumeKg = Math.round(Math.max(recentDuration * 75, strengthLoad * 12));
    const changePercent =
      previousDuration > 0
        ? Math.round(((recentDuration - previousDuration) / previousDuration) * 100)
        : null;

    return {
      volumeKg,
      changePercent,
    };
  }, [progressTimeline, workoutTimeline]);

  const levelNumber = clamp(
    Math.round(toNumber(workoutSummary.completedCount, 0) + sessions.length * 2 + 12),
    1,
    99,
  );

  const isLoading =
    sessionsQuery.isPending ||
    recommendationsQuery.isPending ||
    workoutsQuery.isPending ||
    progressQuery.isPending ||
    dietQuery.isPending;

  const queryErrorMessage = [
    sessionsQuery.error,
    recommendationsQuery.error,
    workoutsQuery.error,
    progressQuery.error,
    dietQuery.error,
    activeSessionQuery.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Unable to load AI coach data."))
    .join(" ");

  useEffect(() => {
    const viewport = chatViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [activeSessionId, messages.length, outgoingMessage, sendMessageMutation.isPending]);

  async function handleLogout() {
    await logout();
  }

  function handleSelectSidebarItem(helperText) {
    setNotice(helperText || "");
  }

  function handleStartNewChat() {
    setIsNewSession(true);
    setSelectedSessionId("");
    setComposer("");
    setNotice("Started a new AI session.");
  }

  function handleSelectSession(sessionId) {
    setSelectedSessionId(sessionId);
    setIsNewSession(false);
    setNotice("");
  }

  async function handleDeleteSession(sessionId) {
    if (!sessionId || deleteSessionMutation.isPending) {
      return;
    }

    const confirmed = window.confirm("Delete this AI session permanently?");

    if (!confirmed) {
      return;
    }

    await deleteSessionMutation.mutateAsync(sessionId);
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    const message = composer.trim();

    if (message.length < 2) {
      setNotice("Please type at least 2 characters.");
      return;
    }

    setNotice("");
    setComposer("");
    setOutgoingMessage(message);

    await sendMessageMutation.mutateAsync({
      message,
      sessionId:
        typeof activeSessionId === "string" && activeSessionId.length > 0
          ? activeSessionId
          : undefined,
    });
  }

  const activeSessionTitle =
    activeSession?.title || activeSessionMeta?.title || "New AI Session";
  const activeSessionUpdatedAt =
    activeSession?.updatedAt || activeSessionMeta?.updatedAt || null;

  const firstName = getFirstName(authUser?.name);
  const fitnessLevelLabel = capitalizeText(authUser?.fitnessLevel || "User");

  return (
    <main className="min-h-screen bg-[#f9f9fc] text-[#2f3337]">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#aeb2b7]/30 bg-[#f9f9fc]/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e6e8ed]">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-[#0052fe]">
                {getInitials(authUser?.name)}
              </div>
            )}
          </div>
          <span className="font-heading text-2xl font-black uppercase tracking-tighter">
            KINETIC
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full p-2 text-[#0048e2] transition hover:bg-[#e6e8ed]"
            aria-label="Notifications"
          >
            <Bell size={18} />
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
      </header>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto bg-[#f2f3f7] p-8 lg:flex">
          <div className="mb-2">
            <h3 className="font-heading text-xl font-black text-[#0048e2]">
              {authUser?.name || "FitAI User"}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
              {fitnessLevelLabel} Member • Level {levelNumber}
            </p>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSidebarItem(item.helper)}
                  className="flex w-full items-center gap-4 rounded-xl p-3 text-left font-heading text-lg font-bold transition hover:translate-x-1 hover:bg-[#e6e8ed]"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5b5f64]">
              Session History
            </p>
            <button
              type="button"
              onClick={handleStartNewChat}
              className="inline-flex items-center gap-1 rounded-full bg-[#0048e2] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
            >
              <Plus size={12} />
              New
            </button>
          </div>

          <div className="max-h-[17rem] space-y-2 overflow-y-auto pr-1">
            {sessions.length ? (
              sessions.map((session) => {
                const isActive = session._id === activeSessionId;

                return (
                  <div
                    key={session._id}
                    className={`flex items-center gap-2 rounded-xl border px-2 py-2 ${
                      isActive
                        ? "border-[#0052fe]/40 bg-[#dee1f9]"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session._id)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0052fe] text-white">
                        <Bot size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2f3337]">
                          {session.title || "AI Session"}
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#777b80]">
                          {formatDateTime(session.updatedAt)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(session._id)}
                      className="rounded-md p-2 text-[#777b80] transition hover:bg-[#f5f6fa] hover:text-rose-600"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl bg-white px-4 py-3 text-sm text-[#5b5f64]">
                Your chat history appears here once you start messaging.
              </p>
            )}
          </div>

          <div className="mt-auto rounded-xl bg-white p-6 shadow-sm">
            <p className="mb-2 text-sm font-bold text-[#0048e2]">DAILY TARGET</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e8ed]">
              <div
                className="h-full bg-[#0048e2]"
                style={{ width: `${dailyTargetProgress}%` }}
              />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
              {formatNumber(averageDailyCalories)} / {formatNumber(targetCalories)} kcal
            </p>
          </div>
        </aside>

        <section className="relative flex flex-1 flex-col bg-[#f9f9fc]">
          <div className="border-b border-[#aeb2b7]/20 px-6 py-4">
            <div className="mb-1 flex items-center gap-2">
              <Bot size={18} className="text-[#0048e2]" />
              <h1 className="font-heading text-xl font-extrabold tracking-tight">
                Kinetic AI Trainer
              </h1>
            </div>
            <p className="text-sm text-[#5b5f64]">
              {activeSessionTitle} • Updated {formatDateTime(activeSessionUpdatedAt)}
            </p>

            <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              <button
                type="button"
                onClick={handleStartNewChat}
                className="whitespace-nowrap rounded-full border border-[#d7dae0] bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest"
              >
                New Chat
              </button>
              {sessions.map((session) => (
                <button
                  key={session._id}
                  type="button"
                  onClick={() => handleSelectSession(session._id)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                    session._id === activeSessionId
                      ? "border-[#0052fe] bg-[#0052fe] text-white"
                      : "border-[#d7dae0] bg-white text-[#2f3337]"
                  }`}
                >
                  {session.title || "AI Session"}
                </button>
              ))}
            </div>
          </div>

          <div ref={chatViewportRef} className="flex-1 space-y-8 overflow-y-auto p-6 pb-44 md:pb-40">
            {isLoading ? (
              <div className="rounded-xl border border-[#d7dae0] bg-white px-4 py-3 text-sm text-[#5b5f64]">
                Loading AI trainer context...
              </div>
            ) : null}

            {queryErrorMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {queryErrorMessage}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-xl border border-[#d7dae0] bg-white px-4 py-3 text-sm text-[#5b5f64]">
                {notice}
              </div>
            ) : null}

            {!messages.length && !outgoingMessage ? (
              <div className="space-y-4">
                <div className="flex max-w-3xl gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0048e2] text-white">
                    <Bot size={18} />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white p-6 shadow-[0px_10px_30px_rgba(47,51,55,0.04)]">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2f3337]">
                      {`Welcome back, ${firstName}. Your recovery score is ${recoveryScore}% today. Based on your recent load and progress trend, we can focus on lower body power progression or nutrition distribution for this session.`}
                    </p>
                  </div>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
                  {recommendationCards.map((card) => {
                    const isDiet = card.tone === "diet";
                    const cardClassName = isDiet ? "bg-[#ecccfb]" : "bg-[#dee1f9]";
                    const titleClassName = isDiet ? "text-[#594268]" : "text-[#4d5164]";
                    const Icon = isDiet ? Salad : Dumbbell;

                    return (
                      <article
                        key={card.id}
                        className={`rounded-xl p-5 ${cardClassName}`}
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <Icon size={16} className="text-[#0048e2]" />
                          <span
                            className={`text-sm font-bold uppercase tracking-wider ${titleClassName}`}
                          >
                            {card.title}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[#5b5f64]">
                          {card.message}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";

              if (isAssistant) {
                const shouldRenderCards = index === 0 && recommendationCards.length > 0;

                return (
                  <div key={`${message.createdAt || index}-assistant-${index}`} className="max-w-3xl space-y-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0048e2] text-white">
                        <Bot size={18} />
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-white p-6 shadow-[0px_10px_30px_rgba(47,51,55,0.04)]">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2f3337]">
                          {message.content}
                        </p>
                      </div>
                    </div>

                    {shouldRenderCards ? (
                      <div className="grid grid-cols-1 gap-4 pl-14 md:grid-cols-2">
                        {recommendationCards.map((card) => {
                          const isDiet = card.tone === "diet";
                          const cardClassName = isDiet ? "bg-[#ecccfb]" : "bg-[#dee1f9]";
                          const titleClassName = isDiet ? "text-[#594268]" : "text-[#4d5164]";
                          const Icon = isDiet ? Salad : Dumbbell;

                          return (
                            <article
                              key={`${card.id}-message-card`}
                              className={`rounded-xl p-5 ${cardClassName}`}
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <Icon size={16} className="text-[#0048e2]" />
                                <span
                                  className={`text-sm font-bold uppercase tracking-wider ${titleClassName}`}
                                >
                                  {card.title}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-[#5b5f64]">
                                {card.message}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <div
                  key={`${message.createdAt || index}-user-${index}`}
                  className="ml-auto flex max-w-3xl flex-row-reverse gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6e8ed] text-sm font-bold text-[#0052fe]">
                    {getInitials(authUser?.name)}
                  </div>
                  <div className="rounded-2xl rounded-tr-none bg-[#0048e2] p-6 text-white shadow-lg">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {outgoingMessage ? (
              <div className="ml-auto flex max-w-3xl flex-row-reverse gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6e8ed] text-sm font-bold text-[#0052fe]">
                  {getInitials(authUser?.name)}
                </div>
                <div className="rounded-2xl rounded-tr-none bg-[#0048e2] p-6 text-white shadow-lg">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {outgoingMessage}
                  </p>
                </div>
              </div>
            ) : null}

            {sendMessageMutation.isPending ? (
              <div className="flex max-w-3xl gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0048e2] text-white">
                  <Bot size={18} />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white p-6 shadow-[0px_10px_30px_rgba(47,51,55,0.04)]">
                  <p className="text-sm font-medium text-[#5b5f64]">Analyzing your request...</p>
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#f9f9fc] via-[#f9f9fc] to-transparent"
          >
            <div className="mx-auto w-full max-w-4xl space-y-4 px-6 pb-24 pt-4 md:pb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {PROMPT_CHIPS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setComposer(prompt)}
                    className="whitespace-nowrap rounded-full border border-[#aeb2b7]/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5b5f64] transition hover:bg-[#eceef2]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  placeholder="Ask your Kinetic Coach..."
                  className="w-full rounded-2xl border-none bg-white px-6 py-5 pr-16 text-sm font-medium text-[#2f3337] shadow-xl outline-none ring-0 placeholder:text-[#777b80]"
                />
                <button
                  type="submit"
                  disabled={sendMessageMutation.isPending || composer.trim().length < 2}
                  className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0048e2] text-white shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
            </div>
          </form>
        </section>

        <aside className="hidden w-80 flex-col gap-6 overflow-y-auto bg-[#f2f3f7] p-8 xl:flex">
          <h3 className="font-heading text-lg font-bold uppercase tracking-tight">
            Kinetic Analytics
          </h3>

          <article className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                Fatigue Index
              </p>
              <span className={`text-xs font-bold ${fatigueStatus.className}`}>
                {fatigueStatus.label}
              </span>
            </div>

            <div className="flex h-32 items-end gap-1 px-1">
              {fatigueBars.map((bar) => (
                <div
                  key={bar.id}
                  className={`w-full rounded-t-sm ${
                    bar.isActive ? "bg-[#0048e2]" : "bg-[#0052fe]/60"
                  }`}
                  style={{ height: `${bar.height}%` }}
                  title={`${bar.label}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs">
              <p className="font-semibold text-[#5b5f64]">Readiness Score</p>
              <p className="font-bold text-[#0048e2]">{recoveryScore}%</p>
            </div>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecccfb] text-[#6f567d]">
                <Flame size={16} />
              </div>
              <span className="font-heading text-sm font-bold">Session Volume</span>
            </div>
            <p className="text-3xl font-heading font-extrabold tracking-tighter text-[#2f3337]">
              {formatNumber(sessionVolume.volumeKg)}
              <span className="ml-1 text-sm font-medium tracking-normal text-[#777b80]">
                kg
              </span>
            </p>
            <p className="mt-1 text-xs font-bold text-[#0048e2]">
              {sessionVolume.changePercent === null
                ? "No prior baseline"
                : `${sessionVolume.changePercent > 0 ? "+" : ""}${sessionVolume.changePercent}% vs previous 2 weeks`}
            </p>
          </article>
        </aside>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-white/85 px-4 pb-6 pt-2 shadow-[0px_-10px_30px_rgba(47,51,55,0.04)] backdrop-blur-xl md:hidden">
        <Link
          to="/ai"
          className="flex scale-105 flex-col items-center justify-center rounded-md bg-[#0048e2] px-4 py-2 text-white"
        >
          <Bot size={18} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Trainer
          </span>
        </Link>

        <Link
          to="/progress"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337] transition hover:bg-[#f2f3f7]"
        >
          <Monitor size={18} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Progress
          </span>
        </Link>

        <Link
          to="/diet"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337] transition hover:bg-[#f2f3f7]"
        >
          <Target size={18} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">Plans</span>
        </Link>

        <Link
          to="/profile"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337] transition hover:bg-[#f2f3f7]"
        >
          <User size={18} />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Profile
          </span>
        </Link>
      </nav>
    </main>
  );
}

export default AiPage;