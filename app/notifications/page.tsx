"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  status: "active" | "resolved";
};

const API_URL = "http://127.0.0.1:8000";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingId, setResolvingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "resolved"
  >("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadNotifications = async (
    refresh = false
  ) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(
        `${API_URL}/notifications/`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load notifications."
        );
      }

      const data = await response.json();

      setNotifications(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const activeNotifications =
    notifications.filter(
      (item) => item.status === "active"
    );

  const resolvedNotifications =
    notifications.filter(
      (item) => item.status === "resolved"
    );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.title
          .toLowerCase()
          .includes(query) ||
        item.message
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        item.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [notifications, search, filter]);

  const resolveNotification = async (
    id: number
  ) => {
    setMessage("");
    setError("");

    try {
      setResolvingId(id);

      const response = await fetch(
        `${API_URL}/notifications/${id}/resolve`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Could not resolve notification."
        );
      }

      setMessage(
        "Alert resolved successfully."
      );

      await loadNotifications();
    } catch (err: any) {
      setError(
        err?.message ||
          "Could not resolve notification."
      );
    } finally {
      setResolvingId(null);
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
                Alerts & Notifications
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

              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF1F1] px-3 py-1.5 text-xs font-black text-[#C95D5D]">
                🔔 SHOP ALERTS
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-2xl text-[#777187]">
                Stay ahead of low stock and important
                shop events without constantly checking
                every product.
              </p>

            </div>

            <button
              onClick={() => loadNotifications(true)}
              disabled={refreshing}
              className="rounded-2xl bg-[#7C5CFC] px-5 py-3 font-bold text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA] disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh alerts"}
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
        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <StatCard
            icon="🔔"
            label="Active alerts"
            value={activeNotifications.length}
            tone="coral"
          />

          <StatCard
            icon="✓"
            label="Resolved"
            value={resolvedNotifications.length}
            tone="green"
          />

          <StatCard
            icon="📋"
            label="All notifications"
            value={notifications.length}
            tone="purple"
          />

        </section>

        {/* ACTIVE ALERT BANNER */}
        {activeNotifications.length > 0 && (
          <section className="mt-6 rounded-[28px] border border-[#F2CCCC] bg-[#FFF4F4] p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                ⚠️
              </div>

              <div className="flex-1">

                <p className="font-black text-[#9F4F4F]">
                  {activeNotifications.length} active{" "}
                  {activeNotifications.length === 1
                    ? "alert needs"
                    : "alerts need"}{" "}
                  your attention
                </p>

                <p className="mt-1 text-sm text-[#A66B6B]">
                  Check these alerts before they turn
                  into missed sales or stock-outs.
                </p>

              </div>

              <button
                onClick={() =>
                  setFilter("active")
                }
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#C95D5D] shadow-sm"
              >
                View active →
              </button>

            </div>

          </section>
        )}

        {/* ALERT LIST */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-sm">

          {/* HEADER */}
          <div className="border-b border-[#EEEAF3] p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  ALERT CENTER
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Shop notifications
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
                    placeholder="Search alerts..."
                    className="w-full rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#B9A9F3] sm:w-56"
                  />

                </div>

                <div className="flex rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] p-1">

                  {(
                    [
                      "all",
                      "active",
                      "resolved",
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
              Loading notifications...
            </div>
          ) : filteredNotifications.length ===
            0 ? (
            <div className="p-12 text-center">

              <div className="text-4xl">
                {filter === "active"
                  ? "✨"
                  : "🔔"}
              </div>

              <p className="mt-3 font-bold">
                {filter === "active"
                  ? "You're all caught up!"
                  : "No notifications found"}
              </p>

              <p className="mt-1 text-sm text-[#777187]">
                {filter === "active"
                  ? "There are no active shop alerts right now."
                  : "Notifications generated by your shop will appear here."}
              </p>

            </div>
          ) : (
            <div className="divide-y divide-[#F1EDF4]">

              {filteredNotifications.map(
                (notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    resolving={
                      resolvingId ===
                      notification.id
                    }
                    onResolve={
                      resolveNotification
                    }
                  />
                )
              )}

            </div>
          )}

        </section>

        {/* HOW ALERTS WORK */}
        <section className="mt-6 rounded-[28px] border border-[#E5DFEE] bg-white p-6 shadow-sm lg:p-8">

          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">

            <div>

              <p className="text-xs font-black uppercase tracking-wider text-[#7C5CFC]">
                AUTOMATED MONITORING
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your shop watches the stock for you.
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#777187]">
                Whenever inventory falls below the
                configured minimum, Kirana Made Easy
                creates a notification automatically.
              </p>

            </div>

            <div className="grid gap-3 sm:grid-cols-3">

              <InfoStep
                icon="📦"
                title="Stock changes"
                text="Sale or restock updates inventory."
              />

              <InfoStep
                icon="🔍"
                title="Threshold checked"
                text="System compares stock with minimum."
              />

              <InfoStep
                icon="🔔"
                title="Alert created"
                text="Shopkeeper gets an actionable alert."
              />

            </div>

          </div>

        </section>

        {/* DUKAANAI CTA */}
        <section className="mt-6 rounded-[28px] bg-[#29243A] p-6 text-white lg:p-8">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>

              <p className="text-xs font-black tracking-wider text-[#C9BCFF]">
                DUKAANAI
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Ask what needs attention.
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                Use the voice assistant to understand
                your shop status and act on inventory
                alerts.
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

    </main>
  );
}

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: number;
  tone: "coral" | "green" | "purple";
}) {
  const backgrounds = {
    coral: "bg-[#FFF1F1]",
    green: "bg-[#EDF9F3]",
    purple: "bg-[#F1EDFF]",
  };

  return (
    <div className="rounded-[24px] border border-[#E8E1F1] bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${backgrounds[tone]}`}
        >
          {icon}
        </span>

        <span className="text-2xl font-black">
          {value}
        </span>

      </div>

      <p className="mt-4 text-sm font-semibold text-[#777187]">
        {label}
      </p>

    </div>
  );
}

