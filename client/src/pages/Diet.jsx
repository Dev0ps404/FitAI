import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dietApi } from "../services/fitnessApi";
import { getApiErrorMessage } from "../services/apiClient";

function createFoodDraft(overrides = {}) {
  return {
    name: "",
    quantity: "1",
    unit: "serving",
    calories: "0",
    proteinG: "0",
    carbsG: "0",
    fatsG: "0",
    ...overrides,
  };
}

function createInitialFormState() {
  return {
    date: "",
    mealType: "breakfast",
    notes: "",
    foods: [createFoodDraft()],
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

function Diet() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(createInitialFormState);
  const [editingDietId, setEditingDietId] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["phase2-diet-logs"],
    queryFn: () => dietApi.list({ limit: 30 }),
  });

  const dietLogs = useMemo(() => data?.dietLogs || [], [data]);

  const createMutation = useMutation({
    mutationFn: (payload) => dietApi.create(payload),
    onSuccess: async () => {
      setFeedback("Diet log added successfully.");
      setForm(createInitialFormState());
      await queryClient.invalidateQueries({ queryKey: ["phase2-diet-logs"] });
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
      setForm(createInitialFormState());
      await queryClient.invalidateQueries({ queryKey: ["phase2-diet-logs"] });
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
      await queryClient.invalidateQueries({ queryKey: ["phase2-diet-logs"] });
      await queryClient.invalidateQueries({
        queryKey: ["phase1-diet-summary"],
      });
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to delete diet log."));
    },
  });

  function handleFormFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFoodFieldChange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      foods: prev.foods.map((food, itemIndex) =>
        itemIndex === index ? { ...food, [field]: value } : food,
      ),
    }));
  }

  function addFoodRow() {
    setForm((prev) => ({
      ...prev,
      foods: [...prev.foods, createFoodDraft()],
    }));
  }

  function removeFoodRow(index) {
    setForm((prev) => {
      if (prev.foods.length === 1) {
        return prev;
      }

      return {
        ...prev,
        foods: prev.foods.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function resetForm() {
    setEditingDietId("");
    setForm(createInitialFormState());
    setFeedback("");
  }

  function getPayloadFromForm() {
    const foods = form.foods
      .filter((food) => food.name.trim().length > 0)
      .map((food) => ({
        name: food.name.trim(),
        quantity: Number(food.quantity || 0),
        unit: food.unit.trim() || "serving",
        calories: Number(food.calories || 0),
        proteinG: Number(food.proteinG || 0),
        carbsG: Number(food.carbsG || 0),
        fatsG: Number(food.fatsG || 0),
      }));

    return {
      date: form.date || undefined,
      mealType: form.mealType,
      notes: form.notes.trim() || undefined,
      foods,
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFeedback("");

    const payload = getPayloadFromForm();

    if (payload.foods.length === 0) {
      setFeedback("At least one food entry is required.");
      return;
    }

    const hasInvalidFoodName = payload.foods.some(
      (food) => food.name.length < 1,
    );

    if (hasInvalidFoodName) {
      setFeedback("Food name cannot be empty.");
      return;
    }

    if (editingDietId) {
      updateMutation.mutate({ dietLogId: editingDietId, payload });
      return;
    }

    createMutation.mutate(payload);
  }

  function startEdit(dietLog) {
    const nextFoods =
      dietLog.foods?.length > 0
        ? dietLog.foods.map((food) =>
            createFoodDraft({
              name: food.name || "",
              quantity: String(food.quantity ?? 1),
              unit: food.unit || "serving",
              calories: String(food.calories ?? 0),
              proteinG: String(food.proteinG ?? 0),
              carbsG: String(food.carbsG ?? 0),
              fatsG: String(food.fatsG ?? 0),
            }),
          )
        : [createFoodDraft()];

    setEditingDietId(dietLog._id);
    setFeedback("");
    setForm({
      date: toInputDate(dietLog.date),
      mealType: dietLog.mealType || "breakfast",
      notes: dietLog.notes || "",
      foods: nextFoods,
    });
  }

  function removeDietLog(dietLogId) {
    const shouldDelete = window.confirm("Delete this meal log?");

    if (!shouldDelete) {
      return;
    }

    deleteMutation.mutate(dietLogId);
  }

  return (
    <section className="subtle-fade-in space-y-6 py-8 md:py-12">
      <div className="panel-card">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.07em] text-white md:text-4xl">
          Diet Tracker
        </h1>
        <p className="mt-3 text-sm text-violet-100/80 md:text-base">
          Track meals with multiple food rows and maintain complete nutrition
          logs.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form className="panel-card space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-violet-200/75">
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

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-violet-200/75">
                Meal Type
              </label>
              <select
                name="mealType"
                value={form.mealType}
                onChange={handleFormFieldChange}
                className="input-control"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                Food Entries
              </p>
              <button
                type="button"
                onClick={addFoodRow}
                className="secondary-btn"
              >
                Add Food
              </button>
            </div>

            {form.foods.map((food, index) => (
              <div
                key={`${index}-${food.name}`}
                className="rounded-2xl border border-white/15 bg-white/5 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.14em] text-violet-200/65">
                    Food {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFoodRow(index)}
                    className="rounded-full border border-rose-400/40 px-3 py-1 text-xs uppercase tracking-[0.14em] text-rose-300 transition hover:bg-rose-400/10"
                    disabled={form.foods.length === 1}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={food.name}
                    onChange={(event) =>
                      handleFoodFieldChange(index, "name", event.target.value)
                    }
                    className="input-control"
                    placeholder="Oats"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={food.quantity}
                    onChange={(event) =>
                      handleFoodFieldChange(
                        index,
                        "quantity",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Quantity"
                  />
                  <input
                    value={food.unit}
                    onChange={(event) =>
                      handleFoodFieldChange(index, "unit", event.target.value)
                    }
                    className="input-control"
                    placeholder="Unit"
                  />
                  <input
                    type="number"
                    min="0"
                    value={food.calories}
                    onChange={(event) =>
                      handleFoodFieldChange(
                        index,
                        "calories",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Calories"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={food.proteinG}
                    onChange={(event) =>
                      handleFoodFieldChange(
                        index,
                        "proteinG",
                        event.target.value,
                      )
                    }
                    className="input-control"
                    placeholder="Protein (g)"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={food.carbsG}
                    onChange={(event) =>
                      handleFoodFieldChange(index, "carbsG", event.target.value)
                    }
                    className="input-control"
                    placeholder="Carbs (g)"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={food.fatsG}
                    onChange={(event) =>
                      handleFoodFieldChange(index, "fatsG", event.target.value)
                    }
                    className="input-control"
                    placeholder="Fats (g)"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-violet-200/75">
              Notes
            </label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleFormFieldChange}
              className="input-control"
              placeholder="Balanced and high-protein meal"
            />
          </div>

          {feedback ? (
            <p className="rounded-xl border border-violet-300/35 bg-violet-500/15 px-4 py-3 text-sm text-violet-100">
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
          <h2 className="font-heading text-lg font-semibold uppercase tracking-[0.06em] text-white">
            Diet History
          </h2>

          {isLoading ? (
            <p className="mt-4 text-sm text-violet-200/60">
              Loading meal logs...
            </p>
          ) : null}

          {!isLoading && dietLogs.length === 0 ? (
            <p className="mt-4 text-sm text-violet-200/60">No meal logs yet.</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {dietLogs.map((dietLog) => (
              <article
                key={dietLog._id}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 transition-all duration-300 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-violet-100">
                      {dietLog.mealType}
                    </h3>
                    <p className="mt-1 text-xs text-violet-200/65">
                      {new Date(dietLog.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(dietLog)}
                      className="rounded-lg border border-white/20 px-2 py-1 text-xs text-violet-100 transition-all duration-300 hover:border-violet-300/60 hover:bg-violet-500/15"
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

                <ul className="mt-3 space-y-1 text-sm text-violet-100/80">
                  {(dietLog.foods || []).slice(0, 3).map((food, index) => (
                    <li key={`${dietLog._id}-${food.name}-${index}`}>
                      {food.name}: {food.calories || 0} kcal •{" "}
                      {food.quantity || 0} {food.unit || "serving"}
                    </li>
                  ))}
                  {(dietLog.foods || []).length > 3 ? (
                    <li className="text-xs text-violet-200/65">
                      + {(dietLog.foods || []).length - 3} more foods
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

export default Diet;
