"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("kme_user");

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setEmail(parsed.email || "");
      } catch {}
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(
        email.trim().toLowerCase(),
        password
      );

      localStorage.setItem(
        "kme_user",
        JSON.stringify(result.user)
      );

      localStorage.setItem(
        "kme_session",
        "true"
      );

      const setupDone =
        localStorage.getItem("kme_setup_complete");

      if (setupDone === "true") {
        router.push("/dashboard");
      } else {
        router.push("/setup");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8FC]">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* BRAND PANEL */}
        <section className="hidden bg-[#29243A] p-10 text-white lg:flex lg:flex-col lg:justify-between">

          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black">
              K
            </div>

            <div>
              <p className="font-black">
                Kirana Made Easy
              </p>

              <p className="text-xs text-white/45">
                Powered by DukaanAI
              </p>
            </div>
          </Link>

          <div>

            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7C5CFC]/20 text-3xl">
              🎙️
            </div>

            <h1 className="text-5xl font-black leading-tight">
              Welcome
              <br />
              <span className="text-[#BDAEFF]">
                back.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
              Pick up right where you left off.
              Your inventory, sales, Udhaar and
              DukaanAI are waiting.
            </p>

          </div>

          <p className="text-xs text-white/30">
            Simple shop management. Powered by AI.
          </p>

        </section>

        {/* LOGIN */}
        <section className="flex items-center justify-center px-5 py-10">

          <div className="w-full max-w-md">

            {/* MOBILE BRAND */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black text-white">
                K
              </div>

              <div>
                <p className="font-black">
                  Kirana Made Easy
                </p>

                <p className="text-xs text-[#9B95A5]">
                  Powered by DukaanAI
                </p>
              </div>

            </div>

            <p className="text-sm font-bold text-[#7C5CFC]">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Log in to your shop
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#777187]">
              Continue managing your store with
              DukaanAI.
            </p>

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >

              <Field
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
              />

              <Field
                label="Password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={setPassword}
              />

              {error && (
                <div className="rounded-xl border border-[#F2D1D1] bg-[#FFF4F4] px-4 py-3 text-sm font-semibold text-[#C95D5D]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#7C5CFC] py-3.5 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/20 transition hover:bg-[#6E4FEA] disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Log in →"}
              </button>

            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E8E1F1]" />

              <span className="text-xs text-[#A19BAA]">
                OR
              </span>

              <div className="h-px flex-1 bg-[#E8E1F1]" />
            </div>

            <p className="text-center text-sm text-[#777187]">
              New to Kirana Made Easy?{" "}

              <Link
                href="/signup"
                className="font-black text-[#6B4FE0] hover:underline"
              >
                Create an account
              </Link>
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#777187]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E5DFEE] bg-white px-4 py-3.5 text-sm font-medium text-[#29243A] outline-none transition placeholder:text-[#B0AAB8] focus:border-[#A997F5] focus:ring-4 focus:ring-[#EEE9FF]"
      />

    </div>
  );
}