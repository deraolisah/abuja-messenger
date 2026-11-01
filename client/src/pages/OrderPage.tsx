import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  MapPin,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  VEHICLE_SEEDS,
  type DeliveryType,
  type VehicleSlug,
} from "@abuja-messenger/contracts";

import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import {
  DELIVERY_TYPE_META,
  DEMO_MODE,
  DISTRICTS,
  estimateFare,
  formatDuration,
  formatNaira,
  getVehicle,
  makeDemoCode,
  routeDistanceKm,
} from "../lib/pricing";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                 */
/* ------------------------------------------------------------------ */

type Party = { district: string; address: string; name: string; phone: string };
type PaymentMethod = "card" | "transfer" | "cash";

type Form = {
  pickup: Party;
  dropoff: Party;
  category: string;
  description: string;
  weightKg: string;
  fragile: boolean;
  vehicle: VehicleSlug;
  deliveryType: DeliveryType;
  scheduledFor: string;
  paymentMethod: PaymentMethod;
  notes: string;
  agreed: boolean;
};

type Errors = Record<string, string>;

const STEPS = [
  { id: "route", label: "Route" },
  { id: "package", label: "Package" },
  { id: "ride", label: "Ride & timing" },
  { id: "pay", label: "Review & pay" },
] as const;

const CATEGORIES = [
  "Documents",
  "Food & drinks",
  "Parcel or box",
  "Groceries",
  "Clothing & shoes",
  "Electronics",
  "Gift or cake",
  "Other",
];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "card", label: "Card", hint: "Pay securely online (Paystack)" },
  { id: "transfer", label: "Bank transfer", hint: "Account details shown after booking" },
  { id: "cash", label: "Cash at pickup", hint: "Pay the rider when they collect" },
];

