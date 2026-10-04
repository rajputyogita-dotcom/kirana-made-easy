"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Bill = {
  id: number;
  customer_name: string | null;
  total_amount: number;
  payment_status: "paid" | "pending";
};

const API_URL = "http://127.0.0.1:8000";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "paid" | "pending"
  >("all");

  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<"paid" | "pending">("paid");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBills = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(
        `${API_URL}/bills/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load bills.");
      }

      const data = await response.json();
      setBills(data);
    } catch (err: any) {
      setError(
        err?.message || "Could not load bills."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        String(bill.id).includes(search) ||
        (bill.customer_name || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        bill.payment_status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [bills, search, filter]);

  const totalBilled = bills.reduce(
    (sum, bill) => sum + bill.total_amount,
    0
  );

  const paidAmount = bills
    .filter(
      (bill) => bill.payment_status === "paid"
    )
    .reduce(
      (sum, bill) => sum + bill.total_amount,
      0
    );

  const pendingAmount = bills
    .filter(
      (bill) => bill.payment_status === "pending"
    )
    .reduce(
      (sum, bill) => sum + bill.total_amount,
      0
    );

  const createBill = async () => {
    setMessage("");
    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid bill amount.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/bills/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name:
              customerName.trim() || null,
            total_amount: numericAmount,
            payment_status: paymentStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Could not create bill."
        );
      }

      setMessage(
        `Bill #${data.bill.id} created successfully.`
      );

      setCustomerName("");
      setAmount("");
      setPaymentStatus("paid");
      setShowModal(false);

      await loadBills();
    } catch (err: any) {
      setError(
        err?.message || "Could not create bill."
      );
    } finally {
      setSaving(false);
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
                Billing & Invoices
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
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F1EDFF] px-3 py-1.5 text-xs font-black text-[#6B4FE0]">
                🧾 SMART BILLING
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Bills & invoices
              </h1>

              <p className="mt-2 max-w-2xl text-[#777187]">
                Keep every customer bill organized,
                searchable and connected to your shop
                transactions.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl bg-[#7C5CFC] px-5 py-3 font-bold text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA]"
            >
              + Create bill
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

        {/* STATS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat
            icon="🧾"
            label="Total bills"
            value={bills.length}
            tone="purple"
          />

          <Stat
            icon="₹"
            label="Total billed"
            value={`₹${totalBilled.toLocaleString(
              "en-IN"
            )}`}
            tone="blue"
          />

          <Stat
            icon="✓"
            label="Paid"
            value={`₹${paidAmount.toLocaleString(
              "en-IN"
            )}`}
            tone="green"
          />

          <Stat
            icon="◷"
            label="Pending"
            value={`₹${pendingAmount.toLocaleString(
              "en-IN"
            )}`}
            tone="amber"
          />

        </section>

        {/* SMART BILLING */}
        <section className="mt-6 rounded-[28px] border border-[#E6DEF8] bg-[#F7F3FF] p-6 lg:p-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ✨
            </div>

            <div className="flex-1">
              <p className="font-black text-[#4C416A]">
                Billing is connected to your sales flow
              </p>

              <p className="mt-1 text-sm leading-6 text-[#777187]">
                When a sale is recorded, Kirana Made
                Easy can automatically generate its bill.
                You can also create a standalone bill here.
              </p>
            </div>

            <Link
              href="/sales"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#6B4FE0] shadow-sm transition hover:bg-[#FDFBFF]"
            >
              Record a sale →
            </Link>

          </div>

        </section>

        {/* TABLE */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-sm">

          <div className="border-b border-[#EEEAF3] p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  BILLING HISTORY
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Recent bills
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
                    placeholder="Search bills..."
                    className="w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#B9A9F3] sm:w-52"
                  />
                </div>

                <div className="flex rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] p-1">

                  {(
                    ["all", "paid", "pending"] as const
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

          {loading ? (
            <div className="p-10 text-center text-sm text-[#777187]">
              Loading bills...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 text-center">

              <div className="text-4xl">
                🧾
              </div>

              <p className="mt-3 font-bold">
                No bills found
              </p>

              <p className="mt-1 text-sm text-[#777187]">
                Create your first bill to see it here.
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
                        Bill
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Customer
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Amount
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {filteredBills.map(
                      (bill) => (
                        <tr
                          key={bill.id}
                          className="border-b border-[#F3EFF6] last:border-0 hover:bg-[#FCFAFF]"
                        >

                          <td className="px-6 py-5">
                            <span className="rounded-lg bg-[#F1EDFF] px-2.5 py-1.5 text-xs font-bold text-[#6B4FE0]">
                              #{bill.id}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-semibold">
                              {bill.customer_name ||
                                "Walk-in customer"}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <StatusBadge
                              status={
                                bill.payment_status
                              }
                            />
                          </td>

                          <td className="px-6 py-5 text-right font-black">
                            ₹
                            {bill.total_amount.toLocaleString(
                              "en-IN"
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

                {filteredBills.map(
                  (bill) => (
                    <div
                      key={bill.id}
                      className="rounded-2xl bg-[#FAF8FC] p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-[#F1EDFF] px-2 py-1 text-[11px] font-bold text-[#6B4FE0]">
                              #{bill.id}
                            </span>

                            <StatusBadge
                              status={
                                bill.payment_status
                              }
                            />
                          </div>

                          <p className="mt-3 font-bold">
                            {bill.customer_name ||
                              "Walk-in customer"}
                          </p>
                        </div>

                        <p className="font-black text-[#6B4FE0]">
                          ₹
                          {bill.total_amount.toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </section>

        {/* FOOTER CTA */}
        <section className="mt-6 rounded-[28px] bg-[#29243A] p-6 text-white lg:p-8">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <p className="text-xs font-black tracking-wider text-[#C9BCFF]">
                DUKAANAI
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Create bills without typing.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                Say what happened in your shop and let
                DukaanAI understand the action.
              </p>
            </div>

            <Link
              href="/dukaanai"
              className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-[#5E49B8] transition hover:bg-[#F4F0FF]"
            >
              Open DukaanAI ✨
            </Link>

          </div>

        </section>

      </div>

      {/* CREATE BILL MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#29243A]/30 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#7C5CFC]">
                  NEW BILL
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Create a bill
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
                  placeholder="Optional"
                  className="mt-2 w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] px-4 py-3 text-sm outline-none focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#625C6C]">
                  Total amount
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

              <div>
                <label className="text-sm font-bold text-[#625C6C]">
                  Payment status
                </label>

                <div className="mt-2 grid grid-cols-2 gap-3">

                  <button
                    onClick={() =>
                      setPaymentStatus("paid")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      paymentStatus === "paid"
                        ? "border-[#BFE4D1] bg-[#EDF9F3] text-[#378A68]"
                        : "border-[#E5DFEE] bg-white text-[#777187]"
                    }`}
                  >
                    ✓ Paid
                  </button>

                  <button
                    onClick={() =>
                      setPaymentStatus("pending")
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      paymentStatus === "pending"
                        ? "border-[#F1D89F] bg-[#FFF8E8] text-[#A8781E]"
                        : "border-[#E5DFEE] bg-white text-[#777187]"
                    }`}
                  >
                    ◷ Pending
                  </button>

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
                onClick={createBill}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#7C5CFC] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/15 hover:bg-[#6E4FEA] disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create bill"}
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
  tone: "purple" | "blue" | "green" | "amber";
}) {
  const backgrounds = {
    purple: "bg-[#F1EDFF]",
    blue: "bg-[#EEF5FF]",
    green: "bg-[#EDF9F3]",
    amber: "bg-[#FFF7E7]",
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
  status: "paid" | "pending";
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