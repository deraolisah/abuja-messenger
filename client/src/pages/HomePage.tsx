import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  CalendarClock,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  ShieldCheck,
  Truck,
  Wallet,
  Zap,
  Sparkles
} from "lucide-react";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { VEHICLE_SEEDS, type DeliveryType } from "@abuja-messenger/contracts";

import Rider from "../assets/hero-img.png";
import dispatchers from "../assets/dispatchers-1.png";
import deliveries from "../assets/deliveries-1.png";
import drivers from "../assets/drivers-1.png";


import { StatusPill } from "../components/StatusPill.tsx";
import {
  DELIVERY_TYPE_META,
  DISTRICTS,
  estimateFare,
  formatNaira,
  routeDistanceKm,
} from "../lib/pricing";

/* ------------------------------------------------------------------ */
/*  Content                                                           */
/* ------------------------------------------------------------------ */


const pricingPlans = [
  {
    name: "For Individual",
    description: "Manage one active project seamlessly at a time",
    price: "$59.00",
    oldPrice: "$79.00",
    features: [
      "1 Active project at a time",
      "Up to 5 GB storage",
      "Access to core tools & templates",
      "Monthly backups",
    ],
  },
  {
    name: "For Teams",
    description: "Collaborate on multiple active projects effortlessly",
    price: "$79.00",
    oldPrice: "$89.00",
    features: [
      "Manage multiple active projects simultaneously",
      "Up to 20 GB of shared storage",
      "Full access to team tools & collaboration features",
      "Priority support and monthly backups",
      "Real-time collaboration with team members",
      "Activity tracking and project analytics",
    ],
    bestDeal: true,
  },
];


// TODO: replace with the owner's real WhatsApp number (international format, no +)
const WHATSAPP_NUMBER = "2348000000000";

const steps = [
  { title: "Enter pickup and drop-off", body: "Tell us where to collect and where to deliver, and what you're sending.", icon: MapPin },
  { title: "See your price", body: "Pick a vehicle and speed. The fare is shown before you pay.", icon: Wallet },
  { title: "A rider is assigned", body: "The nearest available rider collects your item.", icon: Bike },
  { title: "Follow it live", body: "Track parcel with your code. The recipient confirms with a PIN.", icon: PackageCheck },
];

const vehicleUse: Record<string, string> = {
  "two-wheeler": "Documents, food, phones, small parcels",
  "four-seater": "Boxes, groceries, shop stock, small furniture",
  "mini-van": "Heavy loads, multiple boxes, house moves",
};

const speedIcons: Record<DeliveryType, typeof Zap> = {
  same_day: Clock3,
  express: Zap,
  scheduled: CalendarClock,
};

// const whyUs = [
//   { title: "Verified riders", body: "Every rider is vetted, trained, and identifiable by name and plate number.", image: dispatchers },
//   { title: "Live tracking", body: "Follow your item from pickup to doorstep, with an ETA that updates.", image: deliveries },
//   { title: "Fair, upfront pricing", body: "You see the fare before booking. Fares come from distance and vehicle, not guesswork.", image: drivers },
// ];

// TODO: replace with real customer quotes before the final handover
const testimonials = [
  { name: "Chiamaka O.", role: "Boutique owner, Wuse 2", quote: "My customers get their orders the same day and I can send them a tracking link. It's saved me hours of phone calls." },
  { name: "Ibrahim S.", role: "Lawyer, Maitama", quote: "I send signed documents across town every week. The handover PIN means I always know they reached the right person." },
  { name: "Funke A.", role: "Home baker, Gwarinpa", quote: "Cakes arrive in one piece. The rider called ahead and the recipient was ready." },
];

