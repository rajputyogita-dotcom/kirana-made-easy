"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  const [shopName, setShopName] =
    useState("");

  const [ownerName, setOwnerName] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [category, setCategory] =
    useState("Kirana / General Store");

  const [loading, setLoading] =
    useState(false);

  function handleSetup(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!shopName.trim()) {
      return;
    }

    setLoading(true);

    const shop = {
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      location: location.trim(),
      category,
    };

    localStorage.setItem(
      "kme_shop",
      JSON.stringify(shop)
    );

    localStorage.setItem(
      "kme_setup_complete",
      "true"
    );

    localStorage.setItem(
      "kme_session",
      "true"
    );

    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  }

  return (
    <main className="min-h-screen bg-[#FAF8FC]">

      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10">

        <div className="grid w-full overflow-hidden rounded-[30px] border border-[#E8E1F1] bg-white shadow-[0_20px_60px_rgba(75,55,100,0.08)] lg:grid-cols-[.8fr_1.2fr]">

          {/* LEFT */}
          <section className="bg-[#29243A] p-8 text-white lg:p-10">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C5CFC] font-black">
              K
            </div>

            <p className="mt-12 text-xs font-black uppercase tracking-widest text-[#BDAEFF]">
              ONE LAST STEP
            </p>

            <h1 className="mt-3 text-4xl font-black leading-tight">
              Tell us about
              <br />
              <span className="text-[#BDAEFF]">
                your shop.
              </span>
            </h1>

            <p className="mt-5 text-sm leading-7 text-white/50">
              We'll personalize your workspace so
              DukaanAI knows which shop it is helping.
            </p>

            <div className="mt-10 space-y-4">

              <Info
                icon="📦"
                title="Inventory"
                text="Track stock and low-stock items."
              />

              <Info
                icon="🧾"
                title="Bills"
                text="Keep your sales organized."
              />

              <Info
                icon="🎙️"
                title="DukaanAI"
                text="Run your shop by speaking."
              />

            </div>

          </section>

          {/* FORM */}
          <section className="p-7 sm:p-10">

            <p className="text-sm font-bold text-[#7C5CFC]">
              SHOP SETUP
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Set up your workspace
            </h2>

            <p className="mt-2 text-sm text-[#777187]">
              You can change these details later
              from Settings.
            </p>

            <form
              onSubmit={handleSetup}
              className="mt-7 space-y-5"
            >

              <Input
                label="Shop name"
                placeholder="e.g. Sharma General Store"
                value={shopName}
                onChange={setShopName}
                required
              />

              <Input
                label="Owner name"
                placeholder="e.g. Yogita Rajput"
                value={ownerName}
                onChange={setOwnerName}
              />

              <Input
                label="Location"
                placeholder="e.g. Ghaziabad, UP"
                value={location}
                onChange={setLocation}
              />

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#777187]">
                  Shop type
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#E5DFEE] bg-white px-4 py-3.5 text-sm font-medium outline-none focus:border-[#A997F5] focus:ring-4 focus:ring-[#EEE9FF]"
                >
                  <option>
                    Kirana / General Store
                  </option>
                  <option>
                    Grocery Store
                  </option>
                  <option>
                    Supermarket
                  </option>
                  <option>
                    Dairy / Daily Needs
                  </option>
                  <option>
                    Other
                  </option>
                </select>

              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !shopName.trim()
                }
                className="w-full rounded-xl bg-[#7C5CFC] py-3.5 text-sm font-black text-white shadow-lg shadow-[#7C5CFC]/20 transition hover:bg-[#6E4FEA] disabled:opacity-50"
              >
                {loading
                  ? "Setting up..."
                  : "Enter my shop →"}
              </button>

            </form>

          </section>

        </div>

      </div>

    </main>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#777187]">
        {label}
      </label>

      <input
        required={required}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E5DFEE] bg-white px-4 py-3.5 text-sm font-medium outline-none placeholder:text-[#B0AAB8] focus:border-[#A997F5] focus:ring-4 focus:ring-[#EEE9FF]"
      />

    </div>
  );
}

function Info({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-white/40">
          {text}
        </p>
      </div>

    </div>
  );
}