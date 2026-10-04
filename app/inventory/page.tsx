"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type ActionType = "sale" | "restock";

type AssistantAction = {
  type: ActionType;
  quantity: number;
  product_id: number;
  product_name: string;
};

type AssistantResponse = {
  message: string;
  intent?: string;
  product?: {
    id: number;
    name: string;
    stock: number;
    minimum_stock: number;
    reorder_quantity?: number;
    price?: number;
  };
  quantity?: number;
  new_stock?: number;
  total_amount?: number;
  low_stock?: boolean;
  actions?: AssistantAction[];
  restock_quantity?: number;
  sale_quantity?: number;
};

type HistoryItem = {
  command: string;
  message: string;
  success: boolean;
};

const API_URL = "http://127.0.0.1:8000";

export default function DukaanAIPage() {
  const [command, setCommand] = useState("");
  const [response, setResponse] =
    useState<AssistantResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const [voiceLanguage, setVoiceLanguage] = useState("hi-IN");

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const recognitionRef = useRef<any>(null);
  const lastSpokenRef = useRef("");

  /* ---------------------------------------------------------
     VOICE OUTPUT
  --------------------------------------------------------- */

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;
      if (!text.trim()) return;

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang = voiceLanguage;
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [voiceLanguage]
  );

  const speakOnce = useCallback(
    (text: string) => {
      if (lastSpokenRef.current === text) return;

      lastSpokenRef.current = text;
      speak(text);
    },
    [speak]
  );

  /* ---------------------------------------------------------
     SPOKEN UNDERSTANDING
  --------------------------------------------------------- */

  const getSpokenUnderstanding = useCallback(
    (data: AssistantResponse) => {
      const productName =
        data.product?.name || "product";

      const newStock =
        data.new_stock ??
        data.product?.stock ??
        0;

      if (
        data.intent === "multi_action" &&
        data.actions
      ) {
        const restockAction =
          data.actions.find(
            (action) => action.type === "restock"
          );

        const saleAction =
          data.actions.find(
            (action) => action.type === "sale"
          );

        const restockQuantity =
          restockAction?.quantity || 0;

        const saleQuantity =
          saleAction?.quantity || 0;

        if (voiceLanguage === "hi-IN") {
          return `Samajh gaya. ${restockQuantity} ${productName} stock mein aaye hain aur ${saleQuantity} ${productName} bike hain. Final stock ${newStock} hai. Kya main confirm karun?`;
        }

        return `Got it. ${restockQuantity} ${productName} were added and ${saleQuantity} were sold. Final stock will be ${newStock}. Should I confirm?`;
      }

      if (
        data.intent === "restock" ||
        data.actions?.some(
          (action) => action.type === "restock"
        )
      ) {
        const quantity =
          data.quantity ||
          data.restock_quantity ||
          data.actions?.find(
            (action) => action.type === "restock"
          )?.quantity ||
          0;

        if (voiceLanguage === "hi-IN") {
          return `Samajh gaya. ${quantity} ${productName} stock mein add kar raha hoon. Naya stock ${newStock} hoga. Kya main confirm karun?`;
        }

        return `Got it. I am adding ${quantity} ${productName} to stock. New stock will be ${newStock}. Should I confirm?`;
      }

      if (
        data.intent === "sale" ||
        data.actions?.some(
          (action) => action.type === "sale"
        )
      ) {
        const quantity =
          data.quantity ||
          data.sale_quantity ||
          data.actions?.find(
            (action) => action.type === "sale"
          )?.quantity ||
          0;

        if (voiceLanguage === "hi-IN") {
          return `Samajh gaya. ${quantity} ${productName} bik gaye hain. Naya stock ${newStock} hoga. Kya main confirm karun?`;
        }

        return `Got it. ${quantity} ${productName} were sold. New stock will be ${newStock}. Should I confirm?`;
      }

      return data.message;
    },
    [voiceLanguage]
  );

  /* ---------------------------------------------------------
     SEND COMMAND
  --------------------------------------------------------- */

  const sendCommandText = useCallback(
    async (text: string) => {
      const cleanText = text.trim();

      if (!cleanText || loading) return;

      setCommand(cleanText);
      setLoading(true);
      setConfirming(false);
      setResponse(null);
      stopSpeaking();

      try {
        const apiResponse = await fetch(
          `${API_URL}/assistant/parse`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              command: cleanText,
            }),
          }
        );

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(
            data?.detail ||
              "I could not understand that command."
          );
        }

        setResponse(data);
        setConfirming(true);

        const spokenText =
          getSpokenUnderstanding(data);

        speakOnce(spokenText);
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          "Something went wrong.";

        setResponse({
          message: errorMessage,
        });

        setConfirming(false);

        setHistory((previous) => [
          {
            command: cleanText,
            message: errorMessage,
            success: false,
          },
          ...previous,
        ].slice(0, 5));

        speakOnce(
          voiceLanguage === "hi-IN"
            ? `Maaf kijiye. ${errorMessage}`
            : `Sorry. ${errorMessage}`
        );
      } finally {
        setLoading(false);
      }
    },
    [
      getSpokenUnderstanding,
      loading,
      speakOnce,
      stopSpeaking,
      voiceLanguage,
    ]
  );

  const sendCommand = () => {
    sendCommandText(command);
  };

  /* ---------------------------------------------------------
     SPEECH RECOGNITION
  --------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = voiceLanguage;

    recognition.onstart = () => {
      setListening(true);
      stopSpeaking();
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      if (!transcript.trim()) return;

      setCommand(transcript);

      setTimeout(() => {
        sendCommandText(transcript);
      }, 250);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}

      recognitionRef.current = null;
    };
  }, [sendCommandText, stopSpeaking, voiceLanguage]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert(
        "Voice input is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    if (listening) {
      try {
        recognitionRef.current.stop();
      } catch {}

      setListening(false);
      return;
    }

    try {
      stopSpeaking();

      recognitionRef.current.lang =
        voiceLanguage;

      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  };

  /* ---------------------------------------------------------
     CONFIRM ACTION
  --------------------------------------------------------- */

  const confirmAction = async () => {
    if (!response) return;

    setLoading(true);
    setConfirming(false);
    stopSpeaking();

    try {
      let result: any;

      if (
        response.intent === "multi_action" &&
        response.product &&
        response.actions
      ) {
        const restockAction =
          response.actions.find(
            (action) => action.type === "restock"
          );

        const saleAction =
          response.actions.find(
            (action) => action.type === "sale"
          );

        const executeResponse =
          await fetch(
            `${API_URL}/assistant/execute`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                product_id:
                  response.product.id,
                restock_quantity:
                  restockAction?.quantity || 0,
                sale_quantity:
                  saleAction?.quantity || 0,
              }),
            }
          );

        result =
          await executeResponse.json();

        if (!executeResponse.ok) {
          throw new Error(
            result?.detail ||
              "Action could not be completed."
          );
        }
      }

      else if (
        response.intent === "sale" &&
        response.product
      ) {
        const quantity =
          response.quantity || 0;

        const saleResponse =
          await fetch(`${API_URL}/sales/`, {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              product_id:
                response.product.id,
              quantity,
            }),
          });

        result =
          await saleResponse.json();

        if (!saleResponse.ok) {
          throw new Error(
            result?.detail ||
              "Sale could not be completed."
          );
        }
      }

      else if (
        response.intent === "restock" &&
        response.product
      ) {
        const quantity =
          response.quantity || 0;

        const currentStock =
          response.product.stock || 0;

        const newStock =
          currentStock + quantity;

        const stockResponse =
          await fetch(
            `${API_URL}/products/${response.product.id}/stock`,
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

        result =
          await stockResponse.json();

        if (!stockResponse.ok) {
          throw new Error(
            result?.detail ||
              "Stock could not be updated."
          );
        }
      } else {
        throw new Error(
          "There is no action to confirm."
        );
      }

      const successMessage =
        result?.message ||
        "Action completed successfully.";

      setResponse({
        ...response,
        message: successMessage,
        new_stock:
          result?.remaining_stock ??
          result?.new_stock ??
          result?.product?.stock ??
          response.new_stock,
        low_stock:
          result?.low_stock ??
          response.low_stock,
      });

      setHistory((previous) => [
        {
          command,
          message: successMessage,
          success: true,
        },
        ...previous,
      ].slice(0, 5));

      speak(`Done! ${successMessage}`);
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        "Action could not be completed.";

      setResponse({
        ...response,
        message: errorMessage,
      });

      setHistory((previous) => [
        {
          command,
          message: errorMessage,
          success: false,
        },
        ...previous,
      ].slice(0, 5));

      speak(
        voiceLanguage === "hi-IN"
          ? `Maaf kijiye. ${errorMessage}`
          : `Sorry. ${errorMessage}`
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------------------
     CANCEL
  --------------------------------------------------------- */

  const cancelAction = () => {
    stopSpeaking();
    setConfirming(false);

    const message =
      voiceLanguage === "hi-IN"
        ? "Theek hai, maine action cancel kar diya."
        : "Okay, I cancelled the action.";

    setResponse({
      message,
    });
  };

  /* ---------------------------------------------------------
     EXAMPLES
  --------------------------------------------------------- */

  const examples = [
    {
      icon: "📦",
      title: "Restock",
      text: "Aaj paanch Maggi aaye",
    },
    {
      icon: "🛒",
      title: "Sale",
      text: "Do bread bech do",
    },
    {
      icon: "🔄",
      title: "Mixed update",
      text: "Paanch milk aaye aur do bike",
    },
    {
      icon: "＋",
      title: "English",
      text: "Add 10 Maggi to stock",
    },
    {
      icon: "₹",
      title: "English sale",
      text: "Sell 3 Maggi",
    },
  ];

  const useExample = (example: string) => {
    setCommand(example);
    sendCommandText(example);
  };

  /* ---------------------------------------------------------
     CLEANUP
  --------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */

  return (
    <main className="min-h-screen bg-[#FAF8FC] text-[#29243A]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-[#E9E4F1] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black text-white shadow-sm shadow-[#7C5CFC]/20">
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

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-[#F4EFFF] px-3 py-1.5 text-xs font-bold text-[#6B4FE0] sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C5CFC]" />
              AI Assistant
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-[#E8E3EF] bg-white px-4 py-2 text-sm font-semibold text-[#5F596D] transition hover:border-[#D8CEF7] hover:bg-[#F8F5FF]"
            >
              ← Dashboard
            </Link>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-[0_12px_40px_rgba(70,48,120,0.06)]">

          <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#EEE9FF] blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#F7EFFF] blur-3xl" />

          <div className="relative px-6 py-10 lg:px-10 lg:py-12">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD4FA] bg-[#F4EFFF] px-3 py-1.5 text-xs font-black tracking-wide text-[#6B4FE0]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C5CFC]" />
              DUKAANAI · AI SHOP ASSISTANT
            </div>

            <div className="mt-6 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

              <div className="max-w-3xl">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
                  Run your shop.
                  <br />
                  <span className="text-[#7C5CFC]">
                    Just by speaking.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-[#777187] sm:text-lg">
                  Tell DukaanAI what happened in your
                  shop. It understands Hindi, English
                  and Hinglish and turns your words into
                  real shop actions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[430px]">
                <Feature icon="🎙️" text="Voice-first" />
                <Feature icon="🇮🇳" text="Hindi" />
                <Feature icon="🇬🇧" text="English" />
                <Feature icon="⚡" text="Fast" />
              </div>

            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">

          {/* COMMAND PANEL */}
          <div className="rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-[0_10px_30px_rgba(70,48,120,0.05)] lg:p-7">

            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEE9FF] text-sm">
                    ✨
                  </span>

                  <p className="text-xs font-black tracking-wider text-[#7C5CFC]">
                    ASK DUKAANAI
                  </p>
                </div>

                <h2 className="mt-3 text-2xl font-black">
                  What happened in your shop?
                </h2>

                <p className="mt-1 text-sm text-[#777187]">
                  Speak naturally. No special commands needed.
                </p>
              </div>

              <div
                className={`hidden rounded-full px-3 py-2 text-[11px] font-black tracking-wide sm:block ${
                  listening
                    ? "bg-[#FFF0F0] text-[#D85D5D]"
                    : loading
                    ? "bg-[#FFF7E7] text-[#B57A17]"
                    : speaking
                    ? "bg-[#F1EDFF] text-[#6B4FE0]"
                    : "bg-[#EDF9F3] text-[#378A68]"
                }`}
              >
                {listening
                  ? "● LISTENING"
                  : loading
                  ? "● THINKING"
                  : speaking
                  ? "● SPEAKING"
                  : "● READY"}
              </div>

            </div>

            {/* INPUT */}
            <div className="relative mt-6">

              <textarea
                value={command}
                onChange={(e) =>
                  setCommand(e.target.value)
                }
                placeholder='Try: "Aaj paanch Maggi aaye aur do bik gaye"'
                className="min-h-[165px] w-full resize-none rounded-2xl border border-[#E7E1EF] bg-[#FBFAFD] p-5 text-base leading-7 outline-none transition placeholder:text-[#AAA4B4] focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
              />

              <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg border border-[#ECE8F1] bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#AAA4B4] shadow-sm">
                Natural language
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <button
                onClick={toggleVoice}
                className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-4 font-bold transition ${
                  listening
                    ? "bg-[#E87575] text-white shadow-lg shadow-[#E87575]/20"
                    : "border border-[#E5DFEE] bg-white text-[#403A4D] hover:border-[#CFC2F5] hover:bg-[#F8F5FF]"
                }`}
              >
                <span className="text-xl">
                  {listening ? "⏹" : "🎙️"}
                </span>

                {listening
                  ? "Listening..."
                  : "Speak to DukaanAI"}
              </button>

              <button
                onClick={sendCommand}
                disabled={
                  loading ||
                  !command.trim()
                }
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#7C5CFC] px-5 py-4 font-bold text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Understanding...
                  </>
                ) : (
                  <>
                    ✨ Understand Command
                  </>
                )}
              </button>

            </div>

            {/* LANGUAGE */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

              <label className="flex items-center gap-2 text-sm font-medium text-[#777187]">
                Voice language

                <select
                  value={voiceLanguage}
                  onChange={(e) => {
                    stopSpeaking();
                    setVoiceLanguage(e.target.value);
                    lastSpokenRef.current = "";
                  }}
                  className="rounded-lg border border-[#E5DFEE] bg-white px-3 py-1.5 text-sm font-semibold text-[#403A4D] outline-none focus:border-[#B9A9F3]"
                >
                  <option value="hi-IN">
                    Hindi / Hinglish
                  </option>

                  <option value="en-IN">
                    English
                  </option>
                </select>
              </label>

              {speaking && (
                <div className="flex items-center gap-2 rounded-full bg-[#F1EDFF] px-3 py-2 text-xs font-bold text-[#6B4FE0]">
                  <span className="flex items-end gap-0.5">
                    <span className="h-2 w-1 animate-pulse rounded-full bg-[#7C5CFC]" />
                    <span className="h-4 w-1 animate-pulse rounded-full bg-[#7C5CFC] [animation-delay:100ms]" />
                    <span className="h-3 w-1 animate-pulse rounded-full bg-[#7C5CFC] [animation-delay:200ms]" />
                    <span className="h-5 w-1 animate-pulse rounded-full bg-[#7C5CFC] [animation-delay:300ms]" />
                  </span>
                  DukaanAI is speaking
                </div>
              )}

            </div>

            {/* EXAMPLES */}
            <div className="mt-8">

              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  Try a command
                </p>

                <span className="text-xs text-[#AAA4B4]">
                  Tap to use
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">

                {examples.map((example) => (
                  <button
                    key={example.text}
                    onClick={() =>
                      useExample(example.text)
                    }
                    className="flex items-center gap-3 rounded-2xl border border-[#E9E4F0] bg-[#FDFCFE] p-3 text-left transition hover:-translate-y-0.5 hover:border-[#D4C8F7] hover:bg-[#F8F5FF]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0ECF9] text-base">
                      {example.icon}
                    </span>

                    <span>
                      <span className="block text-xs font-bold text-[#7C5CFC]">
                        {example.title}
                      </span>

                      <span className="mt-0.5 block text-sm text-[#625C6C]">
                        {example.text}
                      </span>
                    </span>
                  </button>
                ))}

              </div>
            </div>

          </div>

          {/* WORKFLOW PANEL */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#29243A] p-6 text-white shadow-[0_12px_35px_rgba(41,36,58,0.14)]">

            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#7C5CFC]/20 blur-3xl" />

            <div className="relative">

              <div className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-[#C9BCFF]">
                VOICE-FIRST WORKFLOW
              </div>

              <h2 className="mt-4 text-2xl font-black">
                Just speak.
                <br />
                <span className="text-[#C9BCFF]">
                  We handle the rest.
                </span>
              </h2>

              <div className="mt-8 space-y-6">

                {[
                  [
                    "01",
                    "Speak naturally",
                    "Hindi, English or Hinglish.",
                  ],
                  [
                    "02",
                    "AI understands",
                    "Your words become a structured shop action.",
                  ],
                  [
                    "03",
                    "You confirm",
                    "Important changes never happen silently.",
                  ],
                  [
                    "04",
                    "Shop gets updated",
                    "Stock, sales, bills and alerts stay synced.",
                  ],
                ].map(
                  ([number, title, description]) => (
                    <div
                      key={number}
                      className="flex gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7C5CFC]/20 text-xs font-black text-[#C9BCFF] ring-1 ring-white/10">
                        {number}
                      </div>

                      <div>
                        <p className="font-bold">
                          {title}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-white/50">
                          {description}
                        </p>
                      </div>
                    </div>
                  )
                )}

              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[10px] font-black tracking-widest text-white/40">
                  REAL EXAMPLE
                </p>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  “Aaj 5 Maggi packets aaye aur 2 bik gaye.”
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#C9BCFF]">
                  <span>→</span>
                  <span>Stock updated safely</span>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* RESPONSE */}
        {response && (
          <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-[0_10px_30px_rgba(70,48,120,0.05)]">

            <div className="border-b border-[#EEEAF3] p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEE9FF] text-sm">
                      🤖
                    </span>

                    <p className="text-xs font-black uppercase tracking-wider text-[#7C5CFC]">
                      DUKAANAI RESPONSE
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    {confirming
                      ? "Check before updating"
                      : "Action status"}
                  </h2>
                </div>

                <div
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    confirming
                      ? "bg-[#FFF7E7] text-[#B57A17]"
                      : response.message
                          ?.toLowerCase()
                          .includes("error")
                      ? "bg-[#FFF0F0] text-[#C95757]"
                      : "bg-[#EDF9F3] text-[#378A68]"
                  }`}
                >
                  {confirming
                    ? "AWAITING CONFIRMATION"
                    : "PROCESSED"}
                </div>

              </div>
            </div>

            <div className="p-6">

              {/* AI MESSAGE */}
              <div className="rounded-2xl border border-[#ECE7F2] bg-[#FAF8FC] p-5">

                <div className="flex gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEE9FF] text-xl">
                    🤖
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black">
                        DukaanAI
                      </p>

                      {response.intent && (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#928B9E] ring-1 ring-[#ECE7F2]">
                          {response.intent.replace(
                            "_",
                            " "
                          )}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 leading-7 text-[#625C6C]">
                      {response.message}
                    </p>
                  </div>

                </div>

              </div>

              {/* PRODUCT DETAILS */}
              {response.product && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <Detail
                    label="Product"
                    value={response.product.name}
                  />

                  <Detail
                    label="Current stock"
                    value={String(
                      response.product.stock
                    )}
                  />

                  <Detail
                    label="After action"
                    value={String(
                      response.new_stock ??
                        response.product.stock
                    )}
                  />

                </div>
              )}

              {/* ACTION BREAKDOWN */}
              {response.actions &&
                response.actions.length > 0 && (
                  <div className="mt-5">

                    <p className="mb-3 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                      Action breakdown
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">

                      {response.actions.map(
                        (action, index) => (
                          <div
                            key={`${action.type}-${index}`}
                            className="rounded-2xl border border-[#E9E4F0] bg-white p-4"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl">
                                {action.type ===
                                "sale"
                                  ? "🛒"
                                  : "📦"}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  action.type ===
                                  "sale"
                                    ? "bg-[#EEF5FF] text-[#4777B8]"
                                    : "bg-[#F1EDFF] text-[#6B4FE0]"
                                }`}
                              >
                                {action.type ===
                                "sale"
                                  ? "SALE"
                                  : "RESTOCK"}
                              </span>
                            </div>

                            <p className="mt-3 font-bold">
                              {action.quantity} ×{" "}
                              {action.product_name}
                            </p>

                            <p className="mt-1 text-sm text-[#777187]">
                              {action.type ===
                              "sale"
                                ? "Will reduce stock"
                                : "Will increase stock"}
                            </p>
                          </div>
                        )
                      )}

                    </div>
                  </div>
                )}

              {/* CONFIRMATION */}
              {confirming && (
                <div className="mt-6 rounded-2xl border border-[#F0D99B] bg-[#FFF9EC] p-4">

                  <div className="flex gap-3">
                    <span className="text-xl">
                      ⚠️
                    </span>

                    <div>
                      <p className="font-bold text-[#765A16]">
                        Please review before confirming
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#896D25]">
                        DukaanAI will update your
                        shop data only after you
                        confirm this action.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                    <button
                      onClick={confirmAction}
                      disabled={loading}
                      className="flex-1 rounded-2xl bg-[#48A982] px-5 py-3.5 font-bold text-white transition hover:bg-[#3C9874] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading
                        ? "Updating shop..."
                        : "✓ Confirm & Update Shop"}
                    </button>

                    <button
                      onClick={cancelAction}
                      disabled={loading}
                      className="rounded-2xl border border-[#E5DFEE] bg-white px-6 py-3.5 font-bold text-[#5F596D] transition hover:bg-[#FAF8FC]"
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              )}

              {/* LOW STOCK */}
              {response.low_stock && (
                <div className="mt-5 rounded-2xl border border-[#F0D99B] bg-[#FFF9EC] p-4">

                  <div className="flex gap-3">
                    <span className="text-xl">
                      ⚠️
                    </span>

                    <div>
                      <p className="font-bold text-[#765A16]">
                        Low-stock alert
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#896D25]">
                        This product is below its
                        minimum stock level. Check
                        Inventory for the suggested
                        restock quantity.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* REPLAY */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() =>
                    speak(response.message)
                  }
                  className="rounded-xl border border-[#E5DFEE] bg-white px-3 py-2 text-sm font-semibold text-[#686273] transition hover:bg-[#FAF8FC]"
                >
                  🔊 Replay response
                </button>
              </div>

            </div>
          </section>
        )}

        {/* HISTORY */}
        {history.length > 0 && (
          <section className="mt-6 rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-[0_10px_30px_rgba(70,48,120,0.05)]">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  RECENT ACTIVITY
                </p>

                <h2 className="mt-1 text-xl font-black">
                  DukaanAI command history
                </h2>
              </div>

              <span className="rounded-full bg-[#F1EEF6] px-3 py-1 text-xs font-bold text-[#777187]">
                Last {history.length}
              </span>
            </div>

            <div className="mt-5 divide-y divide-[#F0ECF4]">

              {history.map((item, index) => (
                <div
                  key={`${item.command}-${index}`}
                  className="flex gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      item.success
                        ? "bg-[#EDF9F3] text-[#378A68]"
                        : "bg-[#FFF0F0] text-[#C95757]"
                    }`}
                  >
                    {item.success
                      ? "✓"
                      : "!"}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-[#403A4D]">
                      {item.command}
                    </p>

                    <p className="mt-1 text-sm text-[#777187]">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </section>
        )}

        {/* QUICK NAVIGATION */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <QuickLink
            href="/inventory"
            icon="📦"
            title="Inventory"
            description="Manage products & stock"
          />

          <QuickLink
            href="/sales"
            icon="💰"
            title="Sales"
            description="Record shop sales"
          />

          <QuickLink
            href="/bills"
            icon="🧾"
            title="Bills"
            description="View generated bills"
          />

          <QuickLink
            href="/notifications"
            icon="🔔"
            title="Alerts"
            description="View shop notifications"
          />

        </section>

      </div>
    </main>
  );
}

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */

function Feature({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E1F1] bg-white/80 p-3 text-center shadow-sm">
      <div className="text-xl">{icon}</div>

      <p className="mt-1 text-xs font-bold text-[#625C6C]">
        {text}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E1F1] bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#9B95A5]">
        {label}
      </p>

      <p className="mt-2 font-bold text-[#403A4D]">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#E8E1F1] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D4C8F7] hover:bg-[#FCFAFF] hover:shadow-md"
    >
      <div className="flex items-center gap-3">

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1EDFF] text-xl">
          {icon}
        </span>

        <div>
          <p className="font-bold text-[#403A4D]">
            {title}
          </p>

          <p className="mt-0.5 text-sm text-[#777187]">
            {description}
          </p>
        </div>

      </div>
    </Link>
  );
}