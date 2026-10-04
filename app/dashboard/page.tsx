"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getDashboardData,
  getDukaanAIInsights,
} from "@/lib/api";

type DashboardData = {
  products: any[];
  sales: any[];
  credits: any[];
  bills: any[];
  notifications: any[];
};

type InsightsData = {
  success?: boolean;
  summary?: {
    total_sales?: number;
    items_sold?: number;
    transaction_count?: number;
    credit_due?: number;
    pending_credit_count?: number;
  };
  best_product?: {
    name?: string;
    quantity_sold?: number;
  } | null;
  low_stock_products?: any[];
  stock_health?: {
    healthy?: number;
    total?: number;
    percentage?: number;
  };
  recommendations?: string[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    products: [],
    sales: [],
    credits: [],
    bills: [],
    notifications: [],
  });

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const loadDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [dashboardData, insightsData] = await Promise.all([
        getDashboardData(),
        getDukaanAIInsights(),
      ]);

      setData(dashboardData);
      setInsights(insightsData);
      setLive(true);

      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Dashboard loading failed:", error);
      setLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const summary = insights?.summary;

  const totalSales =
    summary?.total_sales ??
    data.sales.reduce(
      (total, sale) => total + Number(sale.total_amount || 0),
      0
    );

  const itemsSold =
    summary?.items_sold ??
    data.sales.reduce(
      (total, sale) => total + Number(sale.quantity || 0),
      0
    );

  const pendingUdhaar =
    summary?.credit_due ??
    data.credits
      .filter((credit) => credit.status !== "paid")
      .reduce(
        (total, credit) => total + Number(credit.amount || 0),
        0
      );

  const activeNotifications = data.notifications.filter(
    (notification) => notification.status === "active"
  );

  const lowStockProducts =
    insights?.low_stock_products ??
    data.products.filter(
      (product) =>
        Number(product.stock) < Number(product.minimum_stock)
    );

  const healthyProducts =
    insights?.stock_health?.healthy ??
    data.products.filter(
      (product) =>
        Number(product.stock) >= Number(product.minimum_stock)
    ).length;

  const totalProducts =
    insights?.stock_health?.total ?? data.products.length;

  const stockHealth =
    insights?.stock_health?.percentage ??
    (totalProducts > 0
      ? Math.round((healthyProducts / totalProducts) * 100)
      : 100);

  const bestProduct = insights?.best_product;

  const pendingCredits = data.credits.filter(
    (credit) => credit.status !== "paid"
  );

  const paidCredits = data.credits.filter(
    (credit) => credit.status === "paid"
  );

  const recommendations =
    insights?.recommendations?.slice(0, 3) ?? [];

  const recentActivities = useMemo(() => {
    const activities: {
      id: string;
      type: string;
      title: string;
      description: string;
      icon: string;
      href: string;
    }[] = [];

    data.sales.slice(0, 3).forEach((sale) => {
      activities.push({
        id: `sale-${sale.id}`,
        type: "sale",
        title: "Sale recorded",
        description: `${sale.quantity} × ${sale.product_name} • ₹${Number(
          sale.total_amount || 0
        ).toLocaleString("en-IN")}`,
        icon: "₹",
        href: "/sales",
      });
    });

    activeNotifications.slice(0, 2).forEach((notification) => {
      activities.push({
        id: `notification-${notification.id}`,
        type: "alert",
        title: notification.title,
        description: notification.message,
        icon: "!",
        href: "/notifications",
      });
    });

    data.credits.slice(0, 2).forEach((credit) => {
      activities.push({
        id: `credit-${credit.id}`,
        type: "credit",
        title: "Udhaar added",
        description: `${credit.customer_name} • ₹${Number(
          credit.amount || 0
        ).toLocaleString("en-IN")}`,
        icon: "U",
        href: "/udhaar",
      });
    });

    return activities.slice(0, 6);
  }, [data.sales, data.credits, activeNotifications]);

  function formatCurrency(value: number) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  }

  return (
    <div className="min-h-screen bg-[#FAF8FC] text-[#29243A]">
      {/* TOP NAV */}
      <header className="sticky top-0 z-50 border-b border-[#E9E2F1] bg-[#FFFDFF]/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black text-white shadow-[0_6px_20px_rgba(124,92,252,0.25)]">
              K
            </div>

            <div className="hidden sm:block">
              <p className="text-[15px] font-extrabold tracking-tight">
                Kirana Made Easy
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#978FA6]">
                Powered by DukaanAI
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#E9E2F1] bg-[#F7F3FB] px-3 py-2 sm:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  live ? "bg-[#48A982]" : "bg-[#E5A83B]"
                }`}
              />
              <span className="text-xs font-bold text-[#6F687D]">
                {live ? "Live" : "Connecting"}
              </span>
            </div>

            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E9E2F1] bg-white text-[#6F687D] transition hover:bg-[#F7F3FB]"
            >
              <span>🔔</span>

              {activeNotifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E87575] px-1 text-[10px] font-bold text-white">
                  {activeNotifications.length}
                </span>
              )}
            </Link>

            <Link
              href="/dukaanai"
              className="hidden items-center gap-2 rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-sm font-bold text-white shadow-[0_7px_20px_rgba(124,92,252,0.22)] transition hover:bg-[#6F4FEF] sm:flex"
            >
              <span>✦</span>
              Ask DukaanAI
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-[#E9E2F1] bg-white p-1.5 pr-2 transition hover:bg-[#F7F3FB]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEE9FF] text-xs font-black text-[#6A4BEA]">
                  YR
                </div>

                <div className="hidden text-left md:block">
                  <p className="text-xs font-bold">Yogita Rajput</p>
                  <p className="text-[10px] text-[#978FA6]">
                    Shop Owner
                  </p>
                </div>

                <span className="text-xs text-[#978FA6]">
                  {profileOpen ? "▲" : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-[#E9E2F1] bg-white p-2 shadow-[0_18px_50px_rgba(57,42,81,0.14)]">
                  <div className="border-b border-[#F0EBF5] px-3 py-3">
                    <p className="text-sm font-bold">
                      Yogita Rajput
                    </p>
                    <p className="mt-0.5 text-xs text-[#978FA6]">
                      Shop Owner
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5E576B] hover:bg-[#F7F3FB]"
                  >
                    ⚙️ Settings
                  </Link>

                  <Link
                    href="/setup"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5E576B] hover:bg-[#F7F3FB]"
                  >
                    🏪 Shop Setup
                  </Link>

                  <button
                    onClick={() => (window.location.href = "/login")}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#D85E68] hover:bg-[#FFF2F3]"
                  >
                    ↪ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-[#F0EBF5] px-4 py-2 lg:hidden">
          <div className="flex min-w-max gap-2">
            {[
              ["Overview", "/dashboard"],
              ["Inventory", "/inventory"],
              ["Sales", "/sales"],
              ["Bills", "/bills"],
              ["Udhaar", "/udhaar"],
              ["DukaanAI", "/dukaanai"],
              ["Analytics", "/analytics"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  href === "/dashboard"
                    ? "bg-[#EEE9FF] text-[#6749E8]"
                    : "bg-[#F3EFF7] text-[#6F687D]"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        {/* SIDEBAR */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-[#E9E2F1] bg-[#FFFDFF] px-4 py-5 lg:block">
          <div className="flex h-full flex-col">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A29AAA]">
                Workspace
              </p>

              <nav className="mt-3 space-y-1">
                <NavItem href="/dashboard" icon="⌂" label="Overview" active />
                <NavItem href="/inventory" icon="▦" label="Inventory" />
                <NavItem href="/sales" icon="₹" label="Sales" />
                <NavItem href="/bills" icon="▤" label="Bills" />
                <NavItem href="/udhaar" icon="U" label="Udhaar" />
                <NavItem href="/dukaanai" icon="✦" label="DukaanAI" />
                <NavItem href="/analytics" icon="⌁" label="Analytics" />
                <NavItem
                  href="/notifications"
                  icon="!"
                  label="Notifications"
                  badge={activeNotifications.length || undefined}
                />
              </nav>
            </div>

            <div className="mt-auto">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#EEE9FF] via-[#F5F0FF] to-[#FFF7EF] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CFC] text-white shadow-sm">
                  ✦
                </div>

                <p className="mt-4 text-sm font-extrabold text-[#393047]">
                  Your shop. Your voice.
                </p>

                <p className="mt-1 text-xs leading-5 text-[#756D80]">
                  Ask DukaanAI to manage stock, sales and daily shop
                  work.
                </p>

                <Link
                  href="/dukaanai"
                  className="mt-4 flex items-center justify-center rounded-xl bg-[#7C5CFC] px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#6F4FEF]"
                >
                  Open DukaanAI →
                </Link>
              </div>

              <Link
                href="/settings"
                className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#6F687D] hover:bg-[#F7F3FB]"
              >
                ⚙ Settings
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* HEADER */}
          <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E5DDF2] bg-white px-3 py-1.5 text-xs font-bold text-[#766D82] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#48A982]" />
                Shop operations dashboard
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#29243A] sm:text-4xl">
                Good morning, Yogita.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#81798B] sm:text-base">
                Everything you need to manage your shop — beautifully
                organized in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {lastUpdated && (
                <span className="rounded-xl border border-[#E9E2F1] bg-white px-3 py-2 text-xs font-medium text-[#81798B]">
                  Updated {lastUpdated}
                </span>
              )}

              <button
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="rounded-xl border border-[#E9E2F1] bg-white px-4 py-2.5 text-sm font-bold text-[#5E576B] shadow-sm hover:bg-[#F7F3FB] disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>
          </section>

          {/* STATS */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's sales"
              value={formatCurrency(totalSales)}
              subtext={`${summary?.transaction_count ?? data.sales.length} transactions`}
              icon="₹"
              href="/sales"
              tone="violet"
            />

            <StatCard
              label="Items sold"
              value={itemsSold.toLocaleString("en-IN")}
              subtext="Units moved"
              icon="▦"
              href="/sales"
              tone="blue"
            />

            <StatCard
              label="Pending Udhaar"
              value={formatCurrency(pendingUdhaar)}
              subtext={`${pendingCredits.length} customers pending`}
              icon="U"
              href="/udhaar"
              tone="amber"
            />

            <StatCard
              label="Low-stock alerts"
              value={lowStockProducts.length.toString()}
              subtext={
                lowStockProducts.length
                  ? "Action recommended"
                  : "Inventory looks healthy"
              }
              icon="!"
              href="/inventory"
              tone={lowStockProducts.length ? "red" : "green"}
            />
          </section>

          {/* DUKAAN AI HERO */}
          <section className="relative mt-6 overflow-hidden rounded-[28px] border border-[#DED4F2] bg-gradient-to-br from-[#EEE9FF] via-[#F5F0FF] to-[#FFF8F1] shadow-[0_12px_35px_rgba(100,76,155,0.08)]">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#C9B8FF]/30 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[30%] h-60 w-60 rounded-full bg-[#FFD8B8]/20 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1.4fr_0.8fr]">
              <div className="p-6 sm:p-8 lg:p-9">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C5CFC] text-lg text-white shadow-[0_7px_20px_rgba(124,92,252,0.25)]">
                    ✦
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#493A69]">
                      DukaanAI
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#958BA4]">
                      Your voice-first shop assistant
                    </p>
                  </div>
                </div>

                <h2 className="mt-6 max-w-2xl text-2xl font-black tracking-tight text-[#302844] sm:text-3xl">
                  Run your shop just by speaking.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#746A80] sm:text-base">
                  Hindi, English or Hinglish — speak naturally and let
                  DukaanAI turn your words into real shop actions.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dukaanai"
                    className="rounded-xl bg-[#7C5CFC] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_20px_rgba(124,92,252,0.2)] hover:bg-[#6F4FEF]"
                  >
                    Talk to DukaanAI →
                  </Link>

                  <Link
                    href="/inventory"
                    className="rounded-xl border border-[#DDD3EF] bg-white/70 px-5 py-3 text-sm font-bold text-[#554B66] hover:bg-white"
                  >
                    View inventory
                  </Link>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {[
                    '"5 Maggi aayi"',
                    '"2 bread bik gaye"',
                    '"Ravi ka udhaar 500"',
                  ].map((example) => (
                    <span
                      key={example}
                      className="rounded-full border border-[#DED5EC] bg-white/65 px-3 py-1.5 text-xs font-medium text-[#756B81]"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#DED4F2] bg-white/35 p-6 lg:border-l lg:border-t-0 lg:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#988EA5]">
                  Live AI insight
                </p>

                {bestProduct ? (
                  <>
                    <p className="mt-6 text-sm font-medium text-[#81778D]">
                      Best-selling product
                    </p>

                    <p className="mt-1 text-2xl font-black text-[#302844]">
                      {bestProduct.name}
                    </p>

                    <p className="mt-1 text-sm text-[#81778D]">
                      {bestProduct.quantity_sold ?? 0} units sold
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-6 text-2xl font-black text-[#302844]">
                      Ready to learn
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#81778D]">
                      Record a few sales and DukaanAI will start
                      generating useful insights.
                    </p>
                  </>
                )}

                <div className="mt-7 border-t border-[#DED4F2] pt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#81778D]">
                        Stock health
                      </p>
                      <p className="mt-1 text-xl font-black text-[#302844]">
                        {stockHealth}%
                      </p>
                    </div>

                    <span className="text-xs font-medium text-[#958BA4]">
                      {healthyProducts}/{totalProducts} healthy
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5DFF0]">
                    <div
                      className="h-full rounded-full bg-[#7C5CFC]"
                      style={{
                        width: `${Math.min(
                          Math.max(stockHealth, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SALES + INVENTORY */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[26px] border border-[#E9E2F1] bg-white p-5 shadow-[0_8px_30px_rgba(70,53,90,0.045)] sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                    Sales performance
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Recent sales
                  </h2>
                </div>

                <Link
                  href="/sales"
                  className="text-sm font-bold text-[#7154E8]"
                >
                  View all →
                </Link>
              </div>

              {loading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-12 animate-pulse rounded-xl bg-[#F5F1F8]"
                    />
                  ))}
                </div>
              ) : data.sales.length === 0 ? (
                <EmptyState
                  icon="₹"
                  title="No sales recorded yet"
                  description="Record your first sale to start building live insights."
                  href="/sales"
                  button="Record sale"
                />
              ) : (
                <div className="mt-5 space-y-4">
                  {data.sales.slice(0, 5).map((sale) => {
                    const amount = Number(sale.total_amount || 0);

                    return (
                      <div key={sale.id}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold">
                              {sale.product_name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#968D9F]">
                              {sale.quantity} unit
                              {sale.quantity === 1 ? "" : "s"} sold
                            </p>
                          </div>

                          <p className="text-sm font-black">
                            {formatCurrency(amount)}
                          </p>
                        </div>

                        <div className="mt-2 h-1.5 rounded-full bg-[#F0ECF5]">
                          <div
                            className="h-full rounded-full bg-[#9B83F8]"
                            style={{
                              width: `${Math.max(
                                12,
                                Math.min(100, amount / 5)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#F0ECF5] pt-5">
                <div className="rounded-2xl bg-[#F8F5FC] p-4">
                  <p className="text-xs text-[#948A9D]">Total sales</p>
                  <p className="mt-1 text-lg font-black">
                    {formatCurrency(totalSales)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8F5FC] p-4">
                  <p className="text-xs text-[#948A9D]">Items sold</p>
                  <p className="mt-1 text-lg font-black">
                    {itemsSold}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#E9E2F1] bg-white p-5 shadow-[0_8px_30px_rgba(70,53,90,0.045)] sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                    Inventory pulse
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    Stock status
                  </h2>
                </div>

                <Link
                  href="/inventory"
                  className="text-sm font-bold text-[#7154E8]"
                >
                  Manage →
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {data.products.slice(0, 5).map((product) => {
                  const stock = Number(product.stock || 0);
                  const minimum = Number(product.minimum_stock || 0);
                  const isLow = stock < minimum;

                  const percentage =
                    minimum > 0
                      ? Math.min(100, Math.round((stock / minimum) * 100))
                      : 100;

                  return (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-[#F0EBF5] p-3.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#978EA0]">
                            {stock} in stock • min {minimum}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            isLow
                              ? "bg-[#FFF0F1] text-[#D65F68]"
                              : "bg-[#EAF8F1] text-[#398B68]"
                          }`}
                        >
                          {isLow ? "LOW" : "OK"}
                        </span>
                      </div>

                      <div className="mt-3 h-1.5 rounded-full bg-[#F1EDF5]">
                        <div
                          className={`h-full rounded-full ${
                            isLow
                              ? "bg-[#E87575]"
                              : "bg-[#55B58A]"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* LOWER CARDS */}
          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Alerts */}
            <div className="rounded-[26px] border border-[#E9E2F1] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                Attention
              </p>

              <div className="mt-1 flex items-center justify-between">
                <h2 className="text-xl font-black">Alerts</h2>

                <Link
                  href="/notifications"
                  className="text-sm font-bold text-[#7154E8]"
                >
                  View →
                </Link>
              </div>

              {activeNotifications.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-[#EAF8F1] p-4">
                  <p className="text-sm font-bold text-[#286D50]">
                    ✓ Everything looks good
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#4D8A70]">
                    No active inventory alerts require your attention.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {activeNotifications.slice(0, 3).map(
                    (notification) => (
                      <Link
                        key={notification.id}
                        href="/notifications"
                        className="block rounded-2xl border border-[#F6DCDD] bg-[#FFF5F5] p-4"
                      >
                        <p className="text-sm font-bold text-[#9D4149]">
                          {notification.title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#B35D64]">
                          {notification.message}
                        </p>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            {/* AI */}
            <div className="rounded-[26px] border border-[#E3DAF3] bg-gradient-to-br from-[#F5F1FF] to-[#FFFDFB] p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B90AB]">
                    Intelligence
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    AI recommendations
                  </h2>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C5CFC] text-white shadow-sm">
                  ✦
                </div>
              </div>

              {recommendations.length === 0 ? (
                <div className="mt-5 rounded-2xl bg-white/80 p-4">
                  <p className="text-sm font-bold">
                    Keep using DukaanAI
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#81778D]">
                    More shop activity will help generate useful
                    recommendations.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <div
                      key={`${recommendation}-${index}`}
                      className="flex gap-3 rounded-2xl bg-white/80 p-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EEE9FF] text-xs font-black text-[#6A4BEA]">
                        {index + 1}
                      </span>

                      <p className="text-xs leading-5 text-[#6E6579]">
                        {recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/analytics"
                className="mt-4 block text-center text-xs font-bold text-[#7154E8]"
              >
                See full analytics →
              </Link>
            </div>

            {/* Udhaar */}
            <div className="rounded-[26px] border border-[#E9E2F1] bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                Customer credit
              </p>

              <div className="mt-1 flex items-center justify-between">
                <h2 className="text-xl font-black">
                  Udhaar overview
                </h2>

                <Link
                  href="/udhaar"
                  className="text-sm font-bold text-[#7154E8]"
                >
                  Manage →
                </Link>
              </div>

              <div className="mt-5 rounded-2xl bg-[#FFF6E8] p-5">
                <p className="text-xs font-medium text-[#9A7846]">
                  Outstanding amount
                </p>

                <p className="mt-1 text-2xl font-black text-[#5B4630]">
                  {formatCurrency(pendingUdhaar)}
                </p>

                <p className="mt-1 text-xs text-[#A98550]">
                  Across {pendingCredits.length} pending customer
                  {pendingCredits.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#FFF6E8] p-4">
                  <p className="text-xs text-[#A27B43]">Pending</p>
                  <p className="mt-1 text-lg font-black text-[#664B2A]">
                    {pendingCredits.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#EAF8F1] p-4">
                  <p className="text-xs text-[#4D8A70]">Paid</p>
                  <p className="mt-1 text-lg font-black text-[#286D50]">
                    {paidCredits.length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* LIVE ACTIVITY */}
          <section className="mt-6 rounded-[26px] border border-[#E9E2F1] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                  Live workspace
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Shop activity
                </h2>

                <p className="mt-1 text-sm text-[#958C9F]">
                  Automatically synced with your backend.
                </p>
              </div>

              <div className="flex h-fit items-center gap-2 rounded-xl bg-[#EAF8F1] px-3 py-2 text-xs font-bold text-[#398363]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#48A982]" />
                Backend connected
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#DDD5E5] p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1ECF7] text-xl">
                  ✦
                </div>

                <p className="mt-3 text-sm font-bold">
                  Your activity will appear here
                </p>

                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#978EA0]">
                  Record a sale, add Udhaar or update inventory and
                  this dashboard will reflect the change.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="rounded-2xl border border-[#F0EBF5] p-4 transition hover:border-[#DCD2E8] hover:bg-[#FBF9FD]"
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          activity.type === "alert"
                            ? "bg-[#FFF0F1] text-[#D65F68]"
                            : activity.type === "credit"
                            ? "bg-[#FFF6E8] text-[#A2763C]"
                            : "bg-[#EEE9FF] text-[#6A4BEA]"
                        }`}
                      >
                        {activity.icon}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          {activity.title}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#93899D]">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* DEMO FLOW */}
          <section className="mt-6 overflow-hidden rounded-[26px] border border-[#E4DDF0] bg-white shadow-sm">
            <div className="border-b border-[#F0EBF5] p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A097AA]">
                Presentation mode
              </p>

              <h2 className="mt-1 text-xl font-black">
                Show the complete Kirana Made Easy experience
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8A8192]">
                Demonstrate how one simple voice command can become a
                real shop update.
              </p>
            </div>

            <div className="grid md:grid-cols-3">
              <DemoStep
                number="01"
                title="Speak"
                description='Say: “5 Maggi aayi aur 2 bik gaye.”'
                href="/dukaanai"
                button="Open voice assistant"
              />

              <DemoStep
                number="02"
                title="Verify"
                description="DukaanAI understands the command and shows the action before changing shop data."
                href="/dukaanai"
                button="Show AI workflow"
              />

              <DemoStep
                number="03"
                title="See the impact"
                description="Inventory, sales, bills and alerts update from the same backend."
                href="/inventory"
                button="Open live inventory"
              />
            </div>
          </section>

          <footer className="pb-5 pt-8 text-center">
            <p className="text-xs text-[#A098A8]">
              Kirana Made Easy • Run your shop just by speaking.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function NavItem({
  href,
  icon,
  label,
  active = false,
  badge,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-[#EEE9FF] text-[#6245D9]"
          : "text-[#6F687D] hover:bg-[#F8F5FB]"
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
            active
              ? "bg-[#DCD2FF] text-[#6245D9]"
              : "bg-[#F2EEF6] text-[#777080]"
          }`}
        >
          {icon}
        </span>

        {label}
      </span>

      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E87575] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  href,
  tone,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: string;
  href: string;
  tone: "violet" | "blue" | "amber" | "red" | "green";
}) {
  const styles = {
    violet: {
      icon: "bg-[#EEE9FF] text-[#6A4BEA]",
      line: "bg-[#9B83F8]",
    },
    blue: {
      icon: "bg-[#EEF5FF] text-[#4B78C8]",
      line: "bg-[#82A9E8]",
    },
    amber: {
      icon: "bg-[#FFF6E8] text-[#A2763C]",
      line: "bg-[#E5B866]",
    },
    red: {
      icon: "bg-[#FFF0F1] text-[#D65F68]",
      line: "bg-[#E87575]",
    },
    green: {
      icon: "bg-[#EAF8F1] text-[#398363]",
      line: "bg-[#55B58A]",
    },
  };

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-[24px] border border-[#E9E2F1] bg-white p-5 shadow-[0_8px_25px_rgba(70,53,90,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${styles[tone].icon}`}
        >
          {icon}
        </div>

        <span className="text-lg text-[#C4BDCA] transition group-hover:translate-x-1">
          →
        </span>
      </div>

      <p className="mt-5 text-xs font-bold text-[#948B9C]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-[#302A3B]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#9B92A2]">{subtext}</p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#F1EDF5]">
        <div
          className={`h-full w-1/2 rounded-full ${styles[tone].line}`}
        />
      </div>
    </Link>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  button,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#DDD5E5] p-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1ECF7] text-sm font-black text-[#7154E8]">
        {icon}
      </div>

      <p className="mt-3 text-sm font-bold">{title}</p>

      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#978EA0]">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl bg-[#7C5CFC] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6F4FEF]"
      >
        {button} →
      </Link>
    </div>
  );
}

function DemoStep({
  number,
  title,
  description,
  href,
  button,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="border-t border-[#F0EBF5] p-5 first:border-t-0 sm:p-6 md:border-l md:border-t-0 md:first:border-l-0">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEE9FF] text-xs font-black text-[#6749E8]">
          {number}
        </span>

        <h3 className="text-sm font-black">{title}</h3>
      </div>

      <p className="mt-4 min-h-[48px] text-xs leading-5 text-[#81788C]">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-block text-xs font-bold text-[#7154E8]"
      >
        {button} →
      </Link>
    </div>
  );
}