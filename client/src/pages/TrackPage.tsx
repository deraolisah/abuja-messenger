import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  KeyRound,
  MapPin,
  Phone,
  Search,
  Share2,
  Star,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { STATUS_LABELS } from "@abuja-messenger/contracts";

import { api } from "../lib/api";
import {
  DELIVERY_TYPE_META,
  DEMO_MODE,
  formatDuration,
  formatNaira,
  getVehicle,
} from "../lib/pricing";
import {
  DEMO_SEQUENCE,
  TIMELINE_STEPS,
  buildDemoSnapshot,
  routeProgressFor,
  stepIndexFor,
  type TrackingSnapshot,
} from "../lib/tracking";

type LoadState = "idle" | "loading" | "ready" | "notfound" | "error";

const POLL_MS = 10_000;
const DEMO_ADVANCE_MS = 5_000;

/* ------------------------------------------------------------------ */
/*  Lookup form                                                       */
/* ------------------------------------------------------------------ */

function LookupForm({
  initial = "",
  compact = false,
}: {
  initial?: string;
  compact?: boolean;
}) {
  const [code, setCode] = useState(initial);
  const navigate = useNavigate();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean) navigate(`/track/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={onSubmit} className={`flex gap-2 ${compact ? "" : "mx-auto max-w-md"}`}>
      <label className="sr-only" htmlFor="tracking-code">
        Tracking code
      </label>
      <input
        id="tracking-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter tracking code, e.g. AM-7K2P9X"
        autoCapitalize="characters"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-abuja-blue focus:ring-2 focus:ring-abuja-blue/20"
      />
      <button type="submit" className="button-primary text-sm">
        <Search className="h-4 w-4" />
        Track
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Route map (stylised; swap for Mapbox/Google later)                */
/* ------------------------------------------------------------------ */

const ROUTE_D = "M70 250 C 190 262, 250 110, 360 150 S 500 70, 535 70";

function RouteMap({
  progress,
  from,
  to,
  hidden = false,
}: {
  progress: number;
  from: string;
  to: string;
  hidden?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [point, setPoint] = useState({ x: 70, y: 250 });

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    if (!len) return;
    const clamped = Math.min(Math.max(progress, 0), 1);
    const p = path.getPointAtLength(len * clamped);
    setPoint({ x: p.x, y: p.y });
  }, [progress]);

  const safeProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl bg-primary/10">
        <svg
          viewBox="0 0 600 320"
          role="img"
          aria-label={`Route from ${from} to ${to}`}
          className="block w-full"
        >
          {/* faint street grid */}
          <g stroke="currentColor" className="text-primary/20" strokeWidth="1">
            {[40, 100, 160, 220, 280].map((y) => (
              <line key={y} x1="0" x2="600" y1={y} y2={y + (y % 80 === 0 ? 14 : -10)} />
            ))}
            {[60, 160, 260, 360, 460, 560].map((x) => (
              <line key={x} y1="0" y2="320" x1={x} x2={x + 20} />
            ))}
          </g>

          {/* full route */}
          <path
            ref={pathRef}
            d={ROUTE_D}
            fill="none"
            stroke="currentColor"
            className="text-slate-300"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="2 10"
          />
          {/* travelled part */}
          {safeProgress > 0 && (
            <path
              d={ROUTE_D}
              fill="none"
              stroke="currentColor"
              className="text-abuja-blue"
              strokeWidth="5"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={`${safeProgress} 1`}
              style={{ transition: "stroke-dasharray 1200ms ease" }}
            />
          )}

          {/* pickup */}
          <circle cx="70" cy="250" r="9" className="fill-white stroke-abuja-blue" strokeWidth="4" />
          <text
            x="70"
            y="282"
            textAnchor="middle"
            className="fill-slate-600 text-[13px] font-semibold"
          >
            {from}
          </text>
          {/* drop-off */}
          <rect x="526" y="61" width="18" height="18" rx="4" className="fill-ink" />
          <text
            x="535"
            y="48"
            textAnchor="middle"
            className="fill-slate-600 text-[13px] font-semibold"
          >
            {to}
          </text>

          {/* rider */}
          {!hidden && (
            <g
              style={{
                transform: `translate(${point.x}px, ${point.y}px)`,
                transition: "transform 1200ms ease",
              }}
            >
              <circle r="18" className="fill-abuja-blue/20" />
              <circle r="10" className="fill-abuja-blue stroke-white" strokeWidth="3" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-abuja-blue bg-white" /> Pickup
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink" /> Drop-off
        </span>
        {!hidden && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-abuja-blue" /> Rider
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function TrackPage() {
  const { trackingCode: rawCode } = useParams();
  const code = rawCode ? decodeURIComponent(rawCode).toUpperCase() : "";

  const [state, setState] = useState<LoadState>("idle");
  const [data, setData] = useState<TrackingSnapshot | null>(null);
  const [copied, setCopied] = useState<"" | "pin" | "link">("");

  // Demo mode: any AM-… code plays a simulated delivery with no backend.
  const isDemo = DEMO_MODE && code.startsWith("AM-");
  const [demoStage, setDemoStage] = useState(2);
  const demoStart = useRef(Date.now() - 8 * 60_000);

  useEffect(() => {
    if (isDemo) {
      setDemoStage(2);
      demoStart.current = Date.now() - 8 * 60_000;
    }
  }, [code, isDemo]);

  // Auto-advance the simulation so the demo plays itself.
  useEffect(() => {
    if (!isDemo || demoStage >= DEMO_SEQUENCE.length - 1) return;
    const t = setTimeout(() => setDemoStage((s) => s + 1), DEMO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [isDemo, demoStage]);

  const demoData = useMemo(
    () => (isDemo ? buildDemoSnapshot(code, demoStage, demoStart.current) : null),
    [isDemo, code, demoStage],
  );

  // Real data: fetch, then poll until a final status.
  useEffect(() => {
    if (!code || isDemo) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function load(first: boolean) {
      if (first) setState("loading");
      try {
        const res = await api.get<TrackingSnapshot>(
          `/deliveries/track/${encodeURIComponent(code)}`,
        );
        if (cancelled) return;
        setData(res.data);
        setState("ready");
        const done = ["delivered", "cancelled", "failed"].includes(res.data.status);
        if (!done) timer = setTimeout(() => load(false), POLL_MS);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setState("notfound");
          return; // stop polling — delivery no longer exists
        }
        if (first) {
          setState("error");
        } else {
          timer = setTimeout(() => load(false), POLL_MS); // keep last good data on blips
        }
      }
    }

    void load(true);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, isDemo]);

  const view = isDemo ? demoData : data;
  const viewState: LoadState = isDemo ? "ready" : code ? state : "idle";

  async function copy(text: string, which: "pin" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      /* ignore */
    }
  }

  async function share() {
    const url = `${window.location.origin}/track/${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Track my delivery", url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    void copy(url, "link");
  }

  /* ------------------------------ empty / error states ------------------------------ */

  if (!code || viewState === "idle") {
    return (
      <main className="container-shell py-20 pt-28 text-center md:pt-20">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
          Where's my delivery?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Enter the tracking code from your booking confirmation or SMS.
        </p>
        <div className="mt-8">
          <LookupForm />
        </div>
        {DEMO_MODE && (
          <p className="mt-6 text-xs text-slate-400">
            Demo: try{" "}
            <Link to="/track/AM-DEMO01" className="font-semibold text-abuja-blue underline">
              AM-DEMO01
            </Link>
          </p>
        )}
      </main>
    );
  }

  if (viewState === "loading") {
    return (
      <main className="container-shell py-24 text-center text-sm text-slate-500" aria-live="polite">
        Finding {code}…
      </main>
    );
  }

  if (viewState === "notfound" || viewState === "error" || !view) {
    return (
      <main className="container-shell py-20 pt-28 text-center md:pt-20">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
          {viewState === "notfound" ? "We couldn't find that code" : "Something went wrong"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {viewState === "notfound"
            ? `Nothing matches ${code}. Check the code for typos. Codes start with AM- and have no spaces.`
            : "We couldn't load this delivery. Check your connection and try again."}
        </p>
        <div className="mt-8">
          <LookupForm initial={code} />
        </div>
      </main>
    );
  }

  /* ------------------------------ tracking view ------------------------------ */

  const stepIdx = stepIndexFor(view.status);
  const failed = view.status === "cancelled" || view.status === "failed";
  const delivered = view.status === "delivered";
  const progress = failed ? 0 : routeProgressFor(view.status);
  const vehicle = getVehicle(view.vehicleSlug);

  const badge = failed
    ? "bg-red-50 text-red-700"
    : delivered
      ? "bg-mint text-emerald-700"
      : "bg-primary/10 text-abuja-blue";

  const statusLabel = STATUS_LABELS[view.status] ?? view.status;
  const phoneHref = view.rider
    ? `tel:${view.rider.phone.replace(/[^\d+]/g, "")}`
    : undefined;

  const etaContent = failed ? (
    <>—</>
  ) : delivered ? (
    <>Delivered</>
  ) : view.etaMinutes != null ? (
    <>
      Arriving in about <strong className="text-ink">{formatDuration(view.etaMinutes)}</strong>
    </>
  ) : (
    <>Calculating ETA…</>
  );

  return (
    <main className="container-shell pb-10 pt-24 md:pt-10">
      <div className="mx-auto max-w-5xl">
        {/* sticky header */}
        <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-slate-100 bg-white/85 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">Tracking code</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-wider sm:text-3xl">
                {view.trackingCode}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${badge}`}>
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300"
              >
                {copied === "link" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                {copied === "link" ? "Link copied" : "Share"}
              </button>
            </div>
          </div>
        </div>

        {failed && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-5 text-sm text-red-800"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              {view.status === "cancelled"
                ? "This delivery was cancelled. If you didn't request this, contact support."
                : "There was a problem with this delivery. Our team has been alerted and will call you shortly."}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* left column: map, PIN (mobile), timeline */}
          <div className="grid gap-6">
            <RouteMap
              progress={progress}
              from={view.pickup.district}
              to={view.dropoff.district}
              hidden={failed}
            />

            {!delivered && !failed && (
              <section className="rounded-3xl bg-ink p-6 text-white lg:hidden">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <KeyRound className="h-4 w-4 text-blue-300" />
                  Handover PIN
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-4xl font-semibold tracking-[0.3em]">
                    {view.handoverPin}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(view.handoverPin, "pin")}
                    aria-label="Copy handover PIN"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20"
                  >
                    {copied === "pin" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  The recipient gives this PIN to the rider on delivery. No PIN, no handover.
                </p>
              </section>
            )}

            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Progress</h2>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock3 className="h-4 w-4" />
                  {etaContent}
                </span>
              </div>

              <ol className="mt-6">
                {TIMELINE_STEPS.map((s, i) => {
                  const done = i < stepIdx || (delivered && i === stepIdx);
                  const active = i === stepIdx && !delivered && !failed;
                  const event = [...view.events].reverse().find((e) => stepIndexFor(e.status) === i);
                  return (
                    <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
                      {i < TIMELINE_STEPS.length - 1 && (
                        <span
                          aria-hidden
                          className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${
                            done ? "bg-abuja-blue/70" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white ${
                          done
                            ? "bg-abuja-blue/70"
                            : active
                              ? "bg-abuja-blue ring-4 ring-abuja-blue/20"
                              : "bg-slate-200"
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : active ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : null}
                      </span>
                      <div className="-mt-0.5 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            done || active ? "text-ink" : "text-slate-400"
                          }`}
                        >
                          {s.label}
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                          {done || active ? (event?.note ?? s.hint) : s.hint}
                        </p>
                      </div>
                      {event && (done || active) && (
                        <time className="text-xs text-slate-400" dateTime={event.at}>
                          {new Date(event.at).toLocaleTimeString("en-NG", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          {/* right column: rider, PIN (desktop), details */}
          <div className="grid content-start gap-6">
            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold">Your rider</h2>
              {view.rider ? (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-sm font-bold text-abuja-blue">
                      {view.rider.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{view.rider.name}</p>
                      <p className="text-xs text-slate-500">
                        {vehicle.name} · {view.rider.plate}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {view.rider.rating.toFixed(1)}
                    </span>
                  </div>
                  {!delivered && !failed && phoneHref && (
                    <a
                      href={phoneHref}
                      className="button-secondary mt-4 w-full justify-center text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Call rider
                    </a>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {failed
                    ? "No rider was assigned."
                    : "We're matching you with the nearest rider. This usually takes a few minutes."}
                </p>
              )}
            </section>

            {!delivered && !failed && (
              <section className="hidden rounded-3xl bg-ink p-6 text-white lg:block">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <KeyRound className="h-4 w-4 text-blue-300" />
                  Handover PIN
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display text-4xl font-semibold tracking-[0.3em]">
                    {view.handoverPin}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(view.handoverPin, "pin")}
                    aria-label="Copy handover PIN"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20"
                  >
                    {copied === "pin" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  The recipient gives this PIN to the rider on delivery. No PIN, no handover.
                </p>
              </section>
            )}

            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-100">
              <h2 className="text-lg font-semibold">Delivery details</h2>
              <dl className="mt-4 grid gap-4 text-sm">
                <div className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-abuja-blue" />
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">Pickup</dt>
                    <dd className="mt-0.5">
                      {view.pickup.address}, {view.pickup.district}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-abuja-purple" />
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">Drop-off</dt>
                    <dd className="mt-0.5">
                      {view.dropoff.address}, {view.dropoff.district}
                      <span className="block text-xs text-slate-500">
                        For {view.dropoff.recipientName}
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <dt className="text-xs font-semibold text-slate-400">Service</dt>
                    <dd className="mt-0.5">
                      {DELIVERY_TYPE_META[view.deliveryType].label} · {view.distanceKm} km
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs font-semibold text-slate-400">Fare</dt>
                    <dd className="mt-0.5 font-semibold">{formatNaira(view.fareKobo)}</dd>
                  </div>
                </div>
              </dl>
            </section>

            {delivered ? (
              <Link to="/order" className="button-primary justify-center text-sm">
                Send something else
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/track" className="button-secondary justify-center text-sm">
                <Search className="h-4 w-4" />
                Track another delivery
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* subtle demo pill — only exists in demo mode */}
      {isDemo && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-lg backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Demo
          <button
            type="button"
            className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold hover:bg-slate-200"
            onClick={() => setDemoStage((s) => Math.min(s + 1, DEMO_SEQUENCE.length - 1))}
          >
            Next
          </button>
          <button
            type="button"
            className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold hover:bg-slate-200"
            onClick={() => setDemoStage(0)}
          >
            Restart
          </button>
        </div>
      )}
    </main>
  );
}