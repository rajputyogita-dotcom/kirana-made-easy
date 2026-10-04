"use client";

import Link from "next/link";
import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const [shopName, setShopName] = useState("Kirana Made Easy");
  const [ownerName, setOwnerName] = useState("Shop Owner");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [salesAlerts, setSalesAlerts] = useState(true);
  const [udhaarAlerts, setUdhaarAlerts] = useState(true);

  const [language, setLanguage] = useState("Hinglish");

  function handleSave() {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-gray-900">

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          <div className="flex items-center gap-4">

            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg transition hover:bg-gray-50"
            >
              ←
            </Link>

            <div>
              <p className="text-sm text-gray-500">
                Manage your account
              </p>

              <h1 className="text-xl font-bold">
                Settings
              </h1>
            </div>

          </div>

          <Link
            href="/dukaanai"
            className="hidden rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:block"
          >
            🎙️ Ask DukaanAI
          </Link>

        </div>

      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl p-5 sm:p-8">

        {/* INTRO */}
        <div className="mb-7">

          <p className="text-sm font-bold text-green-600">
            SHOP SETTINGS
          </p>

          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Make DukaanAI work your way
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage your shop information, alerts and
            DukaanAI preferences from one place.
          </p>

        </div>

        {/* SHOP PROFILE */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
              🏪
            </div>

            <div>
              <h2 className="font-bold">
                Shop profile
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Basic information about your business.
              </p>
            </div>

          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">

            <InputField
              label="Shop name"
              value={shopName}
              onChange={setShopName}
              placeholder="Enter shop name"
            />

            <InputField
              label="Owner name"
              value={ownerName}
              onChange={setOwnerName}
              placeholder="Enter owner name"
            />

            <InputField
              label="Phone number"
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
            />

            <InputField
              label="Shop address"
              value={address}
              onChange={setAddress}
              placeholder="Enter shop address"
            />

          </div>

        </section>

        {/* BRANDING */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl">
              ✦
            </div>

            <div>
              <h2 className="font-bold">
                Shop identity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                How your shop appears inside the dashboard.
              </p>
            </div>

          </div>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-900 text-3xl font-black text-white">
              K
            </div>

            <div>

              <p className="font-bold">
                {shopName || "Your Shop"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Powered by DukaanAI
              </p>

              <button
                type="button"
                className="mt-3 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Change logo
              </button>

            </div>

          </div>

        </section>

        {/* NOTIFICATIONS */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xl">
              🔔
            </div>

            <div>
              <h2 className="font-bold">
                Notifications
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose which shop alerts you want to receive.
              </p>
            </div>

          </div>

          <div className="mt-7 divide-y divide-gray-100">

            <ToggleRow
              title="Low-stock alerts"
              description="Get notified when a product falls below its minimum stock."
              enabled={lowStockAlerts}
              onToggle={() =>
                setLowStockAlerts(!lowStockAlerts)
              }
            />

            <ToggleRow
              title="Sales alerts"
              description="Receive updates when sales and bills are recorded."
              enabled={salesAlerts}
              onToggle={() =>
                setSalesAlerts(!salesAlerts)
              }
            />

            <ToggleRow
              title="Udhaar reminders"
              description="Keep track of pending customer credit and payment reminders."
              enabled={udhaarAlerts}
              onToggle={() =>
                setUdhaarAlerts(!udhaarAlerts)
              }
            />

          </div>

        </section>

        {/* DUKAANAI */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xl text-white">
              ✨
            </div>

            <div>
              <h2 className="font-bold">
                DukaanAI preferences
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Customize how you interact with your AI shop assistant.
              </p>
            </div>

          </div>

          <div className="mt-7">

            <label className="text-sm font-semibold text-gray-800">
              Preferred language
            </label>

            <p className="mt-1 text-xs text-gray-500">
              DukaanAI can understand Hindi, English and Hinglish.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">

              {["Hindi", "English", "Hinglish"].map(
                (option) => (

                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setLanguage(option)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      language === option
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {language === option && "✓ "}
                    {option}
                  </button>

                )
              )}

            </div>

          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">

            <div className="flex items-start gap-3">

              <span className="text-lg">
                🎙️
              </span>

              <div>

                <p className="text-sm font-semibold">
                  Voice-first assistant
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Try commands like “Aaj 5 Maggi aayi”
                  or “Rohit ka 200 rupaye udhaar hai”.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ACCOUNT */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
              🔐
            </div>

            <div>
              <h2 className="font-bold">
                Account & security
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your account information.
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

              <p className="text-xs text-gray-400">
                Account status
              </p>

              <p className="mt-1 text-sm font-bold text-green-600">
                ● Active
              </p>

            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

              <p className="text-xs text-gray-400">
                AI assistant
              </p>

              <p className="mt-1 text-sm font-bold">
                DukaanAI enabled
              </p>

            </div>

          </div>

        </section>

        {/* SAVE */}
        <div className="sticky bottom-4 z-20 mt-7">

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center">

            <div>

              {saved ? (
                <>
                  <p className="text-sm font-bold text-green-600">
                    ✓ Changes saved successfully
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Your shop preferences have been updated.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    Keep your shop preferences updated
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Changes are applied to this session.
                  </p>
                </>
              )}

            </div>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              Save changes
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}


/* ---------------------------------------------------------
   INPUT FIELD
--------------------------------------------------------- */

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="text-sm font-semibold text-gray-800">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50"
      />

    </div>
  );
}


/* ---------------------------------------------------------
   TOGGLE
--------------------------------------------------------- */

function ToggleRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-5">

      <div className="min-w-0">

        <p className="text-sm font-semibold">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-500">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-green-500"
            : "bg-gray-300"
        }`}
      >

        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}