const faqs = [
  { q: "How much will my delivery cost?", a: "Price depends on distance, the vehicle you pick, and how fast you need it. Use the price checker at the top of this page, or start a booking. You'll see the fare before you pay." },
  { q: "How fast can a rider reach me?", a: "Express bookings are matched to the nearest rider, usually within minutes. Standard pickups are within about an hour. Or schedule a time that suits you." },
  { q: "Can I pay cash?", a: "Yes. Pay by card, bank transfer, or cash to the rider at pickup." },
  { q: "What can't I send?", a: "We don't carry cash, illegal items, weapons, or live animals. A rider may ask to check the item at pickup." },
  { q: "What if the recipient isn't available?", a: "Your rider will call the recipient first. If no one can receive the item, we contact you and agree on the next step before anything is returned." },
];

  // const roles = [
  //   {
  //     title: "Dispatchers",
  //     body: "Plan, optimize, and assign routes faster and instantly adapt.",
  //     image: dispatchers,
  //   },
  //   {
  //     title: "Deliveries",
  //     body: "Automatic customer notifications provide accurate ETAs.",
  //     image: deliveries,
  //   },
  //   {
  //     title: "Drivers",
  //     body: "Easy-to-follow app saves time and fuel. Drivers can create.",
  //     image: drivers,
  //   },
  // ];



/* ------------------------------------------------------------------ */
/*  Helper components                                                 */
/* ------------------------------------------------------------------ */

function FadeIn({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition:
          "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1), transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {children}
    </div>
  );
}


function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
      {/* <Sparkles className="h-3.5 w-3.5 text-abuja-blue" /> */}
      {children}
    </span>
  );
}


/* ------------------------------------------------------------------ */
/*  Small pieces                                                      */
/* ------------------------------------------------------------------ */

function SectionHeading({ tag, children }: { tag?: string; children: ReactNode }) {
  return (
    <div className="text-center">
      {tag && (
        <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          {tag}
        </span>
      )}
      <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
        {children}
      </h2>
    </div>
  );
}

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-ink">{q}</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50">
          <Plus className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-6 text-slate-500">{a}</p>
        </div>
      </div>
    </div>
  );
}

const selectCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-abuja-blue focus:ring-2 focus:ring-abuja-blue/20";

