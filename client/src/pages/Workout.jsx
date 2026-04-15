import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../services/apiClient";
import { workoutsApi } from "../services/fitnessApi";

const initialFormState = {
  name: "",
  date: "",
  status: "planned",
  exerciseName: "",
  sets: "3",
  reps: "10",
  weightKg: "0",
  durationMin: "0",
  caloriesBurned: "0",
  notes: "",
};

function toInputDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Workout() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialFormState);
  const [editingWorkoutId, setEditingWorkoutId] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["phase1-workouts"],
    queryFn: () => workoutsApi.list({ limit: 30 }),
  });

  const workouts = useMemo(() => data?.workouts || [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload) => workoutsApi.create(payload),
    onSuccess: async () => {
      setFeedback("Workout added successfully.");
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["phase1-workouts"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to add workout."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ workoutId, payload }) => workoutsApi.update(workoutId, payload),
    onSuccess: async () => {
      setFeedback("Workout updated successfully.");
      setEditingWorkoutId("");
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["phase1-workouts"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to update workout."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (workoutId) => workoutsApi.remove(workoutId),
    onSuccess: async () => {
      setFeedback("Workout deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["phase1-workouts"] });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to delete workout."));
    },
  });

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetForm() {
    setEditingWorkoutId("");
    setForm(initialFormState);
    setFeedback("");
  }

  function getPayloadFromForm() {
    return {
      name: form.name.trim(),
      date: form.date || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      exercises: [
        {
          name: form.exerciseName.trim(),
          sets: Number(form.sets || 0),
          reps: Number(form.reps || 0),
          weightKg: Number(form.weightKg || 0),
          durationMin: Number(form.durationMin || 0),
          caloriesBurned: Number(form.caloriesBurned || 0),
        },
      ],
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name.trim()) {
      setFeedback("Workout name is required.");
      return;
    }

    if (!form.exerciseName.trim()) {
      setFeedback("Exercise name is required.");
      return;
    }

    const payload = getPayloadFromForm();

    if (editingWorkoutId) {
      updateMutation.mutate({ workoutId: editingWorkoutId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(workout) {
    const firstExercise = workout.exercises?.[0] || {};

    setEditingWorkoutId(workout._id);
    setFeedback("");
    setForm({
      name: workout.name || "",
      date: toInputDate(workout.date),
      status: workout.status || "planned",
      exerciseName: firstExercise.name || "",
      sets: String(firstExercise.sets ?? 0),
      reps: String(firstExercise.reps ?? 0),
      weightKg: String(firstExercise.weightKg ?? 0),
      durationMin: String(firstExercise.durationMin ?? 0),
      caloriesBurned: String(firstExercise.caloriesBurned ?? 0),
      notes: workout.notes || "",
    });
  }

  function removeWorkout(workoutId) {
    const shouldDelete = window.confirm("Delete this workout?");

    if (!shouldDelete) {
      return;
    }

    deleteMutation.mutate(workoutId);
  }

  return (
    <section className="space-y-6 py-8 md:py-12">
      <div className="panel-card">
        <h1 className="text-3xl font-bold uppercase tracking-[0.07em] text-zinc-100 md:text-4xl">
          Workout Tracker
        </h1>
        <p className="mt-3 text-sm text-zinc-300 md:text-base">
          Add, edit, and delete workouts while tracking sets, reps, and weights.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="panel-card space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Workout Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Push Day"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Date
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleFieldChange}
                className="input-control"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleFieldChange}
              className="input-control"
            >
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
              Exercise
            </p>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <input
                name="exerciseName"
                value={form.exerciseName}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Bench Press"
              />
              <input
                name="sets"
                type="number"
                min="0"
                value={form.sets}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Sets"
              />
              <input
                name="reps"
                type="number"
                min="0"
                value={form.reps}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Reps"
              />
              <input
                name="weightKg"
                type="number"
                min="0"
                step="0.1"
                value={form.weightKg}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Weight (kg)"
              />
              <input
                name="durationMin"
                type="number"
                min="0"
                value={form.durationMin}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Duration (min)"
              />
              <input
                name="caloriesBurned"
                type="number"
                min="0"
                value={form.caloriesBurned}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Calories burned"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleFieldChange}
              className="input-control"
              placeholder="Session felt strong today"
            />
          </div>

          {feedback ? (
            <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="primary-btn"
            >
              {editingWorkoutId ? "Update Workout" : "Add Workout"}
            </button>

            {editingWorkoutId ? (
              <button type="button" onClick={resetForm} className="secondary-btn">
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="panel-card">
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-zinc-100">
            Workout History
          </h2>

          {isLoading ? <p className="mt-4 text-sm text-zinc-400">Loading workouts...</p> : null}

          {!isLoading && workouts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No workout history yet.</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {workouts.map((workout) => {
              const firstExercise = workout.exercises?.[0] || {};

              return (
                <article
                  key={workout._id}
                  className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-lime-200">
                        {workout.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(workout.date).toLocaleDateString()} • {workout.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(workout)}
                        className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-200 transition hover:border-lime-400/50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWorkout(workout._id)}
                        className="rounded-lg border border-rose-400/40 px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-400/10"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300">
                    {firstExercise.name || "Exercise"}: {firstExercise.sets || 0} sets ×{" "}
                    {firstExercise.reps || 0} reps • {firstExercise.weightKg || 0} kg
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workout;