const DELIVERY_ICONS: Record<DeliveryType, typeof Zap> = {
  same_day: Clock3,
  express: Zap,
  scheduled: CalendarClock,
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 outline-none transition focus:border-abuja-blue focus:ring-2 focus:ring-abuja-blue/20";

const PHONE_RE = /^(\+234|0)[789][01]\d{8}$/;

const emptyParty: Party = { district: "", address: "", name: "", phone: "" };

/* ------------------------------------------------------------------ */
/*  Small pieces                                                      */
/* ------------------------------------------------------------------ */

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function DistrictSelect({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">Choose area</option>
      {DISTRICTS.filter((d) => d.name !== exclude || d.name === value).map((d) => (
        <option key={d.name} value={d.name}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                done
                  ? "bg-abuja-blue text-white"
                  : active
                    ? "bg-ink text-white"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`hidden text-xs font-semibold sm:block ${
                active ? "text-ink" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function OrderPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<Form>(() => {
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    const known = (n: string) => (DISTRICTS.some((d) => d.name === n) ? n : "");
    return {
      pickup: { ...emptyParty, district: known(from), name: user?.displayName ?? "" },
      dropoff: { ...emptyParty, district: known(to) },
      category: "",
      description: "",
      weightKg: "2",
      fragile: false,
      vehicle: "two-wheeler",
      deliveryType: "same_day",
      scheduledFor: "",
      paymentMethod: "card",
      notes: "",
      agreed: false,
    };
  });

  const setParty = (who: "pickup" | "dropoff", patch: Partial<Party>) =>
    setForm((f) => ({ ...f, [who]: { ...f[who], ...patch } }));
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const weight = Number(form.weightKg) || 0;
  const distanceKm = routeDistanceKm(form.pickup.district, form.dropoff.district);

  const quote = useMemo(() => {
    if (distanceKm == null) return null;
    return estimateFare({
      vehicle: form.vehicle,
      distanceKm,
      deliveryType: form.deliveryType,
    });
  }, [distanceKm, form.vehicle, form.deliveryType]);

  // If the parcel is too heavy for the chosen vehicle, move up automatically.
  const fits = (slug: VehicleSlug) => weight <= getVehicle(slug).maxWeightKg;

  /* ------------------------------ validation ------------------------------ */

  function validate(stepIndex: number): Errors {
    const e: Errors = {};
    if (stepIndex === 0) {
      (["pickup", "dropoff"] as const).forEach((who) => {
        const p = form[who];
        if (!p.district) e[`${who}.district`] = "Choose an area.";
        if (p.address.trim().length < 6) e[`${who}.address`] = "Add a street, building or landmark.";
        if (p.name.trim().length < 2) e[`${who}.name`] = "Enter a name.";
        if (!PHONE_RE.test(p.phone.replace(/\s/g, "")))
          e[`${who}.phone`] = "Enter a valid Nigerian number, e.g. 0803 123 4567.";
      });
      if (form.pickup.district && form.pickup.district === form.dropoff.district && !e["dropoff.address"]) {
        // same-area deliveries are allowed; nothing to flag
      }
    }
    if (stepIndex === 1) {
      if (!form.category) e.category = "Choose what you are sending.";
      if (form.description.trim().length < 3) e.description = "Briefly describe the item.";
      if (!(weight > 0)) e.weightKg = "Enter an approximate weight.";
      else if (weight > getVehicle("mini-van").maxWeightKg)
        e.weightKg = "That is over our maximum load. Contact us for large moves.";
    }
    if (stepIndex === 2) {
      if (!fits(form.vehicle)) e.vehicle = "This vehicle can't carry that weight. Pick a larger one.";
      if (form.deliveryType === "scheduled") {
        if (!form.scheduledFor) e.scheduledFor = "Pick a pickup date and time.";
        else if (new Date(form.scheduledFor).getTime() < Date.now() + 30 * 60_000)
          e.scheduledFor = "Choose a time at least 30 minutes from now.";
      }
    }
    if (stepIndex === 3 && !form.agreed) e.agreed = "Please confirm to continue.";
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    // Auto-bump vehicle when entering the ride step with a heavy parcel.
    if (step === 1 && !fits(form.vehicle)) {
      const bigger = VEHICLE_SEEDS.find((v) => weight <= v.maxWeightKg);
      if (bigger) set("vehicle", bigger.slug);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const e = validate(3);
    setErrors(e);
    if (Object.keys(e).length || !quote) return;

    setSubmitting(true);
    setSubmitError("");
    const payload = {
      pickup: form.pickup,
      dropoff: form.dropoff,
      package: {
        category: form.category,
        description: form.description.trim(),
        weightKg: weight,
        fragile: form.fragile,
      },
      vehicleSlug: form.vehicle,
      deliveryType: form.deliveryType,
      scheduledFor: form.deliveryType === "scheduled" ? form.scheduledFor : undefined,
      paymentMethod: form.paymentMethod,
      notes: form.notes.trim() || undefined,
    };

    try {
      const res = await api.post<{ trackingCode: string; checkoutUrl?: string }>(
        "/deliveries",
        payload,
      );
      if (res.data.checkoutUrl) {
        window.location.assign(res.data.checkoutUrl); // hand off to Paystack
        return;
      }
      setTrackingCode(res.data.trackingCode);
    } catch {
      if (DEMO_MODE) setTrackingCode(makeDemoCode());
      else setSubmitError("We couldn't place your booking. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can still read the code */
    }
  }

  /* ------------------------------ confirmation ------------------------------ */

  if (trackingCode) {
    return (
      <main className="container-shell py-16 pt-24 md:pt-16">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center ring-1 ring-slate-100">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Delivery booked</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            We're finding the nearest rider now. Keep this tracking code. It's all you need to follow
            your delivery.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary/10 px-5 py-4">
            <span className="font-display text-2xl font-semibold tracking-wider">{trackingCode}</span>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {quote && (
            <p className="mt-4 text-sm text-slate-500">
              Estimated fare <strong className="text-ink">{formatNaira(quote.fareKobo)}</strong>
              {form.paymentMethod === "transfer" && " · Transfer details will be sent to you"}
              {form.paymentMethod === "cash" && " · Pay the rider at pickup"}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/track/${trackingCode}`} className="button-primary text-sm">
              Track this delivery
            </Link>
            <Link to="/" className="button-secondary text-sm">
              Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------ steps ------------------------------ */

  const vehicle = getVehicle(form.vehicle);
  const err = (k: string) => errors[k];

  const routeStep = (
    <div className="grid gap-8">
      {(["pickup", "dropoff"] as const).map((who) => {
        const p = form[who];
        const isPickup = who === "pickup";
        return (
          <fieldset key={who} className="grid gap-4">
            <legend className="mb-1 flex items-center gap-2 text-base font-semibold">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-white ${
                  isPickup ? "bg-abuja-blue" : "bg-ink"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
              </span>
              {isPickup ? "Pickup" : "Drop-off"}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Area" error={err(`${who}.district`)}>
                <DistrictSelect
                  value={p.district}
                  onChange={(v) => setParty(who, { district: v })}
                />
              </Field>
              <Field
                label={isPickup ? "Sender's name" : "Recipient's name"}
                error={err(`${who}.name`)}
              >
                <input
                  className={inputCls}
                  value={p.name}
                  onChange={(e) => setParty(who, { name: e.target.value })}
                  autoComplete={isPickup ? "name" : "off"}
                />
              </Field>
            </div>
            <Field
              label="Street, building or landmark"
              error={err(`${who}.address`)}
              hint="The more exact, the faster the rider finds it."
            >
              <input
                className={inputCls}
                value={p.address}
                onChange={(e) => setParty(who, { address: e.target.value })}
                placeholder="e.g. Plot 14, Aminu Kano Crescent, beside the pharmacy"
              />
            </Field>
            <Field label="Phone number" error={err(`${who}.phone`)}>
              <input
                className={inputCls}
                type="tel"
                inputMode="tel"
                value={p.phone}
                onChange={(e) => setParty(who, { phone: e.target.value })}
                placeholder="0803 123 4567"
                autoComplete={isPickup ? "tel" : "off"}
              />
            </Field>
          </fieldset>
        );
      })}
    </div>
  );

  const packageStep = (
    <div className="grid gap-5">
      <Field label="What are you sending?" error={err("category")}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("category", c)}
              aria-pressed={form.category === c}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                form.category === c
                  ? "border-ink bg-ink text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Describe the item" error={err("description")}>
        <input
          className={inputCls}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="e.g. Sealed envelope with two documents"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Approximate weight (kg)" error={err("weightKg")}>
          <input
            className={inputCls}
            type="number"
            min={0.1}
            step={0.5}
            inputMode="decimal"
            value={form.weightKg}
            onChange={(e) => set("weightKg", e.target.value)}
          />
        </Field>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:mt-7">
          <input
            type="checkbox"
            checked={form.fragile}
            onChange={(e) => set("fragile", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-abuja-blue"
          />
          <span className="text-sm">
            <span className="font-semibold">Fragile</span>
            <span className="block text-xs text-slate-500">Rider handles it with extra care.</span>
          </span>
        </label>
      </div>
      <p className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        We can't carry cash, illegal items, weapons, or live animals. Riders may ask to check the
        item at pickup.
      </p>
    </div>
  );

  const rideStep = (
    <div className="grid gap-8">
      <div>
        <h3 className="mb-3 text-base font-semibold">Choose a vehicle</h3>
        {err("vehicle") && <p className="mb-2 text-xs font-medium text-red-600">{err("vehicle")}</p>}
        <div className="grid gap-3">
          {VEHICLE_SEEDS.map((v) => {
            const ok = fits(v.slug);
            const selected = form.vehicle === v.slug;
            const price =
              distanceKm != null
                ? estimateFare({ vehicle: v.slug, distanceKm, deliveryType: form.deliveryType })
                : null;
            const Icon = v.slug === "two-wheeler" ? Bike : Truck;
            return (
              <button
                key={v.slug}
                type="button"
                disabled={!ok}
                onClick={() => set("vehicle", v.slug)}
                aria-pressed={selected}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-abuja-blue bg-primary/10 ring-2 ring-abuja-blue/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${!ok ? "cursor-not-allowed opacity-45" : ""}`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-abuja-blue ring-1 ring-slate-100">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{v.name}</span>
                  <span className="block text-xs leading-5 text-slate-500">{v.description}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Up to {v.maxWeightKg} kg{!ok && " · too small for this item"}
                  </span>
                </span>
                {price && ok && (
                  <span className="text-right text-sm font-semibold">{formatNaira(price.fareKobo)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold">How fast?</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(DELIVERY_TYPE_META) as DeliveryType[]).map((t) => {
            const meta = DELIVERY_TYPE_META[t];
            const Icon = DELIVERY_ICONS[t];
            const selected = form.deliveryType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => set("deliveryType", t)}
                aria-pressed={selected}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-abuja-blue bg-primary/10 ring-2 ring-abuja-blue/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <Icon className="h-5 w-5 text-abuja-blue" />
                <span className="mt-3 block text-sm font-semibold">{meta.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">{meta.blurb}</span>
              </button>
            );
          })}
        </div>

        {form.deliveryType === "scheduled" && (
          <div className="mt-4 max-w-xs">
            <Field label="Pickup date and time" error={err("scheduledFor")}>
              <input
                className={inputCls}
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) => set("scheduledFor", e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );

  const reviewRows: [string, string][] = [
    ["From", `${form.pickup.address}, ${form.pickup.district}`],
    ["Sender", `${form.pickup.name} · ${form.pickup.phone}`],
    ["To", `${form.dropoff.address}, ${form.dropoff.district}`],
    ["Recipient", `${form.dropoff.name} · ${form.dropoff.phone}`],
    ["Item", `${form.category}: ${form.description}${form.fragile ? " (fragile)" : ""}, ${weight} kg`],
    [
      "Ride",
      `${vehicle.name} · ${DELIVERY_TYPE_META[form.deliveryType].label}${
        form.deliveryType === "scheduled" && form.scheduledFor
          ? ` · ${new Date(form.scheduledFor).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}`
          : ""
      }`,
    ],
  ];

  const payStep = (
    <div className="grid gap-6">
      <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {reviewRows.map(([k, v]) => (
          <div key={k} className="grid gap-1 p-4 sm:grid-cols-[110px_1fr] sm:gap-4">
            <dt className="text-xs font-semibold text-slate-400">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="mb-3 text-base font-semibold">How would you like to pay?</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PAYMENT_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("paymentMethod", o.id)}
              aria-pressed={form.paymentMethod === o.id}
              className={`rounded-2xl border p-4 text-left transition ${
                form.paymentMethod === o.id
                  ? "border-abuja-blue bg-primary/10 ring-2 ring-abuja-blue/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <Field label="Note for the rider (optional)">
        <textarea
          className={`${inputCls} min-h-24 resize-y`}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Gate code, who to ask for, best entrance…"
        />
      </Field>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={form.agreed}
          onChange={(e) => set("agreed", e.target.checked)}
          className="mt-1 h-4 w-4 accent-abuja-blue"
        />
        <span className="text-sm text-slate-600">
          I confirm the details are correct and my item isn't on the prohibited list.
          {err("agreed") && (
            <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
              {err("agreed")}
            </span>
          )}
        </span>
      </label>

      {submitError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </p>
      )}
    </div>
  );

  const stepTitles = [
    ["Where is it going?", "Tell us where to collect and where to deliver."],
    ["What are we carrying?", "A few details help us send the right rider."],
    ["Pick the ride and timing", "Prices update as you choose."],
    ["Check and pay", "Make sure everything looks right before you book."],
  ];

  /* ------------------------------ layout ------------------------------ */

  return (
    <main className="container-shell py-10 pt-24 md:pt-10">
      <div className="mx-auto max-w-5xl">
        <Stepper current={step} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 sm:p-8">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              {stepTitles[step][0]}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{stepTitles[step][1]}</p>

            <div className="mt-8">
              {step === 0 && routeStep}
              {step === 1 && packageStep}
              {step === 2 && rideStep}
              {step === 3 && payStep}
            </div>

            <div className="mt-10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-ink disabled:invisible"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="button-primary text-sm">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="button-primary text-sm disabled:opacity-60"
                >
                  {submitting
                    ? "Placing booking…"
                    : quote
                      ? `Book delivery · ${formatNaira(quote.fareKobo)}`
                      : "Book delivery"}
                </button>
              )}
            </div>
          </section>

          {/* price summary */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-3xl bg-ink p-6 text-white">
              <p className="text-sm font-semibold text-slate-300">Your delivery</p>

              {distanceKm == null ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">
                  Choose a pickup and drop-off area to see your price.
                </p>
              ) : (
                <>
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <span className="font-semibold">{form.pickup.district}</span>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                    <span className="font-semibold">{form.dropoff.district}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">About {distanceKm} km</p>

                  <p className="mt-6 font-display text-4xl font-semibold tracking-tight">
                    {quote ? formatNaira(quote.fareKobo) : "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {vehicle.name} · {DELIVERY_TYPE_META[form.deliveryType].label}
                    {quote && form.deliveryType !== "scheduled" && ` · about ${formatDuration(quote.etaMinutes)}`}
                  </p>
                </>
              )}

              <div className="mt-6 flex items-start gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                The final fare is confirmed on booking. No surprise charges, and you can cancel free
                before a rider picks up.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}