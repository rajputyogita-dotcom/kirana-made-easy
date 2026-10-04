"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type ActionType =
  | "sale"
  | "restock"
  | "multi_action"
  | "none";

type AssistantAction = {
  type: ActionType;
  product_id?: number;
  product_name?: string;
  quantity?: number;
  sale_quantity?: number;
  restock_quantity?: number;
  current_stock?: number;
  new_stock?: number;
  price?: number;
  total_amount?: number;
};

type AssistantResponse = {
  success: boolean;
  message: string;
  action?: AssistantAction;
  actions?: AssistantAction[];
  requires_confirmation?: boolean;
  data?: any;
};

type HistoryItem = {
  id: number;
  command: string;
  response: string;
  time: string;
  success: boolean;
};

export default function DukaanAIPage() {
  const [command, setCommand] = useState("");
  const [response, setResponse] =
    useState<AssistantResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [listening, setListening] = useState(false);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const recognitionRef =
    useRef<any>(null);

  const [voiceSupported, setVoiceSupported] =
    useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onresult = (
      event: any
    ) => {
      const transcript =
        event.results[0][0].transcript;

      setCommand(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!voiceSupported) {
      alert(
        "Voice recognition is not supported in this browser."
      );
      return;
    }

    try {
      recognitionRef.current?.start();
    } catch {
      // Prevent duplicate start errors.
    }
  };

  const speak = (text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    window.speechSynthesis.speak(
      utterance
    );
  };

  const sendCommand = async (
    textOverride?: string
  ) => {
    const text =
      textOverride ?? command;

    if (!text.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `${API_URL}/assistant/parse`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            command: text,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.detail ||
            "Unable to understand command."
        );
      }

      setResponse(data);

      const spoken =
        data.message ||
        "I understood your request.";

      speak(spoken);

      setHistory((prev) => [
        {
          id: Date.now(),
          command: text,
          response: spoken,
          time: new Date().toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
          success: Boolean(
            data.success
          ),
        },
        ...prev.slice(0, 7),
      ]);
    } catch (error: any) {
      const message =
        error?.message ||
        "Something went wrong.";

      const errorResponse = {
        success: false,
        message,
      };

      setResponse(errorResponse);

      speak(message);

      setHistory((prev) => [
        {
          id: Date.now(),
          command: text,
          response: message,
          time: new Date().toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
          success: false,
        },
        ...prev.slice(0, 7),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    if (!response) return;

    setConfirming(true);

    try {
      if (
        response.action?.type ===
        "multi_action"
      ) {
        const action =
          response.action;

        const res = await fetch(
          `${API_URL}/assistant/execute`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              product_id:
                action.product_id,
              restock_quantity:
                action.restock_quantity ||
                0,
              sale_quantity:
                action.sale_quantity ||
                0,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.detail ||
              "Could not execute action."
          );
        }

        setResponse({
          success: true,
          message:
            data.message ||
            "Action completed successfully.",
          data,
        });

        speak(
          data.message ||
            "Done. The shop has been updated."
        );

        return;
      }

      if (
        response.action?.type ===
        "sale"
      ) {
        const action =
          response.action;

        const res = await fetch(
          `${API_URL}/sales/`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              product_id:
                action.product_id,
              quantity:
                action.quantity ||
                action.sale_quantity ||
                1,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.detail ||
              "Could not record sale."
          );
        }

        setResponse({
          success: true,
          message:
            data.message ||
            "Sale recorded successfully.",
          data,
        });

        speak(
          data.message ||
            "Sale recorded successfully."
        );

        return;
      }

      if (
        response.action?.type ===
        "restock"
      ) {
        const action =
          response.action;

        const currentStock =
          action.current_stock ?? 0;

        const quantity =
          action.quantity ||
          action.restock_quantity ||
          0;

        const newStock =
          currentStock + quantity;

        const res = await fetch(
          `${API_URL}/products/${action.product_id}/stock`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              quantity: newStock,
            }),
          }
        );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.detail ||
              "Could not update stock."
          );
        }

        setResponse({
          success: true,
          message:
            data.message ||
            "Stock updated successfully.",
          data,
        });

        speak(
          data.message ||
            "Stock updated successfully."
        );

        return;
      }

      setResponse({
        success: true,
        message:
          "There is no action waiting for confirmation.",
      });
    } catch (error: any) {
      const message =
        error?.message ||
        "Could not complete the action.";

      setResponse({
        success: false,
        message,
      });

      speak(message);
    } finally {
      setConfirming(false);
    }
  };

  const cancelAction = () => {
    setResponse({
      success: true,
      message:
        "Okay, I cancelled that action. Nothing was changed.",
    });

    speak(
      "Okay, I cancelled that action."
    );
  };

  const quickCommand = (
    text: string
  ) => {
    setCommand(text);
    sendCommand(text);
  };

  const action =
    response?.action;

  const needsConfirmation =
    Boolean(
      response?.requires_confirmation &&
        action &&
        action.type !== "none"
    );

  return (
    <main className="min-h-screen bg-[#FAF8FC] text-[#29243A]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-[#E9E4F1] bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black text-white">
              K
            </div>

            <div>
              <p className="font-bold leading-tight">
                Kirana Made Easy
              </p>

              <p className="text-xs text-[#777187]">
                Powered by DukaanAI
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-full bg-[#EDF9F3] px-3 py-2 text-xs font-bold text-[#378A68] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[#48A982]" />
              AI online
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-[#E5DFEE] bg-white px-4 py-2 text-sm font-semibold text-[#5F596D] transition hover:bg-[#F8F5FF]"
            >
              ← Dashboard
            </Link>

          </div>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[30px] bg-[#29243A] p-6 text-white shadow-[0_18px_45px_rgba(41,36,58,0.14)] lg:p-9">

          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[#7C5CFC]/25 blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#A892F7]/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black tracking-wider text-[#D3C9FF]">
                <span>✦</span>
                DUKAANAI ASSISTANT
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Run your shop
                <br />
                <span className="text-[#BFAFFF]">
                  by just speaking.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
                Tell DukaanAI what happened in your
                shop. It understands Hindi, English and
                Hinglish — then turns your words into
                real inventory, sales and billing actions.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">

                <FeatureChip text="Hindi" />
                <FeatureChip text="English" />
                <FeatureChip text="Hinglish" />
                <FeatureChip text="Voice-first" />

              </div>

            </div>

            {/* AI ORB */}
            <div className="flex justify-center lg:justify-end">

              <div className="relative flex h-52 w-52 items-center justify-center">

                <div className="absolute inset-0 rounded-full border border-[#A892F7]/20" />

                <div className="absolute inset-5 rounded-full border border-[#A892F7]/20" />

                <div className="absolute inset-10 rounded-full bg-[#7C5CFC]/20 blur-xl" />

                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#7C5CFC] shadow-[0_0_60px_rgba(124,92,252,0.5)]">

                  <span className="text-4xl">
                    ✦
                  </span>

                </div>

                <span className="absolute right-4 top-10 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/60">
                  LISTEN
                </span>

                <span className="absolute bottom-8 left-4 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/60">
                  UNDERSTAND
                </span>

                <span className="absolute right-8 bottom-3 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/60">
                  ACT
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* COMMAND AREA */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_.55fr]">

          {/* COMMAND CARD */}
          <div className="rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-sm lg:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  YOUR COMMAND
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  What should I do?
                </h2>
              </div>

              <div className="rounded-xl bg-[#F1EDFF] px-3 py-2 text-xs font-bold text-[#6B4FE0]">
                Voice + Text
              </div>

            </div>

            {/* INPUT */}
            <div className="mt-6 rounded-[24px] border border-[#E7E0EF] bg-[#FCFAFE] p-3 transition focus-within:border-[#B9A9F9] focus-within:ring-4 focus-within:ring-[#EEE9FF]">

              <textarea
                value={command}
                onChange={(e) =>
                  setCommand(e.target.value)
                }
                placeholder='Try: "Aaj paanch Maggi aaye"'
                rows={4}
                className="w-full resize-none bg-transparent px-3 py-2 text-base font-medium text-[#29243A] outline-none placeholder:text-[#B0AAB8]"
              />

              <div className="flex flex-col justify-between gap-3 border-t border-[#EEE9F2] pt-3 sm:flex-row sm:items-center">

                <p className="px-3 text-xs text-[#9B95A5]">
                  Speak naturally — no special
                  commands required.
                </p>

                <div className="flex gap-2">

                  <button
                    onClick={startListening}
                    disabled={listening}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      listening
                        ? "bg-[#FCECEC] text-[#C95D5D]"
                        : "bg-[#F1EDFF] text-[#6B4FE0] hover:bg-[#E8E1FF]"
                    }`}
                  >
                    <span>
                      {listening
                        ? "●"
                        : "🎙️"}
                    </span>

                    {listening
                      ? "Listening..."
                      : "Speak"}
                  </button>

                  <button
                    onClick={() =>
                      sendCommand()
                    }
                    disabled={
                      loading ||
                      !command.trim()
                    }
                    className="rounded-xl bg-[#7C5CFC] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/20 transition hover:bg-[#6E4FEA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Thinking..."
                      : "Ask DukaanAI →"}
                  </button>

                </div>

              </div>

            </div>

            {/* QUICK COMMANDS */}
            <div className="mt-7">

              <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                TRY A QUICK COMMAND
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">

                <QuickCommand
                  text="Aaj paanch Maggi aaye"
                  onClick={quickCommand}
                />

                <QuickCommand
                  text="Do bread bech do"
                  onClick={quickCommand}
                />

                <QuickCommand
                  text="Paanch milk aaye aur do bike"
                  onClick={quickCommand}
                />

                <QuickCommand
                  text="Add 10 Maggi to stock"
                  onClick={quickCommand}
                />

              </div>

            </div>

          </div>

          {/* HOW IT WORKS */}
          <div className="rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-sm">

            <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
              HOW IT WORKS
            </p>

            <h2 className="mt-1 text-xl font-black">
              From voice to action
            </h2>

            <div className="mt-7 space-y-5">

              <WorkflowStep
                number="01"
                title="You speak"
                text="Say what happened naturally."
              />

              <WorkflowStep
                number="02"
                title="DukaanAI understands"
                text="Intent, product and quantity are identified."
              />

              <WorkflowStep
                number="03"
                title="You confirm"
                text="Review before anything changes."
              />

              <WorkflowStep
                number="04"
                title="Shop gets updated"
                text="Stock, sales and bills update instantly."
              />

            </div>

          </div>

        </section>

        {/* RESPONSE */}
        {response && (
          <section className="mt-6 rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-sm lg:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div className="flex gap-4">

                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    response.success
                      ? "bg-[#EDF9F3]"
                      : "bg-[#FFF1F1]"
                  }`}
                >
                  {response.success
                    ? "✓"
                    : "!"}
                </div>

                <div>

                  <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                    DUKAANAI RESPONSE
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {response.success
                      ? "I understood you."
                      : "I need another try."}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#625C6C]">
                    {response.message}
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  speak(
                    response.message
                  )
                }
                className="rounded-xl border border-[#E5DFEE] px-4 py-2 text-xs font-bold text-[#625C6C] hover:bg-[#FAF8FC]"
              >
                🔊 Replay
              </button>

            </div>

            {/* ACTION PREVIEW */}
            {action &&
              action.type !== "none" && (
                <div className="mt-6 rounded-2xl bg-[#F8F5FF] p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-[#8D82A3]">
                    ACTION PREVIEW
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">

                    <ActionDetail
                      label="Product"
                      value={
                        action.product_name ||
                        "—"
                      }
                    />

                    <ActionDetail
                      label="Quantity"
                      value={String(
                        action.quantity ||
                          action.sale_quantity ||
                          action.restock_quantity ||
                          "—"
                      )}
                    />

                    <ActionDetail
                      label="Action"
                      value={
                        action.type ===
                        "multi_action"
                          ? "Stock + Sale"
                          : action.type
                      }
                    />

                  </div>

                  {action.current_stock !==
                    undefined && (
                    <div className="mt-4 rounded-xl bg-white p-4">

                      <div className="flex items-center justify-between text-sm">

                        <span className="text-[#777187]">
                          Current stock
                        </span>

                        <span className="font-black">
                          {action.current_stock}
                        </span>

                      </div>

                      <div className="my-2 h-px bg-[#EEE9F2]" />

                      <div className="flex items-center justify-between text-sm">

                        <span className="text-[#777187]">
                          After action
                        </span>

                        <span className="font-black text-[#6B4FE0]">
                          {action.new_stock ??
                            action.current_stock}
                        </span>

                      </div>

                    </div>
                  )}

                  {action.total_amount !==
                    undefined && (
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-4">

                      <span className="text-sm font-semibold text-[#777187]">
                        Bill total
                      </span>

                      <span className="text-lg font-black">
                        ₹
                        {Number(
                          action.total_amount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>
                  )}

                </div>
              )}

            {/* CONFIRMATION */}
            {needsConfirmation && (
              <div className="mt-5 rounded-2xl border border-[#E5DFFF] bg-[#F6F2FF] p-5">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="font-black">
                      Ready to update the shop?
                    </p>

                    <p className="mt-1 text-xs text-[#777187]">
                      Nothing will change until you
                      confirm.
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={
                        cancelAction
                      }
                      disabled={confirming}
                      className="rounded-xl border border-[#E5DFEE] bg-white px-4 py-3 text-sm font-bold text-[#625C6C]"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={
                        executeAction
                      }
                      disabled={confirming}
                      className="rounded-xl bg-[#7C5CFC] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/20"
                    >
                      {confirming
                        ? "Updating..."
                        : "Confirm action ✓"}
                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* SUCCESS DETAILS */}
            {response.success &&
              response.data && (
                <div className="mt-5 rounded-2xl border border-[#DDEFE6] bg-[#F4FBF7] p-5">

                  <p className="text-xs font-black uppercase tracking-wider text-[#378A68]">
                    ACTION COMPLETED
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">

                    {response.data
                      ?.remaining_stock !==
                      undefined && (
                      <SuccessDetail
                        label="Remaining stock"
                        value={
                          response.data
                            .remaining_stock
                        }
                      />
                    )}

                    {response.data?.sale
                      ?.total_amount !==
                      undefined && (
                      <SuccessDetail
                        label="Bill total"
                        value={`₹${Number(
                          response.data
                            .sale
                            .total_amount
                        ).toLocaleString(
                          "en-IN"
                        )}`}
                      />
                    )}

                    {response.data?.bill
                      ?.id !== undefined && (
                      <SuccessDetail
                        label="Bill created"
                        value={`#${response.data.bill.id}`}
                      />
                    )}

                  </div>

                </div>
              )}

          </section>
        )}

        {/* HISTORY */}
        <section className="mt-6 rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-sm lg:p-8">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                RECENT COMMANDS
              </p>

              <h2 className="mt-1 text-xl font-black">
                Conversation history
              </h2>
            </div>

            {history.length > 0 && (
              <button
                onClick={() =>
                  setHistory([])
                }
                className="text-xs font-bold text-[#9B95A5] hover:text-[#6B4FE0]"
              >
                Clear
              </button>
            )}

          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#FAF8FC] p-8 text-center">

              <div className="text-3xl">
                💬
              </div>

              <p className="mt-3 text-sm font-bold">
                Your commands will appear here.
              </p>

              <p className="mt-1 text-xs text-[#9B95A5]">
                Try speaking or typing your first
                shop command.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-3">

              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl bg-[#FAF8FC] p-4"
                >

                  <div
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      item.success
                        ? "bg-[#EDF9F3] text-[#378A68]"
                        : "bg-[#FFF1F1] text-[#C95D5D]"
                    }`}
                  >
                    {item.success
                      ? "✓"
                      : "!"}
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col justify-between gap-1 sm:flex-row">

                      <p className="text-sm font-bold">
                        "{item.command}"
                      </p>

                      <span className="text-[10px] font-semibold text-[#A19BAA]">
                        {item.time}
                      </span>

                    </div>

                    <p className="mt-1 text-xs leading-5 text-[#777187]">
                      {item.response}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* FOOTER CTA */}
        <section className="mt-6 rounded-[28px] bg-[#F1EDFF] p-6 lg:p-8">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>

              <div className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#6B4FE0]">
                ✦ SMART SHOPPING
              </div>

              <h2 className="mt-3 text-2xl font-black">
                Your shop. Your voice.
              </h2>

              <p className="mt-2 text-sm text-[#777187]">
                No complicated menus. Just tell
                DukaanAI what you need.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                href="/inventory"
                className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#625C6C] shadow-sm"
              >
                Inventory
              </Link>

              <Link
                href="/sales"
                className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#625C6C] shadow-sm"
              >
                Sales
              </Link>

              <Link
                href="/analytics"
                className="rounded-xl bg-[#7C5CFC] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/20"
              >
                Analytics →
              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/* ---------------------------------------------------------
   SMALL COMPONENTS
--------------------------------------------------------- */

function FeatureChip({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70">
      {text}
    </span>
  );
}

function QuickCommand({
  text,
  onClick,
}: {
  text: string;
  onClick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(text)}
      className="rounded-xl border border-[#E8E1F1] bg-white px-4 py-3 text-left text-xs font-semibold text-[#625C6C] transition hover:border-[#CFC3F8] hover:bg-[#F8F5FF] hover:text-[#6B4FE0]"
    >
      "{text}"
    </button>
  );
}

function WorkflowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFF] text-[10px] font-black text-[#6B4FE0]">
        {number}
      </div>

      <div>
        <p className="text-sm font-bold">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#9B95A5]">
          {text}
        </p>
      </div>

    </div>
  );
}

function ActionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">

      <p className="text-[10px] font-black uppercase tracking-wider text-[#A19BAA]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-black">
        {value}
      </p>

    </div>
  );
}

function SuccessDetail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-4">

      <p className="text-[10px] font-black uppercase tracking-wider text-[#8BA99A]">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-[#29243A]">
        {value}
      </p>

    </div>
  );
}