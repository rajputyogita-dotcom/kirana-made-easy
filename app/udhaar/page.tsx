"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Credit = {
  id: number;
  customer_name: string;
  phone: string | null;
  amount: number;
  status: "pending" | "paid";
};

const API_URL = "http://127.0.0.1:8000";

export default function UdhaarPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "paid"
  >("all");

  const [showModal, setShowModal] = useState(false);

  const [customerName, setCustomerName] =
    useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCredits = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(
        `${API_URL}/credits/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load Udhaar records."
        );
      }

      const data = await response.json();
      setCredits(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not load Udhaar records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      const query = search.toLowerCase();

      const matchesSearch =
        credit.customer_name
          .toLowerCase()
          .includes(query) ||
        (credit.phone || "").includes(query);

      const matchesFilter =
        filter === "all" ||
        credit.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [credits, search, filter]);

  const pendingCredits = credits.filter(
    (credit) => credit.status === "pending"
  );

  const paidCredits = credits.filter(
    (credit) => credit.status === "paid"
  );

  const totalOutstanding = pendingCredits.reduce(
    (sum, credit) => sum + credit.amount,
    0
  );

  const totalCollected = paidCredits.reduce(
    (sum, credit) => sum + credit.amount,
    0
  );

  const addUdhaar = async () => {
    setMessage("");
    setError("");

    const numericAmount = Number(amount);

    if (!customerName.trim()) {
      setError("Please enter the customer name.");
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/credits/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name:
              customerName.trim(),
            phone: phone.trim() || null,
            amount: numericAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not add Udhaar."
        );
      }

      setMessage(
        `₹${numericAmount.toLocaleString(
          "en-IN"
        )} Udhaar added for ${customerName.trim()}.`
      );

      setCustomerName("");
      setPhone("");
      setAmount("");
      setShowModal(false);

      await loadCredits();
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not add Udhaar."
      );
    } finally {
      setSaving(false);
    }
  };

  const markAsPaid = async (id: number) => {
    setMessage("");
    setError("");

    try {
      setPayingId(id);

      const response = await fetch(
        `${API_URL}/credits/${id}/paid`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not update payment."
        );
      }

      setMessage(
        "Udhaar marked as paid successfully."
      );

      await loadCredits();
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not update payment."
      );
    } finally {
      setPayingId(null);
    }
  };

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
                Udhaar Management
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-[#E5DFEE] bg-white px-4 py-2 text-sm font-semibold text-[#5F596D] transition hover:bg-[#F8F5FF]"
          >
            ← Dashboard
          </Link>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-[0_10px_35px_rgba(70,48,120,0.05)] lg:p-8">

          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#EEE9FF] blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7E7] px-3 py-1.5 text-xs font-black text-[#A8781E]">
                💳 UDHAAR
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Customer credit
              </h1>

              <p className="mt-2 max-w-2xl text-[#777187]">
                Keep track of customer dues without
                notebooks, mental calculations or
                forgotten payments.
              </p>
            </div>

            <button
              onClick={() => {
                setMessage("");
                setError("");
                setShowModal(true);
              }}
              className="rounded-2xl bg-[#7C5CFC] px-5 py-3 font-bold text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA]"
            >
              + Add Udhaar
            </button>

          </div>
        </section>

        {/* MESSAGES */}
        {message && (
          <div className="mt-5 rounded-2xl border border-[#CDEBDD] bg-[#EDF9F3] px-4 py-3 text-sm font-semibold text-[#378A68]">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-[#F2CCCC] bg-[#FFF1F1] px-4 py-3 text-sm font-semibold text-[#C95D5D]">
            ⚠ {error}
          </div>
        )}

        {/* OUTSTANDING BANNER */}
        {totalOutstanding > 0 && (
          <section className="mt-6 rounded-[28px] border border-[#F1DDAF] bg-[#FFF9EC] p-5 lg:p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                ⏰
              </div>

              <div className="flex-1">
                <p className="font-black text-[#72551B]">
                  ₹
                  {totalOutstanding.toLocaleString(
                    "en-IN"
                  )}{" "}
                  is currently outstanding
                </p>

                <p className="mt-1 text-sm text-[#927443]">
                  {pendingCredits.length} customer{" "}
                  {pendingCredits.length === 1
                    ? "record needs"
                    : "records need"}{" "}
                  attention.
                </p>
              </div>

              <button
                onClick={() =>
                  setFilter("pending")
                }
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#A8781E] shadow-sm"
              >
                View pending →
              </button>

            </div>

          </section>
        )}

        {/* STATS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat
            icon="₹"
            label="Outstanding"
            value={`₹${totalOutstanding.toLocaleString(
              "en-IN"
            )}`}
            tone="amber"
          />

          <Stat
            icon="👥"
            label="Pending customers"
            value={pendingCredits.length}
            tone="purple"
          />

          <Stat
            icon="✓"
            label="Collected"
            value={`₹${totalCollected.toLocaleString(
              "en-IN"
            )}`}
            tone="green"
          />

          <Stat
            icon="📒"
            label="Total records"
            value={credits.length}
            tone="blue"
          />

        </section>

        {/* CUSTOMER RECORDS */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-sm">

          {/* HEADER */}
          <div className="border-b border-[#EEEAF3] p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  CUSTOMER LEDGER
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Udhaar records
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9B95A5]">
                    🔎
                  </span>

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search customer..."
                    className="w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#B9A9F3] sm:w-56"
                  />
                </div>

                <div className="flex rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] p-1">

                  {(
                    [
                      "all",
                      "pending",
                      "paid",
                    ] as const
                  ).map((item) => (
                    <button
                      key={item}
                      onClick={() =>
                        setFilter(item)
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                        filter === item
                          ? "bg-white text-[#6B4FE0] shadow-sm"
                          : "text-[#8A8492]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}

                </div>

              </div>

            </div>

          </div>

          {/* CONTENT */}
          {loading ? (
            <div className="p-10 text-center text-sm text-[#777187]">
              Loading Udhaar records...
            </div>
          ) : filteredCredits.length === 0 ? (
            <div className="p-12 text-center">

              <div className="text-4xl">
                💳
              </div>

              <p className="mt-3 font-bold">
                No Udhaar records found
              </p>

              <p className="mt-1 text-sm text-[#777187]">
                Add a customer credit record to see it
                here.
              </p>

            </div>
          ) : (
            <>
              {/* DESKTOP */}
              <div className="hidden md:block">

                <table className="w-full">

                  <thead>
                    <tr className="border-b border-[#F0ECF4] text-left">

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Contact
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Action
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredCredits.map(
                      (credit) => (
                        <tr
                          key={credit.id}
                          className="border-b border-[#F3EFF6] last:border-0 hover:bg-[#FCFAFF]"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEE9FF] text-sm font-black text-[#6B4FE0]">
                                {credit.customer_name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <p className="font-bold">
                                  {credit.customer_name}
                                </p>

                                <p className="text-xs text-[#9B95A5]">
                                  Record #{credit.id}
                                </p>
                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm text-[#777187]">
                            {credit.phone ||
                              "No phone added"}
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge
                              status={
                                credit.status
                              }
                            />
                          </td>

                          <td className="px-6 py-5 text-right font-black">
                            ₹
                            {credit.amount.toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td className="px-6 py-5 text-right">

                            {credit.status ===
                            "pending" ? (
                              <button
                                onClick={() =>
                                  markAsPaid(
                                    credit.id
                                  )
                                }
                                disabled={
                                  payingId ===
                                  credit.id
                                }
                                className="rounded-xl bg-[#EDF9F3] px-3 py-2 text-xs font-bold text-[#378A68] transition hover:bg-[#DDF4E9] disabled:opacity-50"
                              >
                                {payingId ===
                                credit.id
                                  ? "Updating..."
                                  : "Mark paid"}
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-[#9B95A5]">
                                Completed
                              </span>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}
              <div className="space-y-3 p-4 md:hidden">

                {filteredCredits.map(
                  (credit) => (
                    <div
                      key={credit.id}
                      className="rounded-2xl bg-[#FAF8FC] p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEE9FF] text-sm font-black text-[#6B4FE0]">
                            {credit.customer_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold">
                              {credit.customer_name}
                            </p>

                            <p className="mt-1 text-xs text-[#8B8595]">
                              {credit.phone ||
                                "No phone added"}
                            </p>
                          </div>

                        </div>

                        <StatusBadge
                          status={
                            credit.status
                          }
                        />

                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#EDE8F2] pt-4">

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#9B95A5]">
                            Amount
                          </p>

                          <p className="mt-1 text-lg font-black">
                            ₹
                            {credit.amount.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        {credit.status ===
                          "pending" && (
                          <button
                            onClick={() =>
                              markAsPaid(
                                credit.id
                              )
                            }
                            disabled={
                              payingId ===
                              credit.id
                            }
                            className="rounded-xl bg-[#EDF9F3] px-3 py-2 text-xs font-bold text-[#378A68] disabled:opacity-50"
                          >
                            {payingId ===
                            credit.id
                              ? "Updating..."
                              : "✓ Mark paid"}
                          </button>
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </section>

        {/* DUKAANAI CTA */}
        <section className="mt-6 rounded-[28px] bg-[#29243A] p-6 text-white lg:p-8">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <p className="text-xs font-black tracking-wider text-[#C9BCFF]">
                VOICE-FIRST UDHAAR
              </p>

              <h2 className="mt-2 text-2xl font-black">
                “Ravi ka 200 rupaye udhaar likh do.”
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                DukaanAI can turn natural shopkeeper
                language into structured Udhaar actions.
              </p>
            </div>

            <Link
              href="/dukaanai"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#5E49B8] transition hover:bg-[#F4F0FF]"
            >
              Try DukaanAI ✨
            </Link>

          </div>

        </section>

      </div>

      {/* ADD UDHAAR MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#29243A]/30 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#7C5CFC]">
                  NEW RECORD
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Add Udhaar
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F4FA] text-[#777187] hover:bg-[#EEE9FF]"
              >
                ×
              </button>

            </div>

            <div className="mt-6 space-y-5">

              <div>
                <label className="text-sm font-bold text-[#625C6C]">
                  Customer name
                </label>

                <input
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  placeholder="e.g. Ravi Kumar"
                  className="mt-2 w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] px-4 py-3 text-sm outline-none focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#625C6C]">
                  Phone number
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Optional"
                  className="mt-2 w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] px-4 py-3 text-sm outline-none focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#625C6C]">
                  Udhaar amount
                </label>

                <div className="relative mt-2">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#8B8595]">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] py-3 pl-9 pr-4 text-sm outline-none focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
                  />

                </div>
              </div>

            </div>

            <div className="mt-7 flex gap-3">

              <button
                onClick={() =>
                  setShowModal(false)
                }
                className="flex-1 rounded-xl border border-[#E5DFEE] bg-white px-4 py-3 text-sm font-bold text-[#625C6C] hover:bg-[#FAF8FC]"
              >
                Cancel
              </button>

              <button
                onClick={addUdhaar}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#7C5CFC] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/15 hover:bg-[#6E4FEA] disabled:opacity-60"
              >
                {saving
                  ? "Adding..."
                  : "Add Udhaar"}
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string | number;
  tone:
    | "amber"
    | "purple"
    | "green"
    | "blue";
}) {
  const backgrounds = {
    amber: "bg-[#FFF7E7]",
    purple: "bg-[#F1EDFF]",
    green: "bg-[#EDF9F3]",
    blue: "bg-[#EEF5FF]",
  };

  return (
    <div className="rounded-[24px] border border-[#E8E1F1] bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${backgrounds[tone]}`}
        >
          {icon}
        </span>

        <span className="text-xl font-black">
          {value}
        </span>

      </div>

      <p className="mt-4 text-sm font-semibold text-[#777187]">
        {label}
      </p>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "paid";
}) {
  if (status === "paid") {
    return (
      <span className="inline-flex rounded-full bg-[#EDF9F3] px-2.5 py-1 text-xs font-bold text-[#378A68]">
        ✓ Paid
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#FFF7E7] px-2.5 py-1 text-xs font-bold text-[#A8781E]">
      ◷ Pending
    </span>
  );
}