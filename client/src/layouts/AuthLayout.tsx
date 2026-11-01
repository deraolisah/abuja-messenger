import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

// import { BrandMark } from "../components/BrandMark";

export function AuthLayout({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cloud">
      <div className="container-shell py-6">
        <Link to="/" aria-label="Back to home">
          {/* <BrandMark /> */}
        </Link>
      </div>
      <main className="container-shell grid max-w-295 gap-12 py-12 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:py-20">
        <div className="hidden lg:block">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 max-w-120 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.055em]">
            A calmer way to move what matters.
          </h1>
          <p className="body-copy mt-6 max-w-107.5">
            Your delivery workspace keeps the route, the details, and the next step close at hand.
          </p>
          
          <div className="mt-12 flex items-center gap-3 text-sm font-semibold text-slate-500">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-mint text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            Built around trust and visibility
          </div>
        </div>

        <div className="glass-card mx-auto w-full max-w-130 p-6 sm:p-9">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em]">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
          
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
