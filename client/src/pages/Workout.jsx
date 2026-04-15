import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../services/apiClient";
import { workoutsApi } from "../services/fitnessApi";

function createExerciseDraft(overrides = {}) {
  return {
    name: "",
    sets: "3",
    reps: "10",
    weightKg: "0",
    durationMin: "0",
    caloriesBurned: "0",
    ...overrides,
  };
}

function createInitialFormState() {
  return {
    name: "",
    date: "",
    status: "planned",
    notes: "",
    exercises: [createExerciseDraft()],
  };
}

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
  const [form, setForm] = useState(createInitialFormState);
  const [editingWorkoutId, setEditingWorkoutId] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["phase2-workouts"],
    queryFn: () => workoutsApi.list({ limit: 30 }),
  });

  const workouts = useMemo(() => data?.workouts || [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload) => workoutsApi.create(payload),
    onSuccess: async () => {
      setFeedback("Workout added successfully.");
      setForm(createInitialFormState());
      await queryClient.invalidateQueries({ queryKey: ["phase2-workouts"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase2-workout-stats"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to add workout."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ workoutId, payload }) =>
      workoutsApi.update(workoutId, payload),
    onSuccess: async () => {
      setFeedback("Workout updated successfully.");
      setEditingWorkoutId("");
      setForm(createInitialFormState());
      await queryClient.invalidateQueries({ queryKey: ["phase2-workouts"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase2-workout-stats"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to update workout."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (workoutId) => workoutsApi.remove(workoutId),
    onSuccess: async () => {
      setFeedback("Workout deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["phase2-workouts"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase2-workout-stats"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to delete workout."));
    },
  });

  function handleFormFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleExerciseFieldChange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, itemIndex) =>
        itemIndex === index ? { ...exercise, [field]: value } : exercise,
      ),
    }));
  }

  function addExerciseRow() {
    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, createExerciseDraft()],
    }));
  }

  function removeExerciseRow(index) {
    setForm((prev) => {
      if (prev.exercises.length === 1) {
        return prev;
      }

      return {
        ...prev,
        exercises: prev.exercises.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function resetForm() {
    setEditingWorkoutId("");
    setForm(createInitialFormState());
    setFeedback("");
  }

  function getPayloadFromForm() {
    const exercises = form.exercises
      .filter((exercise) => exercise.name.trim().length > 0)
      .map((exercise) => ({
        name: exercise.name.trim(),
        sets: Number(exercise.sets || 0),
        reps: Number(exercise.reps || 0),
        weightKg: Number(exercise.weightKg || 0),
        durationMin: Number(exercise.durationMin || 0),
        caloriesBurned: Number(exercise.caloriesBurned || 0),
      }));

    return {
      name: form.name.trim(),
      date: form.date || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      exercises,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.name.trim()) {
      setFeedback("Workout name is required.");
      return;
    }

    const payload = getPayloadFromForm();

    if (payload.exercises.length === 0) {
      setFeedback("At least one exercise is required.");
      return;
    }

    const hasInvalidExerciseName = payload.exercises.some(
      (exercise) => exercise.name.trim().length < 2,
    );

    if (hasInvalidExerciseName) {
      setFeedback("Each exercise name must be at least 2 characters.");
      return;
    }

    if (editingWorkoutId) {
      updateMutation.mutate({ workoutId: editingWorkoutId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(workout) {
    const nextExercises =
      workout.exercises?.length > 0
        ? workout.exercises.map((exercise) =>
            createExerciseDraft({
              name: exercise.name || "",
              sets: String(exercise.sets ?? 0),
              reps: String(exercise.reps ?? 0),
              weightKg: String(exercise.weightKg ?? 0),
              durationMin: String(exercise.durationMin ?? 0),
              caloriesBurned: String(exercise.caloriesBurned ?? 0),
            }),
          )
        : [createExerciseDraft()];

    setEditingWorkoutId(workout._id);
    setFeedback("");
    setForm({
      name: workout.name || "",
      date: toInputDate(workout.date),
      status: workout.status || "planned",
      notes: workout.notes || "",
      exercises: nextExercises,
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
          Add, edit, and delete workouts with multiple exercise rows per
          session.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form className="panel-card space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Workout Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormFieldChange}
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
                onChange={handleFormFieldChange}
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
              onChange={handleFormFieldChange}
              className="input-control"
            >
              <option value="planned">Planned</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
                Exercises
              </p>
              <button
                type="button"
                onClick={addExerciseRow}
                className="secondary-btn"
              >
                Add Exercise
              </button>
            </div>

            {form.exercises.map((exercise, index) => (
              <div
                key={`${index}-${exercise.name}`}
                className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
                    Exercise {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeExerciseRow(index)}
                    className="rounded-full border border-rose-400/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-400/10"
                    disabled={form.exercises.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={exercise.name}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "name",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Bench Press"
                  />
                  <input
                    type="number"
                    min="0"
                    value={exercise.sets}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "sets",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Sets"
                  />
                  <input
                    type="number"
                    min="0"
                    value={exercise.reps}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "reps",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Reps"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={exercise.weightKg}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "weightKg",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Weight (kg)"
                  />
                  <input
                    type="number"
                    min="0"
                    value={exercise.durationMin}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "durationMin",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Duration (min)"
                  />
                  <input
                    type="number"
                    min="0"
                    value={exercise.caloriesBurned}
                    onChange={(event) =>
                      handleExerciseFieldChange(
                        index,
                        "caloriesBurned",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Calories burned"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleFormFieldChange}
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
              <button
                type="button"
                onClick={resetForm}
                className="secondary-btn"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="panel-card">
          <h2 className="text-lg font-semibold uppercase tracking-[0.06em] text-zinc-100">
            Workout History
          </h2>

          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-400">Loading workouts...</p>
          ) : null}

          {!isLoading && workouts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              No workout history yet.
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {workouts.map((workout) => (
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
                      {new Date(workout.date).toLocaleDateString()} •{" "}
                      {workout.status}
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

                <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                  {(workout.exercises || [])
                    .slice(0, 3)
                    .map((exercise, index) => (
                      <li key={`${workout._id}-${exercise.name}-${index}`}>
                        {exercise.name}: {exercise.sets || 0} x{" "}
                        {exercise.reps || 0} • {exercise.weightKg || 0} kg
                      </li>
                    ))}
                  {(workout.exercises || []).length > 3 ? (
                    <li className="text-xs text-zinc-400">
                      + {(workout.exercises || []).length - 3} more exercises
                    </li>
                  ) : null}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Workout;
