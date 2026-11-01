import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="page-loader px-6 text-center">
      <div>
        <p className="eyebrow"> 404 </p>
        <h1 className="mt-4 font-display text-4xl font-semibold">That route took a wrong turn.</h1>
        <p className="mx-auto mt-4 max-w-105 text-sm leading-6 text-slate-500">The page you're looking for isn’t part of this delivery yet.</p>
        <Link to="/" className="button-primary mt-7">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
