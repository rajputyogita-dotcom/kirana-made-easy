"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password should contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    const account = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "kme_account",
      JSON.stringify(account)
    );

    localStorage.setItem(
      "kme_session",
      "true"
    );

    setTimeout(() => {
      router.push("/setup");
    }, 400);
  }

  return (
    <main className="min-h-screen bg-[#FAF8FC]">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}
        <section className="hidden bg-[#29243A] p-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div>
            <Link
              href="/signup"
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

            <div className="mt-24 max-w-xl">

              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#CFC4FF]">
                ✦ BUILT FOR KIRANA STORES
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.05]">
                Your shop.
                <br />
                Your voice.
                <br />
                <span className="text-[#BDAEFF]">
                  Made easy.
                </span>
              </h1>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
                Manage inventory, sales, bills and
                Udhaar — with DukaanAI helping you
                run your shop by simply speaking.
              </p>

            </div>
          </div>

          <div className="text-xs text-white/35">
            Hindi • English • Hinglish
          </div>

        </section>

        {/* RIGHT */}
        <section className="flex items-center justify-center px-5 py-10">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
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

            <div>

              <p className="text-sm font-bold text-[#7C5CFC]">
                GET STARTED
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#29243A]">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#777187]">
                Start managing your shop smarter.
              </p>

            </div>

            <form
              onSubmit={handleSignup}
              className="mt-8 space-y-5"
            >

              <Field
                label="Your name"
                placeholder="e.g. Yogita Rajput"
                value={name}
                onChange={setName}
              />

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
                placeholder="At least 6 characters"
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
                  ? "Creating account..."
                  : "Create account →"}
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-black text-[#6B4FE0] hover:underline"
              >
                Log in
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