/** The hero's one memorable moment: a live price check, no sign-up needed. */
function PriceChecker() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const km = useMemo(() => (from && to ? routeDistanceKm(from, to) : null), [from, to]);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">From</span>
          <select className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Choose area</option>
            {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">To</span>
          <select className={selectCls} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Choose area</option>
            {DISTRICTS.map((d) => <option key={d.name}>{d.name}</option>)}
          </select>
        </label>
      </div>

      {km != null ? (
        <div className="mt-4 border-t border-slate-100 pt-4" aria-live="polite">
          <p className="text-xs text-slate-500">About {km} km. Standard delivery prices:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {/* {VEHICLE_SEEDS.map((v: { slug: string; name: string }) => {
              const { fareKobo } = estimateFare({ vehicle: v.slug, distanceKm: km, deliveryType: "same_day" }); */}

            {VEHICLE_SEEDS.map((v) => {
              const { fareKobo } = estimateFare({
                vehicle: v.slug,
                distanceKm: km,
                deliveryType: "same_day",
              });
              return (
                <div key={v.slug} className="rounded-xl bg-primary/10 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600">{v.name}</p>
                  <p className="font-display text-xl font-semibold">{formatNaira(fareKobo)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-2 mt-4">
            <button className="p-2">
              Cancel
            </button>
            <Link
              to={`/order?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              className="button-primary w-full justify-center text-sm sm:w-auto"
            >
              Book this delivery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 text-center">
          Pick two areas in Abuja to see prices for each vehicle.
        </p>
      )}
    </div>
  );
}

// function TrackBox() {
//   const [code, setCode] = useState("");
//   const navigate = useNavigate();
//   function onSubmit(e: FormEvent) {
//     e.preventDefault();
//     const clean = code.trim().toUpperCase();
//     if (clean) navigate(`/track/${encodeURIComponent(clean)}`);
//   }
//   return (
//     <form onSubmit={onSubmit} className="mx-auto mt-4 flex max-w-sm gap-2">
//       <label htmlFor="home-track" className="sr-only">Tracking code</label>
//       <input
//         id="home-track"
//         value={code}
//         onChange={(e) => setCode(e.target.value)}
//         placeholder="Have a tracking code?"
//         autoComplete="off"
//         className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-abuja-blue"
//       />
//       <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">Track</button>
//     </form>
//   );
// }

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function HomePage() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      <main className="text-ink">
        {/* ============================ HERO ============================ */}
        {/* <section className="relative overflow-hidden rounded-t-2xl md:rounded-t-none rounded-b-2xl bg-primary/10 md:rounded-b-3xl">
          <div className="container-shell relative">
            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-start gap-4 pt-22 md:pt-8 pb-0! text-center">
              <FadeIn delay={120}>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl md:leading-[1.05]">
                  Move it across Abuja.
                  <br />
                  <span className="text-abuja-blue">We're here to help.</span>
                </h1>
              </FadeIn>

              <FadeIn delay={240}>
                <p className="mx-auto mt-2 max-w-lg text-base leading-7 text-slate-500">
                  Abuja Messenger gives every delivery a clear next step, a fair
                  price, and a human hand behind it.
                </p>
              </FadeIn>

              <FadeIn delay={360}>
                <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a href="#how-it-works" className="hidden md:flex button-secondary text-xs"> See how it works </a>
                  <Link to="/register" className="button-primary text-xs"> 
                    Send something today 
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </FadeIn>

              <FadeIn delay={480} className="mt-2.5 w-full relative">
                <div
                  className="mx-auto h-60 w-full max-w-4xl rounded-2xl bg-top! bg-cover bg-no-repeat md:h-80"
                  style={{ backgroundImage: `url(${heroImg})` }}
                />
                <img src={heroAsset1} alt="" className="hidden sm:flex absolute bottom-4 left-8 w-30" />
                <img src={heroAsset2} alt="" className="hidden sm:flex absolute top-1/2 right-8 w-44" />
              </FadeIn>
            </div>
          </div>
        </section> */}

        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden rounded-2xl bg-primary/10 md:rounded-t-none md:rounded-b-3xl">
          <div className="container-shell">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 pt-22 text-center md:pt-8 pb-0!">
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl md:leading-[1.05]">
                Move it across Abuja.
                <br />
                <span className="text-abuja-blue">We're here to help.</span>
              </h1>
              <p className="mx-auto max-w-lg text-base leading-7 text-slate-500 px-2">
                Check delivery price, book a dispatch rider, and follow your delivery until it's in the
                right hands.
              </p>

              <div className="mt-3 w-full">
                <PriceChecker />
                {/* <TrackBox /> */}
              </div>

              <div
                className="mt-4 h-64 w-full max-w-4xl rounded-2xl bg-top bg-cover bg-no-repeat md:h-80"
                style={{ backgroundImage: `url(${Rider})` }}
                role="img"
                aria-label="An Abuja Messenger rider on a motorbike"
              />
            </div>
          </div>
        </section>


        {/* =========================== WHY CHOOSE US =========================== */}
        <section className="mt-4 rounded-2xl bg-primary md:rounded-3xl">
          <div className="container-shell pt-8 pb-5 sm:py-14 md:pb-14 md:pt-20">
            <div className="text-center">
              <FadeIn>
                <SectionTag> Why Choose Us </SectionTag>
              </FadeIn>
              <FadeIn delay={120}>
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white! sm:text-5xl">
                  Smart tools for routes, riders, and deliveries
                </h2>
              </FadeIn>
            </div>


            <FadeIn>
              <div className="mt-6 md:mt-12 grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-1 group rounded-2xl border-6 border-white/20 bg-primary p-1.5">
                  <div className="h-64 overflow-hidden bg-center bg-cover bg-no-repeat rounded-lg">
                    <img src={drivers} alt="Drivers" className="object-cover transition-all duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="bg-primary-alt rounded-lg p-6 mt-4">
                    <h3 className="font-display text-xl font-semibold text-white!">
                      Route tracking
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300!">
                      Follow your item from pickup to doorstep, with an estimated time of arrival (ETA) that updates.
                    </p>
                    <Link
                      to="/how-it-works"
                      className="mt-5 inline-flex items-center gap-1 text-base font-semibold text-blue-200! transition-colors group-hover:text-white!"
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
                <div className="col-span-1 group rounded-2xl border-6 border-white/20 bg-primary p-1.5">
                  <div className="h-64 overflow-hidden bg-center bg-cover bg-no-repeat rounded-lg border border-white/20">
                    <img src={deliveries} alt="Deliveries" className="object-cover transition-all duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="bg-primary-alt rounded-lg p-6 mt-4">
                    <h3 className="font-display text-xl font-semibold text-white!">
                      Verified riders
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300!">
                        Every rider is vetted, trained, and identifiable by name and plate number.
                    </p>
                    <Link
                      to="/how-it-works"
                      className="mt-5 inline-flex items-center gap-1 text-base font-semibold text-blue-200! transition-colors group-hover:text-white!"
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
                <div className="cols-span-1 sm:col-span-2 lg:col-span-1 group rounded-2xl border-6 border-white/20 bg-primary p-1.5">
                  <div className="h-64 overflow-hidden bg-center bg-cover bg-no-repeat rounded-lg">
                    <img src={dispatchers} alt="Dispatchers" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="bg-primary-alt rounded-lg p-6 mt-4">
                    <h3 className="font-display text-xl font-semibold text-white!">
                      Fair, upfront pricing
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300!">
                      You see the fare before booking. Fares come from distance and vehicle, not guesswork.
                    </p>
                    <Link
                      to="/how-it-works"
                      className="mt-5 inline-flex items-center gap-1 text-base font-semibold text-blue-200! transition-colors group-hover:text-white!"
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>


        {/* =========================== WHY US =========================== */}
        {/* <section className="mt-4 rounded-2xl bg-primary md:rounded-3xl">
          <div className="container-shell pb-8 pt-14 md:pt-20">
            <div className="text-center">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white! sm:text-5xl">
                Deliveries you don't have to chase
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {whyUs.map((item) => (
                <article key={item.title} className="group rounded-2xl border-6 border-white/20 bg-primary p-1.5">
                  <div className="h-64 overflow-hidden rounded-lg">
                    <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="mt-4 rounded-lg bg-primary-alt p-6">
                    <h3 className="font-display text-xl font-semibold text-white!">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300!">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section> */}



        {/* ======================= HOW IT WORKS ========================= */}
        <section id="how-it-works" className="mt-4 rounded-2xl bg-primary/10 ring-1 ring-slate-100 md:rounded-3xl">
          <div className="container-shell py-8 pb-5 sm:py-14 md:py-20">
            <SectionHeading tag="How it works">Book in minutes. Immediate delivery.</SectionHeading>
            <ol className="mt-6 md:mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ title, body, icon: Icon }, i) => (
                <li key={title} className="rounded-2xl bg-primary/10 p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-semibold text-abuja-blue/60">{i + 1}</span>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-abuja-blue">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>


        {/* ======================= HOW IT WORKS ========================= */}
        {/* <section
          id="how-it-works"
          className="mt-4 rounded-2xl bg-primary md:rounded-3xl"
        >
          <div className="container-shell py-14 text-center md:py-20">
            <FadeIn>
              <SectionTag>The Abuja Messenger way</SectionTag>
            </FadeIn>

            <FadeIn delay={120}>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Less uncertainty.
                <br />
                More delivery.
              </h2>
            </FadeIn>

            <div className="mt-12 grid gap-5 text-left lg:grid-cols-3">
              {steps.map(({ number, title, body, icon: Icon }, i) => (
                <FadeIn key={number} delay={200 + i * 120}>
                  <article className="group relative overflow-hidden rounded-2xl bg-white/5 p-7 transition-colors duration-300 hover:bg-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-4xl font-semibold text-blue-100">
                        {number}
                      </span>
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-abuja-blue transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-10 font-display text-xl font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section> */}

        {/* ====================== FOR BUSINESSES ======================== */}
        <section
          id="business"
          className="mt-4 rounded-2xl bg-primary/10 text-white md:rounded-3xl"
        >
          <div className="container-shell grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-20">
            <FadeIn>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-300">
                  For teams that move often
                </p>
                <h2 className="mt-4 max-w-xl font-display text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  One dependable layer for your business deliveries.
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-300">
                  Keep repeat deliveries, recipient details, invoices, and status
                  visibility in one place. Business tools are coming in the next
                  build phase.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={180}>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <span className="text-sm font-semibold text-slate-300">
                    Business workspace
                  </span>
                  <StatusPill tone="info">Coming soon</StatusPill>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-slate-300">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                    <PackageCheck className="h-4 w-4 text-blue-300" /> Bulk
                    delivery creation
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                    <Clock3 className="h-4 w-4 text-blue-300" /> Delivery
                    reporting
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                    <ShieldCheck className="h-4 w-4 text-blue-300" /> Team
                    permissions
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>


        {/* ======================== INTEGRATIONS ======================== */}
        <section className="mt-4 rounded-2xl bg-primary/10 ring-1 ring-slate-100 md:rounded-3xl">
          <div className="container-shell py-14 md:py-20">
            <div className="text-center">
              <FadeIn>
                <SectionTag>Seamless connections</SectionTag>
              </FadeIn>
              <FadeIn delay={120}>
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                  Integrate with tools your team already uses
                </h2>
              </FadeIn>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {["Diano.py", "Cloudbyte", "Loopware", "Deseart"].map(
                (name, i) => (
                  <FadeIn key={name} delay={200 + i * 100}>
                    <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-md hover:-translate-y-1">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-abuja-blue">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-ink">
                          {name}
                        </h3>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {name} makes it super easy for teams to automate tracking
                        operations effortlessly.
                      </p>
                    </div>
                  </FadeIn>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ========================== PRICING =========================== */}
        <section className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell py-14 md:py-20">
            <div className="text-center">
              <FadeIn>
                <SectionTag>Flexible plans</SectionTag>
              </FadeIn>
              <FadeIn delay={120}>
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Simple pricing built for every fleet size
                </h2>
              </FadeIn>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {pricingPlans.map((plan, i) => (
                <FadeIn key={plan.name} delay={200 + i * 120}>
                  <div
                    className={`relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      plan.bestDeal ? "ring-2 ring-blue-300/40" : ""
                    }`}
                  >
                    {plan.bestDeal && (
                      <span className="absolute right-5 top-5 rounded-full bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                        Best deal
                      </span>
                    )}
                    <h3 className="font-display text-2xl font-semibold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-sm text-slate-500 line-through">
                        {plan.oldPrice}
                      </span>
                      <span className="text-4xl font-semibold text-white">
                        {plan.price}
                      </span>
                      <span className="mb-1 text-sm text-slate-400">/Month</span>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-300/20 text-blue-200">
                            <Check className="h-3 w-3" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/register"
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 ${
                        plan.bestDeal
                          ? "bg-white text-ink hover:bg-slate-100"
                          : "border border-white/20 text-white hover:bg-white/10"
                      }`}
                    >
                      Get started
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== TESTIMONIALS ======================== */}
        <section className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell py-14 md:py-20">
            <div className="text-center">
              <FadeIn>
                <SectionTag>Trusted by teams</SectionTag>
              </FadeIn>
              <FadeIn delay={120}>
                <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  See how Abuja Messenger transforms operations for fleets and
                  drivers alike
                </h2>
              </FadeIn>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <FadeIn key={t.name} delay={200 + i * 120}>
                  <figure className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-white/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/30 text-sm font-semibold text-white">
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <figcaption className="text-sm font-semibold text-white">
                            {t.name}
                          </figcaption>
                          <p className="text-xs text-slate-400">{t.role}</p>
                        </div>
                      </div>
                      <span className="text-3xl leading-none text-blue-200/50">
                        "
                      </span>
                    </div>
                    <blockquote className="mt-5 text-sm leading-6 text-slate-300">
                      {t.quote}
                    </blockquote>
                  </figure>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ FAQS ============================ */}
        <section className="mt-4 rounded-2xl bg-primary/10 ring-1 ring-slate-100 md:rounded-3xl">
          <div className="container-shell grid gap-10 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <FadeIn>
              <div>
                <SectionTag>Need help?</SectionTag>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Answers to common questions about Abuja Messenger
                </h2>
              </div>
            </FadeIn>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FadeIn key={faq.q} delay={120 + i * 80}>
                  <FAQItem
                    q={faq.q}
                    a={faq.a}
                    isOpen={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                  />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ========================= FINAL CTA ========================== */}
        <section className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell flex flex-col items-center gap-6 py-16 text-center md:py-24">
            <FadeIn>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Still have questions?
              </h2>
            </FadeIn>
            <FadeIn delay={120}>
              <p className="text-sm leading-6 text-slate-400">
                Our support team can help you out.
              </p>
            </FadeIn>
            <FadeIn delay={240}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition-all duration-300 hover:bg-slate-100 hover:-translate-y-0.5"
                >
                  Get a demo
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 hover:-translate-y-0.5"
                >
                  Track a delivery
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <main className="text-ink">



        {/* ===================== VEHICLES & PRICING ===================== */}
        <section id="pricing" className="mt-4 rounded-2xl bg-primary/10 text-white md:rounded-3xl">
          <div className="container-shell py-14 md:py-20">
            <SectionHeading tag="Vehicles and rates">The right ride for what you're sending</SectionHeading>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {VEHICLE_SEEDS.map((v) => {
                const Icon = v.slug === "two-wheeler" ? Bike : Truck;
                return (
                  <article key={v.slug} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-7">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-blue-200">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-semibold">{v.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{vehicleUse[v.slug]}</p>
                    <p className="mt-6 text-4xl font-semibold">
                      {formatNaira(v.minimumFareKobo)}
                      <span className="ml-1 text-sm font-normal text-slate-400">minimum</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
                      {[
                        `${formatNaira(v.pricePerKmKobo)} per km after the base`,
                        `Carries up to ${v.maxWeightKg} kg`,
                        `Up to ${v.maxLengthCm} × ${v.maxWidthCm} × ${v.maxHeightCm} cm`,
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-300/20 text-blue-200">
                            <Check className="h-3 w-3" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/order" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100">
                      Book a {v.name.toLowerCase()} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {(Object.keys(DELIVERY_TYPE_META) as DeliveryType[]).map((t) => {
                const Icon = speedIcons[t];
                return (
                  <div key={t} className="flex items-start gap-3 rounded-2xl bg-white/5 p-5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                    <div>
                      <p className="text-sm font-semibold">{DELIVERY_TYPE_META[t].label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{DELIVERY_TYPE_META[t].blurb}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        
        {/* ======================== COVERAGE ============================ */}
        <section className="mt-4 rounded-2xl bg-primary/10 ring-1 ring-slate-100 md:rounded-3xl">
          <div className="container-shell py-14 text-center md:py-20">
            <SectionHeading tag="Where we deliver">Across the FCT, door to door</SectionHeading>
            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2">
              {DISTRICTS.map((d) => (
                <li key={d.name} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                  {d.name}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-500">
              Don't see your area?{" "}
              <a
                className="font-semibold text-abuja-blue underline"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, do you deliver to my area?")}`}
              >
                Ask us on WhatsApp
              </a>
              .
            </p>
          </div>
        </section>

        {/* ====================== FOR BUSINESSES ======================== */}
        <section id="business" className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell grid gap-10 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-20">
            <div>
              <h2 className="max-w-xl font-display text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                One dependable layer for your business deliveries.
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-500">
                Shops, restaurants, and online sellers can keep repeat deliveries, recipient details,
                invoices, and status updates in one place.
              </p>
            </div>
            <div className="rounded-[28px] border border-primary/20 bg-white p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <span className="text-sm font-semibold text-slate-600">Business workspace</span>
                <StatusPill tone="info">Coming soon</StatusPill>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-600">
                {[
                  { icon: PackageCheck, label: "Bulk delivery creation" },
                  { icon: Clock3, label: "Delivery reporting" },
                  { icon: ShieldCheck, label: "Team permissions" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4">
                    <Icon className="h-4 w-4 text-abuja-blue" /> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ======================= TESTIMONIALS ========================= */}
        <section className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell py-14 md:py-20">
            <div className="text-center">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                What customers say
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6">
                  <blockquote className="flex-1 text-sm leading-6 text-slate-300">{t.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/30 text-sm font-semibold text-white">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{t.name}</span>
                      <span className="block text-xs text-slate-400">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ FAQS ============================ */}
        <section className="mt-4 rounded-2xl bg-primary/10 ring-1 ring-slate-100 md:rounded-3xl">
          <div className="container-shell grid gap-10 py-14 md:py-20 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Questions before you book</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================= FINAL CTA ========================== */}
        <section className="mt-4 rounded-2xl bg-primary/10 md:rounded-3xl">
          <div className="container-shell flex flex-col items-center gap-6 py-16 text-center md:py-24">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Ready to send something?
            </h2>
            <p className="text-sm leading-6 text-slate-400">Book online, or chat with us if you'd rather talk it through.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/order" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-100">
                Book a delivery <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
              <Link to="/track" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Track a delivery <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}