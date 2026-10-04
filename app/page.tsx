"use client";

import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const account = localStorage.getItem("kme_account");

    if (account) {
      window.location.replace("/login");
    } else {
      window.location.replace("/signup");
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF8FC] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7C5CFC] text-2xl font-black text-white shadow-lg">
          K
        </div>

        <h1 className="mt-6 text-2xl font-bold text-[#29243A]">
          Kirana Made Easy
        </h1>

        <p className="mt-2 text-sm text-[#777187]">
          Your smart digital partner for everyday shop management.
        </p>

        {/* Fallback buttons */}
        <div className="mt-8 space-y-3">

          <a
            href="/signup"
            className="block w-full rounded-2xl bg-[#7C5CFC] px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
          >
            Create New Account
          </a>

          <a
            href="/login"
            className="block w-full rounded-2xl border border-[#E5DFEE] bg-white px-5 py-4 text-sm font-bold text-[#29243A] shadow-sm transition hover:bg-[#F8F5FC]"
          >
            I Already Have an Account
          </a>

        </div>

        <p className="mt-6 text-xs text-[#9A94A8]">
          Opening your account...
        </p>

      </div>
    </main>
  );
}