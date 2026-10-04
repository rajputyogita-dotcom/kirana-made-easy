"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

const API_URL = "http://127.0.0.1:8000";

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [productsResponse, salesResponse] =
        await Promise.all([
          fetch(`${API_URL}/products/`, {
            cache: "no-store",
          }),
          fetch(`${API_URL}/sales/`, {
            cache: "no-store",
          }),
        ]);

      if (!productsResponse.ok || !salesResponse.ok) {
        throw new Error("Could not load sales data.");
      }

      const productsData =
        await productsResponse.json();

      const salesData =
        await salesResponse.json();

      setProducts(productsData);
      setSales(salesData);
    } catch (err: any) {
      setError(
        err?.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) =>
      product.id === Number(productId)
  );

  const saleQuantity = Number(quantity) || 0;

  const estimatedTotal = selectedProduct
    ? selectedProduct.price * saleQuantity
    : 0;

  const todaySales = sales.reduce(
    (sum, sale) => sum + sale.total_amount,
    0
  );

  const itemsSold = sales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  );

  const filteredSales = useMemo(() => {
    return sales.filter((sale) =>
      sale.product_name
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [sales, search]);

  const recordSale = async () => {
    setMessage("");
    setError("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(saleQuantity) ||
      saleQuantity <= 0
    ) {
      setError("Enter a valid quantity.");
      return;
    }

    if (saleQuantity > selectedProduct.stock) {
      setError(
        `Only ${selectedProduct.stock} units of ${selectedProduct.name} are available.`
      );
      return;
    }

    try {
      setSelling(true);

      const response = await fetch(
        `${API_URL}/sales/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: selectedProduct.id,
            quantity: saleQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Sale could not be completed."
        );
      }

      setMessage(
        `${saleQuantity} × ${selectedProduct.name} sold successfully. Bill #${data.bill?.id ?? "created"} generated.`
      );

      setQuantity("1");
      setProductId("");

      await loadData();
    } catch (err: any) {
      setError(
        err?.message ||
          "Sale could not be completed."
      );
    } finally {
      setSelling(false);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7C5CFC] text-lg font-black text-white shadow-sm shadow-[#7C5CFC]/20">
              K
            </div>

            <div>
              <p className="font-bold leading-tight">
                Kirana Made Easy
              </p>

              <p className="text-xs text-[#777187]">
                Sales Management
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-[#E5DFEE] bg-white px-4 py-2 text-sm font-semibold text-[#5F596D] transition hover:border-[#D4C8F7] hover:bg-[#F8F5FF]"
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
                <span>💰</span>
                LIVE SALES
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Record a sale
              </h1>

              <p className="mt-2 max-w-2xl text-[#777187]">
                Select a product, enter the quantity and
                let Kirana Made Easy update stock and
                generate the bill automatically.
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="rounded-2xl bg-[#7C5CFC] px-5 py-3 font-bold text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA] disabled:opacity-60"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh sales"}
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
            icon="₹"
            label="Total sales"
            value={`₹${todaySales.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits: 2,
              }
            )}`}
            tone="purple"
          />

          <StatCard
            icon="🛒"
            label="Items sold"
            value={itemsSold}
            tone="blue"
          />

          <StatCard
            icon="🧾"
            label="Transactions"
            value={sales.length}
            tone="green"
          />

        </section>

        {/* SALE WORKSPACE */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">

          {/* RECORD SALE */}
          <div className="rounded-[28px] border border-[#E8E1F1] bg-white p-6 shadow-sm lg:p-8">

            <div>
              <p className="text-xs font-black tracking-wider text-[#7C5CFC]">
                NEW TRANSACTION
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Add a shop sale
              </h2>

              <p className="mt-1 text-sm text-[#777187]">
                Stock and billing will update automatically.
              </p>
            </div>

            {/* PRODUCT */}
            <div className="mt-7">
              <label className="text-sm font-bold text-[#625C6C]">
                Product
              </label>

              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setError("");
                  setMessage("");
                }}
                disabled={loading || selling}
                className="mt-2 w-full rounded-2xl border border-[#E5DFEE] bg-[#FBFAFD] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
              >
                <option value="">
                  Select a product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.name} — {product.stock} in stock
                  </option>
                ))}
              </select>
            </div>

            {/* PRODUCT PREVIEW */}
            {selectedProduct && (
              <div className="mt-4 rounded-2xl bg-[#F8F5FF] p-4">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                      📦
                    </div>

                    <div>
                      <p className="font-bold">
                        {selectedProduct.name}
                      </p>

                      <p className="text-xs text-[#777187]">
                        {selectedProduct.category}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#8D8798]">
                      Price
                    </p>

                    <p className="font-black">
                      ₹{selectedProduct.price}
                    </p>
                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#9B95A5]">
                      Available
                    </p>

                    <p className="mt-1 font-black">
                      {selectedProduct.stock} units
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#9B95A5]">
                      After sale
                    </p>

                    <p className="mt-1 font-black">
                      {Math.max(
                        0,
                        selectedProduct.stock -
                          saleQuantity
                      )}{" "}
                      units
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* QUANTITY */}
            <div className="mt-5">
              <label className="text-sm font-bold text-[#625C6C]">
                Quantity sold
              </label>

              <div className="mt-2 flex items-center gap-3">

                <button
                  onClick={() =>
                    setQuantity(
                      String(
                        Math.max(
                          1,
                          saleQuantity - 1
                        )
                      )
                    )
                  }
                  disabled={selling}
                  className="h-12 w-12 rounded-xl border border-[#E5DFEE] bg-white text-xl font-bold text-[#625C6C] hover:bg-[#F8F5FF]"
                >
                  −
                </button>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value)
                  }
                  className="h-12 flex-1 rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] px-4 text-center text-lg font-black outline-none focus:border-[#B9A9F3] focus:bg-white focus:ring-4 focus:ring-[#EEE9FF]"
                />

                <button
                  onClick={() =>
                    setQuantity(
                      String(saleQuantity + 1)
                    )
                  }
                  disabled={selling}
                  className="h-12 w-12 rounded-xl border border-[#E5DFEE] bg-white text-xl font-bold text-[#625C6C] hover:bg-[#F8F5FF]"
                >
                  +
                </button>

              </div>
            </div>

            {/* TOTAL */}
            <div className="mt-5 rounded-2xl border border-[#E4DCF9] bg-[#F7F3FF] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-[#8A7BB7]">
                    Sale total
                  </p>

                  <p className="mt-1 text-sm text-[#777187]">
                    {saleQuantity || 0} ×{" "}
                    {selectedProduct
                      ? selectedProduct.name
                      : "product"}
                  </p>
                </div>

                <p className="text-2xl font-black text-[#6B4FE0]">
                  ₹
                  {estimatedTotal.toLocaleString(
                    "en-IN"
                  )}
                </p>

              </div>

            </div>

            {/* SUBMIT */}
            <button
              onClick={recordSale}
              disabled={
                selling ||
                loading ||
                !selectedProduct ||
                saleQuantity <= 0
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C5CFC] px-5 py-4 font-black text-white shadow-lg shadow-[#7C5CFC]/15 transition hover:bg-[#6E4FEA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selling ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Recording sale...
                </>
              ) : (
                <>
                  ✓ Record Sale & Generate Bill
                </>
              )}
            </button>

          </div>

          {/* AUTOMATION CARD */}
          <div className="rounded-[28px] bg-[#29243A] p-6 text-white shadow-[0_12px_35px_rgba(41,36,58,0.12)] lg:p-8">

            <div className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-[#C9BCFF]">
              ⚡ AUTOMATED WORKFLOW
            </div>

            <h2 className="mt-4 text-2xl font-black">
              One sale.
              <br />
              Multiple updates.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/55">
              You don't need to separately update
              inventory and create a bill.
            </p>

            <div className="mt-8 space-y-5">

              <Workflow
                number="01"
                icon="🛒"
                title="Sale recorded"
                text="Product and quantity are saved."
              />

              <Workflow
                number="02"
                icon="📦"
                title="Stock reduced"
                text="Inventory automatically reflects the sale."
              />

              <Workflow
                number="03"
                icon="🧾"
                title="Bill generated"
                text="A bill is created automatically."
              />

              <Workflow
                number="04"
                icon="🔔"
                title="Low-stock checked"
                text="An alert appears if stock falls below the minimum."
              />

            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-white/40">
                DUKAANAI SHORTCUT
              </p>

              <p className="mt-2 text-sm leading-6 text-white/70">
                “Do bread bech do”
              </p>

              <Link
                href="/dukaanai"
                className="mt-3 inline-block text-sm font-bold text-[#C9BCFF]"
              >
                Try voice selling →
              </Link>
            </div>

          </div>

        </section>

        {/* SALES HISTORY */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#E8E1F1] bg-white shadow-sm">

          <div className="border-b border-[#EEEAF3] p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                  TRANSACTION HISTORY
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Recent sales
                </h2>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9B95A5]">
                  🔎
                </span>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search sales..."
                  className="rounded-xl border border-[#E5DFEE] bg-[#FBFAFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#B9A9F3]"
                />
              </div>

            </div>

          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-[#777187]">
              Loading sales...
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">🧾</div>

              <p className="mt-3 font-bold">
                No sales found
              </p>

              <p className="mt-1 text-sm text-[#777187]">
                Your completed sales will appear here.
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
                        Sale
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Product
                      </th>

                      <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Quantity
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[#9B95A5]">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.map(
                      (sale) => (
                        <tr
                          key={sale.id}
                          className="border-b border-[#F3EFF6] last:border-0 hover:bg-[#FCFAFF]"
                        >
                          <td className="px-6 py-5">
                            <span className="rounded-lg bg-[#F1EDFF] px-2.5 py-1.5 text-xs font-bold text-[#6B4FE0]">
                              #{sale.id}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-bold">
                              {sale.product_name}
                            </p>
                          </td>

                          <td className="px-6 py-5 text-[#625C6C]">
                            {sale.quantity}
                          </td>

                          <td className="px-6 py-5 text-right font-black">
                            ₹
                            {sale.total_amount.toLocaleString(
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
                {filteredSales.map(
                  (sale) => (
                    <div
                      key={sale.id}
                      className="rounded-2xl bg-[#FAF8FC] p-4"
                    >
                      <div className="flex items-center justify-between">

                        <div>
                          <p className="font-bold">
                            {sale.product_name}
                          </p>

                          <p className="mt-1 text-xs text-[#8B8595]">
                            Sale #{sale.id} ·{" "}
                            {sale.quantity} units
                          </p>
                        </div>

                        <p className="font-black text-[#6B4FE0]">
                          ₹
                          {sale.total_amount.toLocaleString(
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
  value: string | number;
  tone: "purple" | "blue" | "green";
}) {
  const backgrounds = {
    purple: "bg-[#F1EDFF]",
    blue: "bg-[#EEF5FF]",
    green: "bg-[#EDF9F3]",
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

function Workflow({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-black text-[#C9BCFF]">
        {number}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <p className="font-bold">
            {title}
          </p>
        </div>

        <p className="mt-1 text-sm leading-6 text-white/45">
          {text}
        </p>
      </div>

    </div>
  );
}