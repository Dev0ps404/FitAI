import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/common/EmptyState";
import SectionCard from "../components/common/SectionCard";
import StatCard from "../components/common/StatCard";
import { getApiErrorMessage } from "../services/apiClient";
import { adminApi, trainerApi } from "../services/fitnessApi";
import { formatCompactNumber, formatDateLabel } from "../utils/formatters";

function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => adminApi.getAnalytics(),
  });

  const { data: applicationsData } = useQuery({
    queryKey: ["trainer-applications"],
    queryFn: () => adminApi.listTrainerApplications(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ trainerId, payload }) =>
      trainerApi.reviewApplication(trainerId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trainer-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-analytics"] }),
      ]);
    },
  });

  const applications = applicationsData?.applications || [];
  const bookingSummary = analyticsData?.bookingsByStatus || [];
  const bookingLookup = bookingSummary.reduce((map, item) => {
    map[item._id] = item.count;
    return map;
  }, {});

  async function handleReviewApplication(trainerId, status) {
    const payload =
      status === "rejected"
        ? {
            status,
            rejectionReason: "Rejected by admin after profile review.",
          }
        : { status };

    try {
      await reviewMutation.mutateAsync({ trainerId, payload });
    } catch (error) {
      window.alert(
        getApiErrorMessage(error, "Unable to update trainer application."),
      );
    }
  }

  return (
    <section className="space-y-5">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-4 inline-flex">Admin Console</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-white md:text-4xl">
          Platform Oversight And Approvals
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Monitor growth metrics, review trainer applications, and keep
          operations healthy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Active Users"
          value={formatCompactNumber(analyticsData?.totalUsers || 0)}
          subtitle="Accounts enabled"
          tone="cyan"
        />
        <StatCard
          title="Trainers"
          value={formatCompactNumber(analyticsData?.totalTrainers || 0)}
          subtitle="Approved trainers"
          tone="lime"
        />
        <StatCard
          title="Pending Approvals"
          value={formatCompactNumber(
            analyticsData?.pendingTrainerApplications || 0,
          )}
          subtitle="Needs review"
          tone="amber"
        />
        <StatCard
          title="Confirmed Bookings"
          value={formatCompactNumber(bookingLookup.confirmed || 0)}
          subtitle="Current pipeline"
          tone="cyan"
        />
        <StatCard
          title="Workouts (7d)"
          value={formatCompactNumber(
            analyticsData?.workoutsLast7Days?.totalCount || 0,
          )}
          subtitle="Recent volume"
          tone="lime"
        />
      </div>

      <SectionCard
        title="Trainer Applications"
        description="Approve or reject incoming trainer profile requests."
      >
        {applications.length === 0 ? (
          <EmptyState
            title="No pending applications"
            description="New trainer registrations will appear here."
          />
        ) : (
          <div className="grid gap-3">
            {applications.map((application) => {
              const applicant = application.user;

              return (
                <article
                  key={application._id}
                  className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-white">
                        {applicant?.name || "Unknown Applicant"}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {applicant?.email || "No email"}
                      </p>
                    </div>
                    <span className="rounded-full border border-neon-amber/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-neon-amber">
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
                    <p>
                      Experience: {application.yearsOfExperience || 0} years
                    </p>
                    <p>Rate: {application.hourlyRate || 0}/hr</p>
                    <p className="md:col-span-2">
                      Applied: {formatDateLabel(application.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        handleReviewApplication(application._id, "approved")
                      }
                      className="rounded-full border border-neon-lime/50 bg-neon-lime/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-lime disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        handleReviewApplication(application._id, "rejected")
                      }
                      className="rounded-full border border-neon-amber/50 bg-neon-amber/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-amber disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </section>
  );
}

export default AdminDashboardPage;
