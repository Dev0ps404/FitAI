import { useMemo, useState } from "react";
import {
  Bell,
  Bot,
  Dumbbell,
  Flame,
  Home,
  LogOut,
  Menu,
  Pencil,
  Salad,
  Settings,
  Shield,
  Target,
  User,
  Watch,
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
import authApi from "../services/authApi";
import { dietApi, progressApi, workoutsApi } from "../services/fitnessApi";

const DEFAULT_PROFILE = {
  name: "Athlete",
  email: "-",
  avatarUrl: "",
  fitnessLevel: "beginner",
  gender: "prefer_not_to_say",
  age: null,
  heightCm: null,
  currentWeightKg: null,
  goalWeightKg: null,
  badgePoints: 0,
  streakDays: 0,
  createdAt: null,
};

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
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

function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "FA";
  }

  const initials = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return initials.slice(0, 2) || "FA";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(toNumber(value, 0)));
}

function formatOneDecimal(value, suffix = "") {
  if (typeof value !== "number") {
    return "--";
  }

  return `${value.toFixed(1)}${suffix}`;
}

function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatTimeAgo(timestamp) {
  if (!timestamp) {
    return "just now";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function labelFromFitnessLevel(level) {
  const normalized = String(level || "beginner").toLowerCase();

  if (normalized === "advanced") {
    return "High Intensity";
  }

  if (normalized === "intermediate") {
    return "Strength Builder";
  }

  return "Foundation";
}

function labelFromGender(gender) {
  if (gender === "male") {
    return "Male";
  }

  if (gender === "female") {
    return "Female";
  }

  if (gender === "other") {
    return "Other";
  }

  return "Not set";
}

function getGoalProfile(user) {
  const currentWeight = toNumber(user?.currentWeightKg, 0);
  const goalWeight = toNumber(user?.goalWeightKg, 0);

  if (currentWeight > 0 && goalWeight > 0) {
    const difference = goalWeight - currentWeight;

    if (difference <= -1) {
      return {
        badge: "Weight Loss",
        title: "Body Recomposition",
        description: `Targeting ${Math.abs(difference).toFixed(1)} kg reduction with high adherence planning.`,
      };
    }

    if (difference >= 1) {
      return {
        badge: "Weight Gain",
        title: "Lean Mass Progression",
        description: `Targeting ${difference.toFixed(1)} kg gain with strength-focused nutrition.`,
      };
    }
  }

  if (user?.fitnessLevel === "advanced") {
    return {
      badge: "Performance",
      title: "Athletic Performance",
      description: "Focused on power output, speed, and advanced conditioning.",
    };
  }

  return {
    badge: "Wellness",
    title: "Sustainable Fitness",
    description: "Building consistency, movement quality, and long-term habits.",
  };
}

function getActivityProfile(workoutSummary) {
  const completed = toNumber(workoutSummary?.completedCount, 0);

  if (completed >= 20) {
    return {
      label: "Very Active",
      subtitle: "5-6 days/week",
      percent: 85,
    };
  }

  if (completed >= 12) {
    return {
      label: "Active",
      subtitle: "4-5 days/week",
      percent: 70,
    };
  }

  if (completed >= 6) {
    return {
      label: "Moderate",
      subtitle: "3-4 days/week",
      percent: 55,
    };
  }

  return {
    label: "Getting Started",
    subtitle: "1-2 days/week",
    percent: 35,
  };
}

function buildProfileForm(user) {
  return {
    name: user?.name || "",
    avatarUrl: user?.avatarUrl || "",
    fitnessLevel: user?.fitnessLevel || "beginner",
    gender: user?.gender || "prefer_not_to_say",
    age: user?.age ?? "",
    heightCm: user?.heightCm ?? "",
    currentWeightKg: user?.currentWeightKg ?? "",
    goalWeightKg: user?.goalWeightKg ?? "",
  };
}

function ProfileModal({
  draft,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
  title,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0px_30px_80px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-[#2f3337]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#5b5f64]">
              Update your training profile and body metrics.
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Name
              <input
                value={draft.name}
                onChange={(event) => onChange("name", event.target.value)}
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Avatar URL
              <input
                value={draft.avatarUrl}
                onChange={(event) => onChange("avatarUrl", event.target.value)}
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
                placeholder="https://..."
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Fitness Level
              <select
                value={draft.fitnessLevel}
                onChange={(event) =>
                  onChange("fitnessLevel", event.target.value)
                }
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Gender
              <select
                value={draft.gender}
                onChange={(event) => onChange("gender", event.target.value)}
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Age
              <input
                value={draft.age}
                onChange={(event) => onChange("age", event.target.value)}
                type="number"
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
                min={13}
                max={120}
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Height (cm)
              <input
                value={draft.heightCm}
                onChange={(event) => onChange("heightCm", event.target.value)}
                type="number"
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
                min={90}
                max={260}
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Current Weight (kg)
              <input
                value={draft.currentWeightKg}
                onChange={(event) =>
                  onChange("currentWeightKg", event.target.value)
                }
                type="number"
                step="0.1"
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
                min={20}
                max={500}
              />
            </label>

            <label className="space-y-1 text-sm font-semibold text-[#2f3337]">
              Goal Weight (kg)
              <input
                value={draft.goalWeightKg}
                onChange={(event) => onChange("goalWeightKg", event.target.value)}
                type="number"
                step="0.1"
                className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
                min={20}
                max={500}
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {isSaving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({
  draft,
  isSaving,
  onChange,
  onClose,
  onSubmit,
  submitLabel,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0px_30px_80px_rgba(15,23,42,0.35)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-[#2f3337]">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-[#5b5f64]">
              Keep your account secure with a stronger password.
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

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1 text-sm font-semibold text-[#2f3337]">
            Current Password
            <input
              value={draft.currentPassword}
              onChange={(event) =>
                onChange("currentPassword", event.target.value)
              }
              type="password"
              className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              autoComplete="current-password"
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold text-[#2f3337]">
            New Password
            <input
              value={draft.newPassword}
              onChange={(event) => onChange("newPassword", event.target.value)}
              type="password"
              className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              autoComplete="new-password"
            />
          </label>

          <label className="block space-y-1 text-sm font-semibold text-[#2f3337]">
            Confirm New Password
            <input
              value={draft.confirmPassword}
              onChange={(event) =>
                onChange("confirmPassword", event.target.value)
              }
              type="password"
              className="w-full rounded-xl border border-[#d7dae0] bg-white px-3 py-2 outline-none transition focus:border-[#0052fe]"
              autoComplete="new-password"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {isSaving ? "Updating..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { authUser, isAuthBusy, logout, setAuthUser } = useAuth();
  const queryClient = useQueryClient();

  const [notice, setNotice] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileDraft, setProfileDraft] = useState(buildProfileForm(DEFAULT_PROFILE));
  const [passwordDraft, setPasswordDraft] = useState(EMPTY_PASSWORD_FORM);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const response = await authApi.getMe();
      return response?.data?.user || null;
    },
    initialData: authUser || null,
  });

  const [workoutStatsQuery, dietSummaryQuery, progressAnalyticsQuery] =
    useQueries({
      queries: [
        {
          queryKey: ["profile", "workouts", "stats"],
          queryFn: workoutsApi.getStats,
        },
        {
          queryKey: ["profile", "diet", "summary"],
          queryFn: dietApi.getSummary,
        },
        {
          queryKey: ["profile", "progress", "analytics"],
          queryFn: progressApi.getAnalytics,
        },
      ],
    });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => authApi.updateMe(payload),
    onSuccess: (response) => {
      const updatedUser = response?.data?.user || null;

      if (updatedUser) {
        setAuthUser(updatedUser);
        queryClient.setQueryData(["profile", "me"], updatedUser);
      }

      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowProfileModal(false);
      setNotice(response?.message || "Profile updated successfully.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => authApi.changePassword(payload),
    onSuccess: (response) => {
      setShowPasswordModal(false);
      setPasswordDraft(EMPTY_PASSWORD_FORM);
      setNotice(response?.message || "Password changed successfully.");
    },
  });

  const profile = profileQuery.data || authUser || DEFAULT_PROFILE;
  const workoutSummary = workoutStatsQuery.data?.summary || {};
  const dietSummary = dietSummaryQuery.data?.summary || {};
  const progressSummary = progressAnalyticsQuery.data?.summary || {};

  const level = Math.max(1, Math.floor(toNumber(profile.badgePoints, 0) / 100) + 1);
  const goalProfile = useMemo(() => getGoalProfile(profile), [profile]);
  const activityProfile = useMemo(
    () => getActivityProfile(workoutSummary),
    [workoutSummary],
  );

  const aiInsight = useMemo(() => {
    const workoutCalories = toNumber(workoutSummary.totalCalories, 0);
    const nutritionCalories = toNumber(dietSummary.totalCalories, 0);

    if (goalProfile.badge === "Weight Loss") {
      return "Based on your profile, keep a controlled deficit on recovery days and prioritize protein timing around workouts.";
    }

    if (goalProfile.badge === "Weight Gain") {
      return "Your current plan supports lean gain. Add about 250 kcal on heavy compound days to sustain progression.";
    }

    if (workoutCalories > nutritionCalories) {
      return "Your activity burn is outpacing your intake. Increase post-workout carbs for better recovery quality.";
    }

    return "Your training and nutrition are balanced. Keep hydration and sleep quality consistent this week.";
  }, [dietSummary.totalCalories, goalProfile.badge, workoutSummary.totalCalories]);

  const connectedApps = useMemo(
    () => [
      {
        id: "apple-health",
        name: "Apple Health",
        details: `${Math.max(1, toNumber(workoutSummary.completedCount, 0))} workout metrics synced`,
        status: workoutStatsQuery.isFetching ? "Syncing" : "Active",
        icon: Watch,
      },
      {
        id: "myfitnesspal",
        name: "MyFitnessPal",
        details: `Last sync ${formatTimeAgo(dietSummaryQuery.dataUpdatedAt)}`,
        status: dietSummaryQuery.isFetching ? "Syncing" : "Active",
        icon: Salad,
      },
    ],
    [
      dietSummaryQuery.dataUpdatedAt,
      dietSummaryQuery.isFetching,
      workoutStatsQuery.isFetching,
      workoutSummary.completedCount,
    ],
  );

  const milestones = useMemo(
    () => [
      {
        id: "calories",
        value: formatNumber(workoutSummary.totalCalories),
        suffix: "kcal",
        label: "Calories Burned",
        icon: Flame,
        isPrimary: true,
      },
      {
        id: "streak",
        value: formatNumber(profile.streakDays),
        suffix: "days",
        label: "Day Streak",
        icon: Target,
        isPrimary: false,
      },
      {
        id: "volume",
        value: formatNumber(toNumber(workoutSummary.totalDurationMin, 0)),
        suffix: "min",
        label: "Training Minutes",
        icon: Dumbbell,
        isPrimary: false,
      },
    ],
    [profile.streakDays, workoutSummary.totalCalories, workoutSummary.totalDurationMin],
  );

  const queryErrorMessage = [
    profileQuery.error,
    workoutStatsQuery.error,
    dietSummaryQuery.error,
    progressAnalyticsQuery.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Unable to load profile details."))
    .join(" ");

  const mutationErrorMessage = [
    updateProfileMutation.error,
    changePasswordMutation.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error, "Action failed. Please try again."))
    .join(" ");

  function openProfileModal() {
    setProfileDraft(buildProfileForm(profile));
    setShowProfileModal(true);
  }

  function handleProfileDraftChange(field, value) {
    setProfileDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handlePasswordDraftChange(field, value) {
    setPasswordDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleLogout() {
    await logout();
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setNotice("");

    const trimmedName = profileDraft.name.trim();

    const payload = {
      name: trimmedName || undefined,
      avatarUrl: profileDraft.avatarUrl.trim() || undefined,
      fitnessLevel: profileDraft.fitnessLevel,
      gender: profileDraft.gender,
      age: parseOptionalNumber(profileDraft.age),
      heightCm: parseOptionalNumber(profileDraft.heightCm),
      currentWeightKg: parseOptionalNumber(profileDraft.currentWeightKg),
      goalWeightKg: parseOptionalNumber(profileDraft.goalWeightKg),
    };

    await updateProfileMutation.mutateAsync(payload);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setNotice("");

    if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
      setNotice("New password and confirmation do not match.");
      return;
    }

    await changePasswordMutation.mutateAsync({
      currentPassword: passwordDraft.currentPassword,
      newPassword: passwordDraft.newPassword,
    });
  }

  const isBusy =
    profileQuery.isPending ||
    workoutStatsQuery.isPending ||
    dietSummaryQuery.isPending ||
    progressAnalyticsQuery.isPending;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f9f9fc] pb-32 text-[#2f3337]">
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

      <section className="mx-auto w-full max-w-7xl px-6 pb-20 pt-24 md:pl-24">
        {isBusy ? (
          <div className="mb-6 rounded-xl border border-[#cfd3da] bg-white px-4 py-3 text-sm text-[#5b5f64]">
            Refreshing profile metrics...
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

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-8 flex flex-col gap-6">
            <section className="flex flex-col items-center gap-8 rounded-xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.04)] md:flex-row">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full ring-4 ring-[#0048e2]/10">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Athlete profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#dee1f9] text-3xl font-black text-[#0048e2]">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="absolute bottom-0 right-0 rounded-full bg-[#0048e2] p-2 text-white shadow-lg transition hover:scale-105"
                  aria-label="Edit profile"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="font-heading text-4xl font-extrabold tracking-tighter text-[#2f3337]">
                  {profile.name || "Athlete"}
                </h1>
                <p className="mb-4 mt-1 text-[#5b5f64]">
                  {profile.email || "-"} • Level {level}
                </p>
                <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full bg-[#dee1f9] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#4d5164]">
                    {labelFromFitnessLevel(profile.fitnessLevel)}
                  </span>
                  <span className="rounded-full bg-[#ecccfb] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#594268]">
                    {goalProfile.badge}
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto">
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0048e2] px-8 py-3 font-bold text-white transition hover:opacity-90 active:scale-95"
                >
                  <Settings size={16} />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e6e8ed] px-8 py-3 font-bold text-[#0048e2] transition hover:opacity-90 active:scale-95"
                >
                  <Shield size={16} />
                  Change Password
                </button>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <article className="rounded-xl bg-[#f2f3f7] p-6 text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                  Age
                </p>
                <p className="font-heading text-2xl font-black text-[#2f3337]">
                  {profile.age ?? "--"}
                </p>
              </article>

              <article className="rounded-xl bg-[#f2f3f7] p-6 text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                  Height
                </p>
                <p className="font-heading text-2xl font-black text-[#2f3337]">
                  {formatOneDecimal(profile.heightCm, " cm")}
                </p>
              </article>

              <article className="rounded-xl bg-[#f2f3f7] p-6 text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                  Weight
                </p>
                <p className="font-heading text-2xl font-black text-[#2f3337]">
                  {formatOneDecimal(profile.currentWeightKg, " kg")}
                </p>
              </article>

              <article className="rounded-xl bg-[#f2f3f7] p-6 text-center">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#5b5f64]">
                  Gender
                </p>
                <p className="font-heading text-2xl font-black text-[#2f3337]">
                  {labelFromGender(profile.gender)}
                </p>
              </article>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-6">
            <section className="h-full rounded-xl bg-white p-6 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]">
              <h3 className="mb-6 flex items-center gap-2 font-heading text-xl font-bold text-[#2f3337]">
                <Target size={18} className="text-[#0048e2]" />
                Fitness Journey
              </h3>

              <div className="space-y-8">
                <div>
                  <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b5f64]">
                    Primary Goal
                  </label>
                  <div className="rounded-r-lg border-l-4 border-[#0048e2] bg-[#0048e2]/5 p-4">
                    <p className="text-lg font-semibold text-[#2f3337]">
                      {goalProfile.title}
                    </p>
                    <p className="mt-1 text-sm text-[#5b5f64]">
                      {goalProfile.description}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em] text-[#5b5f64]">
                    Activity Level
                  </label>
                  <div className="space-y-3">
                    <div className="mb-1 flex items-center justify-between text-sm font-bold">
                      <span className="text-[#0048e2]">{activityProfile.label}</span>
                      <span className="text-[#5b5f64]">{activityProfile.subtitle}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-[#e6e8ed]">
                      <div
                        className="h-full rounded-full bg-[#0048e2]"
                        style={{ width: `${activityProfile.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#6f567d]/10 bg-[#ecccfb]/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bot size={16} className="text-[#6f567d]" />
                    <span className="text-sm font-bold text-[#6f567d]">
                      AI Insight
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#594268]">
                    {aiInsight}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="rounded-xl bg-[#f2f3f7] p-8">
            <h3 className="mb-6 font-heading text-xl font-bold text-[#2f3337]">
              Connected Apps
            </h3>
            <div className="space-y-4">
              {connectedApps.map((app) => {
                const Icon = app.icon;

                return (
                  <article
                    key={app.id}
                    className="flex items-center justify-between rounded-lg bg-white p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-black/5 text-[#0048e2]">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-[#2f3337]">{app.name}</p>
                        <p className="text-xs text-[#5b5f64]">{app.details}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0048e2]">
                      {app.status}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl bg-[#f2f3f7] p-8">
            <h3 className="mb-6 font-heading text-xl font-bold text-[#2f3337]">
              Upcoming Milestones
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {milestones.map((milestone) => {
                const Icon = milestone.icon;

                return (
                  <article
                    key={milestone.id}
                    className={`flex min-h-[160px] min-w-[170px] flex-col justify-between rounded-xl p-4 ${
                      milestone.isPrimary
                        ? "bg-[#0048e2] text-white"
                        : "bg-white text-[#2f3337]"
                    }`}
                  >
                    <Icon
                      size={28}
                      className={
                        milestone.isPrimary ? "opacity-70" : "text-[#0048e2]"
                      }
                    />
                    <div>
                      <p className="font-heading text-2xl font-black tracking-tighter">
                        {milestone.value}
                      </p>
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          milestone.isPrimary ? "opacity-80" : "text-[#5b5f64]"
                        }`}
                      >
                        {milestone.suffix} • {milestone.label}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg bg-white p-4 text-sm text-[#5b5f64]">
              Member since {formatDate(profile.createdAt)}. Latest recorded weight:
              {" "}
              {typeof progressSummary.latestWeight === "number"
                ? `${progressSummary.latestWeight.toFixed(1)} kg`
                : "not available"}
              .
            </div>
          </section>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-lg bg-[#ffffff]/85 px-4 pb-6 pt-2 shadow-[0px_-10px_30px_rgba(47,51,55,0.04)] backdrop-blur-xl md:hidden">
        <Link
          to="/dashboard"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <Home size={18} className="mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Home
          </span>
        </Link>
        <Link
          to="/workout"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <Dumbbell size={18} className="mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Workout
          </span>
        </Link>
        <Link
          to="/diet"
          className="flex flex-col items-center justify-center px-4 py-2 text-[#2f3337]"
        >
          <Salad size={18} className="mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Diet
          </span>
        </Link>
        <Link
          to="/profile"
          className="flex scale-105 flex-col items-center justify-center rounded-md bg-[#0048e2] px-4 py-2 text-white"
        >
          <User size={18} className="mb-1" />
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            Profile
          </span>
        </Link>
      </nav>

      <div className="hidden fixed left-0 top-0 z-40 h-full w-20 flex-col items-center border-r border-[#aeb2b7]/15 bg-[#f2f3f7] py-8 md:flex">
        <span className="mb-12 font-heading text-3xl font-black text-[#0048e2]">
          F
        </span>
        <div className="flex flex-col gap-8">
          <Link to="/dashboard" className="text-[#5b5f64] hover:text-[#0048e2]">
            <Home size={20} />
          </Link>
          <Link to="/workout" className="text-[#5b5f64] hover:text-[#0048e2]">
            <Dumbbell size={20} />
          </Link>
          <Link to="/diet" className="text-[#5b5f64] hover:text-[#0048e2]">
            <Salad size={20} />
          </Link>
          <Link to="/profile" className="text-[#0048e2]">
            <User size={20} />
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto text-[#5b5f64] hover:text-rose-600"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>

      {showProfileModal ? (
        <ProfileModal
          title="Edit Profile"
          draft={profileDraft}
          isSaving={updateProfileMutation.isPending}
          onChange={handleProfileDraftChange}
          onClose={() => setShowProfileModal(false)}
          onSubmit={handleProfileSubmit}
          submitLabel="Save Profile"
        />
      ) : null}

      {showPasswordModal ? (
        <PasswordModal
          draft={passwordDraft}
          isSaving={changePasswordMutation.isPending}
          onChange={handlePasswordDraftChange}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          submitLabel="Update Password"
        />
      ) : null}
    </main>
  );
}

export default ProfilePage;
