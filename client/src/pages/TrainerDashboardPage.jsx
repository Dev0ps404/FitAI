import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/common/EmptyState";
import SectionCard from "../components/common/SectionCard";
import StatCard from "../components/common/StatCard";
import { getApiErrorMessage } from "../services/apiClient";
import { bookingApi, trainerApi } from "../services/fitnessApi";
import { formatDateLabel } from "../utils/formatters";

function TrainerDashboardPage() {
  const queryClient = useQueryClient();

  const { data: clientsData } = useQuery({
    queryKey: ["trainer-clients"],
    queryFn: () => trainerApi.getClients(),
  });

  const { data: bookingsData } = useQuery({
    queryKey: ["trainer-bookings"],
    queryFn: () => bookingApi.list({ limit: 10 }),
  });

  const bookingStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) =>
      bookingApi.updateStatus(bookingId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trainer-bookings"] });
    },
  });

  const bookingCancelMutation = useMutation({
    mutationFn: (bookingId) => bookingApi.cancel(bookingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["trainer-bookings"] });
    },
  });

  const clients = clientsData?.clients || [];
  const bookings = bookingsData?.bookings || [];

  const bookingSummary = bookings.reduce(
    (accumulator, booking) => {
      const status = booking.status || "pending";

      if (!accumulator[status]) {
        accumulator[status] = 0;
      }

      accumulator[status] += 1;

      return accumulator;
    },
    {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    },
  );

  async function handleUpdateStatus(bookingId, status) {
    try {
      await bookingStatusMutation.mutateAsync({ bookingId, status });
    } catch (error) {
      window.alert(
        getApiErrorMessage(error, "Unable to update booking status."),
      );
    }
  }

  async function handleCancelBooking(bookingId) {
    try {
      await bookingCancelMutation.mutateAsync(bookingId);
    } catch (error) {
      window.alert(getApiErrorMessage(error, "Unable to cancel booking."));
    }
  }

  return (
    <section className="space-y-5">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-4 inline-flex">Trainer Console</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-slate-900 md:text-4xl">
          Client And Booking Management
        </h1>
        <p className="mt-3 text-sm text-slate-700 md:text-base">
          Track active clients and update booking states in real time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clients"
          value={clients.length}
          subtitle="Unique booked users"
          tone="cyan"
        />
        <StatCard
          title="Pending"
          value={bookingSummary.pending}
          subtitle="Awaiting action"
          tone="amber"
        />
        <StatCard
          title="Confirmed"
          value={bookingSummary.confirmed}
          subtitle="Upcoming sessions"
          tone="lime"
        />
        <StatCard
          title="Completed"
          value={bookingSummary.completed}
          subtitle="Finished coaching"
          tone="cyan"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard
          title="My Clients"
          description="Clients with confirmed or completed bookings."
        >
          {clients.length === 0 ? (
            <EmptyState
              title="No clients yet"
              description="Confirmed bookings will automatically populate your client roster."
            />
          ) : (
            <div className="grid gap-3">
              {clients.map((client) => (
                <article
                  key={client._id}
                  className="rounded-xl border border-sky-200 bg-white/80 p-4"
                >
                  <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-slate-900">
                    {client.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{client.email}</p>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Bookings"
          description="Update status as sessions progress."
        >
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Incoming booking requests will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {bookings.map((booking) => {
                const bookingDateRange = `${formatDateLabel(booking.slotStart)} ${new Date(
                  booking.slotStart,
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`;
                const isMutationBusy =
                  bookingStatusMutation.isPending ||
                  bookingCancelMutation.isPending;

                return (
                  <article
                    key={booking._id}
                    className="rounded-xl border border-sky-200 bg-white/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-slate-900">
                        {booking.user?.name || "Client"}
                      </h3>
                      <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-neon-cyan">
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {bookingDateRange}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {booking.user?.email || "No email"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {booking.status === "pending" ? (
                        <button
                          type="button"
                          disabled={isMutationBusy}
                          onClick={() =>
                            handleUpdateStatus(booking._id, "confirmed")
                          }
                          className="rounded-full border border-neon-lime/50 bg-neon-lime/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-lime disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Confirm
                        </button>
                      ) : null}

                      {booking.status === "confirmed" ? (
                        <button
                          type="button"
                          disabled={isMutationBusy}
                          onClick={() =>
                            handleUpdateStatus(booking._id, "completed")
                          }
                          className="rounded-full border border-neon-cyan/50 bg-neon-cyan/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-cyan disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Mark Completed
                        </button>
                      ) : null}

                      {booking.status !== "cancelled" &&
                      booking.status !== "completed" ? (
                        <button
                          type="button"
                          disabled={isMutationBusy}
                          onClick={() => handleCancelBooking(booking._id)}
                          className="rounded-full border border-neon-amber/50 bg-neon-amber/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-amber disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </section>
  );
}

export default TrainerDashboardPage;
