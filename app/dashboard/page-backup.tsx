"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getDashboardData,
  getDukaanAIInsights,
} from "@/lib/api";

type Product = {
  id: number;
  name: string;
  category: string;
  stock: number;
  minimum_stock: number;
  reorder_quantity: number;
  price: number;
  low_stock: boolean;
};

type Sale = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  total_amount: number;
};

type Credit = {
  id: number;
  customer_name: string;
  phone?: string;
  amount: number;
  status: string;
};

type Bill = {
  id: number;
  customer_name?: string;
  total_amount: number;
  payment_status: string;
};

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  status: string;
};

type Insights = {
  success: boolean;

  summary: {
    total_sales: number;
    items_sold: number;
    transaction_count: number;
    credit_due: number;
    pending_credit_count: number;
  };

  best_product: {
    name: string;
    quantity_sold: number;
  } | null;

  low_stock_products: {
    id: number;
    name: string;
    stock: number;
    minimum_stock: number;
    reorder_quantity: number;
  }[];

  stock_health: {
    total_products: number;
    healthy_products: number;
    low_stock_products: number;
  };

  recommendations: string[];
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [insights, setInsights] =
  useState<Insights | null>(null);

const [refreshing, setRefreshing] =
  useState(false);

const [profileOpen, setProfileOpen] =
  useState(false);

const [lastUpdated, setLastUpdated] =
  useState<Date | null>(null);

  const loadDashboardData = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setRefreshing(true);
        }

        const [
          dashboardData,
          insightData,
        ] = await Promise.all([
          getDashboardData(),
          getDukaanAIInsights(),
        ]);

        setProducts(dashboardData.products);
        setSales(dashboardData.sales);
        setCredits(dashboardData.credits);
        setBills(dashboardData.bills);
        setNotifications(
          dashboardData.notifications
        );

        setInsights(insightData);

        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        if (showLoading) {
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadDashboardData(true);

    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const totalSales =
    insights?.summary.total_sales ??
    sales.reduce(
      (sum, sale) =>
        sum + Number(sale.total_amount || 0),
      0
    );

  const itemsSold =
    insights?.summary.items_sold ??
    sales.reduce(
      (sum, sale) =>
        sum + Number(sale.quantity || 0),
      0
    );

  const pendingUdhaar =
    insights?.summary.credit_due ??
    credits
      .filter(
        (credit) => credit.status !== "paid"
      )
      .reduce(
        (sum, credit) =>
          sum + Number(credit.amount || 0),
        0
      );

  const lowStockProducts =
    insights?.low_stock_products ??
    products.filter(
      (product) => product.low_stock
    );

  const activeNotifications =
    notifications.filter(
      (notification) =>
        notification.status === "active"
    );

  const bestProduct =
    insights?.best_product;

  const maxSaleAmount =
    Math.max(
      ...sales.map((sale) =>
        Number(sale.total_amount || 0)
      ),
      1
    );

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
              K
            </div>

            <div>
              <p className="text-sm font-bold">
                Kirana Made Easy
              </p>
              <p className="text-[11px] text-slate-500">
                Powered by DukaanAI
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="hidden text-xs text-slate-500 sm:block">
                Synced{" "}
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={() =>
                loadDashboardData(true)
              }
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <span
                className={
                  refreshing
                    ? "mr-2 inline-block animate-spin"
                    : "mr-2"
                }
              >
                ↻
              </span>

              {refreshing
                ? "Syncing..."
                : "Refresh"}
            </button>

            <div className="relative">
  <button
    onClick={() =>
      setProfileOpen((current) => !current)
    }
    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800"
    aria-label="Open profile menu"
  >
    Y
  </button>

  {profileOpen && (
    <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
            Y
          </div>

          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">
              Yogita Rajput
            </p>

            <p className="truncate text-xs text-slate-500">
              Shop Owner
            </p>
          </div>
        </div>
      </div>

      <div className="p-2">
        <Link
          href="/settings"
          onClick={() => setProfileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>👤</span>
          Profile & Settings
        </Link>

        <Link
          href="/setup"
          onClick={() => setProfileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>🏪</span>
          Shop Details
        </Link>

        <div className="my-1 border-t border-slate-100" />

        <button
          onClick={() => {
            setProfileOpen(false);
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <span>↪</span>
          Logout
        </button>
      </div>
    </div>
  )}
</div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-16 p-5">
            <div className="mb-7 rounded-2xl bg-slate-900 p-5 text-white">
              <p className="text-xs text-slate-400">
                SHOP
              </p>

              <h2 className="mt-1 text-lg font-bold">
                My Kirana Store
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Owner Dashboard
              </p>
            </div>

            <nav className="space-y-1">
              {[
                ["Overview", "/dashboard"],
                ["Inventory", "/inventory"],
                ["Sales", "/sales"],
                ["Bills", "/bills"],
                ["Udhaar", "/udhaar"],
                ["DukaanAI", "/dukaanai"],
                ["Analytics", "/analytics"],
                [
                  "Notifications",
                  "/notifications",
                ],
                ["Settings", "/setup"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    label === "Overview"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {label}

                  {label === "Notifications" &&
                    activeNotifications.length >
                      0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {
                          activeNotifications.length
                        }
                      </span>
                    )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* HEADING */}
          <div className="mb-7">
            <p className="text-sm font-medium text-slate-500">
              Saturday, 3 October 2026
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Good evening 👋
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Here's what's happening in your
              shop.
            </p>
          </div>

          {/* DUKAANAI INSIGHTS */}
          <section className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                      ✦
                    </div>

                    <div>
                      <h2 className="font-bold">
                        DukaanAI Insights
                      </h2>

                      <p className="text-xs text-slate-500">
                        Smart recommendations from
                        your shop data
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dukaanai"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ask DukaanAI →
                </Link>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
              {/* TOTAL SALES */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recorded sales
                </p>

                <p className="mt-2 text-2xl font-bold">
                  ₹
                  {totalSales.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {insights?.summary
                    .transaction_count ?? 0}{" "}
                  transactions
                </p>
              </div>

              {/* ITEMS SOLD */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Items sold
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {itemsSold}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Across recorded sales
                </p>
              </div>

              {/* BEST PRODUCT */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Fastest-moving
                </p>

                <p className="mt-2 truncate text-xl font-bold">
                  {bestProduct?.name ??
                    "No sales yet"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {bestProduct
                    ? `${bestProduct.quantity_sold} units sold`
                    : "Start recording sales"}
                </p>
              </div>

              {/* UDHAAR */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pending udhaar
                </p>

                <p className="mt-2 text-2xl font-bold">
                  ₹
                  {pendingUdhaar.toLocaleString(
                    "en-IN"
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {
                    insights?.summary
                      .pending_credit_count
                  }{" "}
                  pending records
                </p>
              </div>
            </div>

            {/* RECOMMENDATIONS */}
            <div className="border-t border-slate-100 px-5 py-5 sm:px-7">
              <p className="mb-3 text-sm font-bold">
                Recommended actions
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                {(
                  insights?.recommendations ??
                  []
                )
                  .slice(0, 4)
                  .map(
                    (
                      recommendation,
                      index
                    ) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                          {index === 0
                            ? "⚡"
                            : index === 1
                              ? "📦"
                              : index === 2
                                ? "💰"
                                : "✓"}
                        </div>

                        <p className="text-sm leading-6 text-slate-700">
                          {recommendation}
                        </p>
                      </div>
                    )
                  )}
              </div>
            </div>
          </section>

          {/* LOW STOCK ALERT */}
          {lowStockProducts.length >
            0 && (
            <div className="mb-7 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-amber-900">
                  ⚠️ Restock required
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {
                    lowStockProducts.length
                  }{" "}
                  product
                  {lowStockProducts.length !==
                  1
                    ? "s are"
                    : " is"}{" "}
                  below the minimum stock level.
                </p>
              </div>

              <Link
                href="/inventory"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white"
              >
                View inventory
              </Link>
            </div>
          )}

          {/* STATS */}
          <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Total products",
                products.length,
                "Inventory items",
              ],
              [
                "Recorded sales",
                sales.length,
                "Transactions",
              ],
              [
                "Bills generated",
                bills.length,
                "All recorded bills",
              ],
              [
                "Active alerts",
                activeNotifications.length,
                "Needs attention",
              ],
            ].map(
              ([label, value, caption]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {caption}
                  </p>
                </div>
              )
            )}
          </div>

          {/* SALES + INVENTORY */}
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            {/* SALES */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">
                    Recent sales
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest recorded transactions
                  </p>
                </div>

                <Link
                  href="/sales"
                  className="text-sm font-semibold text-slate-700"
                >
                  View all →
                </Link>
              </div>

              {sales.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center">
                  <p className="font-semibold">
                    No sales recorded yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Record your first sale using
                    DukaanAI.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales
                    .slice(0, 6)
                    .map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold">
                          {sale.product_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-3">
                            <p className="truncate text-sm font-semibold">
                              {
                                sale.product_name
                              }
                            </p>

                            <p className="text-sm font-bold">
                              ₹
                              {Number(
                                sale.total_amount
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-900"
                              style={{
                                width: `${
                                  (Number(
                                    sale.total_amount
                                  ) /
                                    maxSaleAmount) *
                                  100
                                }%`,
                              }}
                            />
                          </div>

                          <p className="mt-1 text-[11px] text-slate-500">
                            Qty:{" "}
                            {sale.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* INVENTORY */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold">
                    Inventory status
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Current stock levels
                  </p>
                </div>

                <Link
                  href="/inventory"
                  className="text-sm font-semibold text-slate-700"
                >
                  Manage →
                </Link>
              </div>

              <div className="space-y-4">
                {products
                  .slice(0, 6)
                  .map((product) => {
                    const percentage =
                      product.minimum_stock >
                      0
                        ? Math.min(
                            (product.stock /
                              product.minimum_stock) *
                              100,
                            100
                          )
                        : 100;

                    return (
                      <div key={product.id}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-medium">
                            {product.name}
                          </span>

                          <span
                            className={
                              product.low_stock
                                ? "font-bold text-red-600"
                                : "text-slate-500"
                            }
                          >
                            {product.stock} units
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dukaanai"
              className="rounded-2xl bg-slate-900 p-5 text-white transition hover:-translate-y-0.5"
            >
              <p className="text-lg font-bold">
                🎙 Ask DukaanAI
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Record sales and update stock
                using your voice.
              </p>
            </Link>

            <Link
              href="/inventory"
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:bg-slate-50"
            >
              <p className="text-lg font-bold">
                📦 Inventory
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Check stock and restock products.
              </p>
            </Link>

            <Link
              href="/udhaar"
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:bg-slate-50"
            >
              <p className="text-lg font-bold">
                💰 Udhaar
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Track pending customer payments.
              </p>
            </Link>

            <Link
              href="/analytics"
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:bg-slate-50"
            >
              <p className="text-lg font-bold">
                📊 Analytics
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Understand your shop's
                performance.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}