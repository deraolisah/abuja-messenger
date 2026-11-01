import { ArrowUpRight, Bell, Clock3, MapPin, Package, Plus, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { StatusPill } from "../components/StatusPill.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";

export function CustomerAppPage() {
  const { user } = useAuth();

  return (
    <main className="container-shell py-10 lg:py-14">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Good to see you, {user?.name.split(" ")[0] || ""}.
          </h1>
          <p className="body-copy mt-3">
            Your next delivery should feel simple from the first tap.
          </p>
        </div>
        
        <button className="button-secondary self-start">
          <Bell className="h-4 w-4" /> Notifications
        </button>
      </div>
      
      <section className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[30px] bg-ink p-7 text-white shadow-card sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <StatusPill tone="info">Booking flow in progress</StatusPill>
              <h2 className="mt-6 max-w-[440px] font-display text-3xl font-semibold leading-tight tracking-[-0.04em]">
                When you’re ready, we’ll help you move it.
              </h2>
              <p className="mt-4 max-w-[420px] text-sm leading-6 text-slate-300">
                The booking engine, pricing, maps, and payments are being connected next. This workspace is already tied to your real account.
              </p>
            </div>
          
            <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 sm:grid">
              <Package className="h-5 w-5 text-blue-200" />
            </div>
          </div>
          
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white/60">
              Start a delivery 
              <Plus className="h-4 w-4" />
            </button>
            <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10">
              Explore service 
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        <div className="glass-card p-7">
          <p className="eyebrow">At a glance</p>
          <div className="mt-6 grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-cloud p-4">
              <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
                <Clock3 className="h-4 w-4 text-abuja-blue" /> Active deliveries
              </span>
              <span className="font-display text-xl font-semibold">—</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-cloud p-4">
              <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
                <MapPin className="h-4 w-4 text-abuja-purple" /> Saved addresses
              </span>
              <span className="font-display text-xl font-semibold">—</span>
            </div><div className="flex items-center justify-between rounded-2xl bg-cloud p-4">
              <span className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Account status
                </span><span className="text-sm font-bold text-emerald-700">Verified</span></div></div></div></section>
    <section className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-abuja-blue"><Package className="h-5 w-5" /></div><h2 className="mt-5 font-display text-xl font-semibold">No live deliveries yet</h2><p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-slate-500">Your completed delivery history and tracking timeline will appear here once your first booking is connected.</p></section></main>
    )
}
