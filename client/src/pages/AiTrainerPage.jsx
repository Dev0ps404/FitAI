import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "../components/common/EmptyState";
import SectionCard from "../components/common/SectionCard";
import { getApiErrorMessage } from "../services/apiClient";
import { aiApi } from "../services/fitnessApi";
import { formatDateLabel } from "../utils/formatters";

function AiTrainerPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: sessionsData } = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: () => aiApi.listSessions(),
  });

  const { data: recommendationsData } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: () => aiApi.getRecommendations(),
  });

  const sessions = sessionsData?.sessions || [];
  const selectedSessionId = activeSessionId || String(sessions[0]?._id || "");

  const { data: activeSessionData } = useQuery({
    queryKey: ["ai-session", selectedSessionId],
    queryFn: () => aiApi.getSession(selectedSessionId),
    enabled: Boolean(selectedSessionId),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload) => aiApi.sendMessage(payload),
    onSuccess: async (data) => {
      const nextSessionId = data?.sessionId || selectedSessionId;

      setFeedback("Message delivered to FitAI coach.");
      setMessageInput("");

      if (nextSessionId) {
        setActiveSessionId(String(nextSessionId));
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ai-sessions"] }),
        queryClient.invalidateQueries({
          queryKey: ["ai-session", String(nextSessionId)],
        }),
      ]);
    },
    onError: (error) => {
      setFeedback(getApiErrorMessage(error, "Unable to send message right now."));
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId) => aiApi.deleteSession(sessionId),
    onSuccess: async () => {
      setFeedback("Session deleted.");
      setActiveSessionId("");
      await queryClient.invalidateQueries({ queryKey: ["ai-sessions"] });
    },
  });

  const recommendations = recommendationsData?.recommendations || [];
  const activeSession = activeSessionData?.session || null;
  const messages = useMemo(() => activeSession?.messages || [], [activeSession]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedMessage = messageInput.trim();

    if (trimmedMessage.length < 2) {
      setFeedback("Enter at least 2 characters to chat.");
      return;
    }

    setFeedback("");
    sendMessageMutation.mutate({
      message: trimmedMessage,
      sessionId: selectedSessionId || undefined,
    });
  }

  async function handleDeleteSession(sessionId) {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      setFeedback(getApiErrorMessage(error, "Unable to delete session."));
    }
  }

  return (
    <section className="space-y-5">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-4 inline-flex">AI Coach</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.08em] text-white md:text-4xl">
          Context-Aware Fitness Assistant
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Chat with FitAI, manage session history, and review personalized
          recommendation signals.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-5">
          <SectionCard title="Sessions" description="Your recent AI conversation threads.">
            {sessions.length === 0 ? (
              <EmptyState
                title="No sessions yet"
                description="Start a message to create your first AI coaching session."
              />
            ) : (
              <div className="grid gap-3">
                {sessions.map((session) => {
                  const isActive = String(session._id) === String(selectedSessionId);

                  return (
                    <button
                      key={session._id}
                      type="button"
                      onClick={() => setActiveSessionId(String(session._id))}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left transition",
                        isActive
                          ? "border-neon-cyan bg-neon-cyan/10"
                          : "border-slate-700 bg-slate-900/40 hover:border-slate-500",
                      ].join(" ")}
                    >
                      <p className="font-heading text-sm uppercase tracking-[0.05em] text-white">
                        {session.title || "Untitled Session"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Updated {formatDateLabel(session.updatedAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Recommendations" description="Signals generated from your activity.">
            {recommendations.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description="Log workouts and progress entries to unlock smarter AI guidance."
              />
            ) : (
              <div className="grid gap-3">
                {recommendations.map((item) => (
                  <article
                    key={item.type}
                    className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-neon-lime">
                      {item.type}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{item.message}</p>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Coach Chat" description="Ask about training plans, diet strategy, or recovery.">
          <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {messages.length === 0 ? (
              <EmptyState
                title="No messages yet"
                description="Send a prompt to start AI coaching in this session."
              />
            ) : (
              messages.map((message, index) => {
                const isUserMessage = message.role === "user";

                return (
                  <article
                    key={`${message.role}-${index}`}
                    className={[
                      "rounded-xl border p-4",
                      isUserMessage
                        ? "border-neon-cyan/40 bg-neon-cyan/10"
                        : "border-slate-700 bg-slate-900/40",
                    ].join(" ")}
                  >
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {isUserMessage ? "You" : "FitAI"}
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-slate-100">{message.content}</p>
                  </article>
                );
              })
            )}
          </div>

          <form className="space-y-3" onSubmit={handleSendMessage}>
            <textarea
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
              placeholder="Ask FitAI: Build a 4-day workout split for fat loss with knee-safe alternatives."
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={sendMessageMutation.isPending}
                className="rounded-full border border-neon-cyan bg-neon-cyan/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-cyan transition hover:bg-neon-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
              </button>

              {selectedSessionId ? (
                <button
                  type="button"
                  disabled={deleteSessionMutation.isPending}
                  onClick={() => handleDeleteSession(selectedSessionId)}
                  className="rounded-full border border-neon-amber/50 bg-neon-amber/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-amber transition hover:bg-neon-amber/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Delete Session
                </button>
              ) : null}
            </div>
          </form>

          {feedback ? (
            <p className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-200">
              {feedback}
            </p>
          ) : null}
        </SectionCard>
      </div>
    </section>
  );
}

export default AiTrainerPage;
