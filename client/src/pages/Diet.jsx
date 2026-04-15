import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../services/fitnessApi";
import { getApiErrorMessage } from "../services/apiClient";

const initialFormState = {
  date: "",
  mealType: "breakfast",
  foodName: "",
  quantity: "1",
  unit: "serving",
  calories: "0",
  proteinG: "0",
  carbsG: "0",
  fatsG: "0",
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

function Diet() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialFormState);
  const [editingDietId, setEditingDietId] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["phase1-diet-logs"],
    queryFn: () => dietApi.list({ limit: 30 }),
  });

  const dietLogs = useMemo(() => data?.dietLogs || [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload) => dietApi.create(payload),
    onSuccess: async () => {
      setFeedback("Diet log added successfully.");
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["phase1-diet-logs"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase1-diet-summary"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to add diet log."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ dietLogId, payload }) => dietApi.update(dietLogId, payload),
    onSuccess: async () => {
      setFeedback("Diet log updated successfully.");
      setEditingDietId("");
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["phase1-diet-logs"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase1-diet-summary"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to update diet log."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (dietLogId) => dietApi.remove(dietLogId),
    onSuccess: async () => {
      setFeedback("Diet log deleted successfully.");
      await queryClient.invalidateQueries({ queryKey: ["phase1-diet-logs"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase1-diet-summary"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to delete diet log."));
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
    setEditingDietId("");
    setForm(initialFormState);
    setFeedback("");
  }

  function getPayloadFromForm() {
    return {
      date: form.date || undefined,
      mealType: form.mealType,
      notes: form.notes.trim() || undefined,
      foods: [
        {
          name: form.foodName.trim(),
          quantity: Number(form.quantity || 0),
          unit: form.unit.trim() || "serving",
          calories: Number(form.calories || 0),
          proteinG: Number(form.proteinG || 0),
          carbsG: Number(form.carbsG || 0),
          fatsG: Number(form.fatsG || 0),
        },
      ],
    };
  }

  function startEdit(dietLog) {
    const firstFood = dietLog.foods?.[0] || {};

    setEditingDietId(dietLog._id);
    setFeedback("");
    setForm({
      date: toInputDate(dietLog.date),
      mealType: dietLog.mealType || "breakfast",
      foodName: firstFood.name || "",
      quantity: String(firstFood.quantity ?? 1),
      unit: firstFood.unit || "serving",
      calories: String(firstFood.calories ?? 0),
      proteinG: String(firstFood.proteinG ?? 0),
      carbsG: String(firstFood.carbsG ?? 0),
      fatsG: String(firstFood.fatsG ?? 0),
      notes: dietLog.notes || "",
    });
  }

  function removeDietLog(dietLogId) {
    const shouldDelete = window.confirm("Delete this meal log?");

    if (!shouldDelete) {
      return;
    }

    deleteMutation.mutate(dietLogId);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    if (!form.foodName.trim()) {
      setFeedback("Food name is required.");
      return;
    }

    const payload = getPayloadFromForm();

    if (editingDietId) {
      updateMutation.mutate({ dietLogId: editingDietId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  return (
    <section className="space-y-6 py-8 md:py-12">
      <div className="panel-card">
        <h1 className="text-3xl font-bold uppercase tracking-[0.07em] text-zinc-100 md:text-4xl">
          Diet Tracker
        </h1>
        <p className="mt-3 text-sm text-zinc-300 md:text-base">
          Add meals, track calories, and maintain your nutrition history.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="panel-card space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
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

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Meal Type
              </label>
              <select
                name="mealType"
                value={form.mealType}
                onChange={handleFieldChange}
                className="input-control"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-300">
              Meal Entry
            </p>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <input
                name="foodName"
                value={form.foodName}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Oats"
              />
              <input
                name="quantity"
                type="number"
                min="0"
                step="0.1"
                value={form.quantity}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Quantity"
              />
              <input
                name="unit"
                value={form.unit}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Unit"
              />
              <input
                name="calories"
                type="number"
                min="0"
                value={form.calories}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Calories"
              />
              <input
                name="proteinG"
                type="number"
                min="0"
                step="0.1"
                value={form.proteinG}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Protein (g)"
              />
              <input
                name="carbsG"
                type="number"
                min="0"
                step="0.1"
                value={form.carbsG}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Carbs (g)"
              />
              <input
                name="fatsG"
                type="number"
                min="0"
                step="0.1"
                value={form.fatsG}
                onChange={handleFieldChange}
                className="input-control"
                placeholder="Fats (g)"
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
              placeholder="Balanced and high-protein meal"
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
              {editingDietId ? "Update Meal" : "Add Meal"}
            </button>

            {editingDietId ? (
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
            Diet History
          </h2>

          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-400">Loading meal logs...</p>
          ) : null}

          {!isLoading && dietLogs.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">No meal logs yet.</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {dietLogs.map((dietLog) => {
              const firstFood = dietLog.foods?.[0] || {};

              return (
                <article
                  key={dietLog._id}
                  className="rounded-2xl border border-zinc-700/80 bg-zinc-900/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-lime-200">
                        {dietLog.mealType}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(dietLog.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(dietLog)}
                        className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-200 transition hover:border-lime-400/50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDietLog(dietLog._id)}
                        className="rounded-lg border border-rose-400/40 px-2 py-1 text-xs text-rose-300 transition hover:bg-rose-400/10"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-300">
                    {firstFood.name || "Food"} • {firstFood.calories || 0} kcal
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

export default Diet;