function NotificationCard({
  notification,
  resolving,
  onResolve,
}: {
  notification: Notification;
  resolving: boolean;
  onResolve: (id: number) => void;
}) {
  const isActive =
    notification.status === "active";

  return (
    <div className="p-5 transition hover:bg-[#FCFAFF] sm:p-6">

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

        {/* ICON */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            isActive
              ? "bg-[#FFF1F1]"
              : "bg-[#EDF9F3]"
          }`}
        >
          {isActive ? "⚠️" : "✓"}
        </div>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="font-black">
              {notification.title}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                isActive
                  ? "bg-[#FFF1F1] text-[#C95D5D]"
                  : "bg-[#EDF9F3] text-[#378A68]"
              }`}
            >
              {notification.status}
            </span>

          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#777187]">
            {notification.message}
          </p>

          <p className="mt-2 text-[11px] font-semibold text-[#AAA4B2]">
            Notification #{notification.id}
          </p>

        </div>

        {/* ACTION */}
        {isActive ? (
          <button
            onClick={() =>
              onResolve(notification.id)
            }
            disabled={resolving}
            className="shrink-0 rounded-xl bg-[#29243A] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#403951] disabled:opacity-50"
          >
            {resolving
              ? "Resolving..."
              : "Mark resolved"}
          </button>
        ) : (
          <span className="shrink-0 text-xs font-semibold text-[#9B95A5]">
            Resolved
          </span>
        )}

      </div>

    </div>
  );
}

function InfoStep({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-[#FAF8FC] p-4">

      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
        {icon}
      </div>

      <p className="mt-3 text-sm font-black">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-[#777187]">
        {text}
      </p>

    </div>
  );
}