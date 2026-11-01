import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { AuthLayout } from "../layouts/AuthLayout.tsx";
import { api } from "../lib/api";
import { getApiError } from "../lib/format";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();
  async function onSubmit(input: { email: string }) {
    setError("");
    try { await api.post("/auth/forgot-password", input); setSent(true); } catch (reason) { setError(getApiError(reason, "We couldn’t prepare the reset request.")); }
  }
  return <AuthLayout eyebrow="Account access" title="Let’s get you back in." description="Enter the email on your account. We’ll prepare a secure password reset request.">{sent ? <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800"><CheckCircle2 className="mb-3 h-5 w-5" /><p className="font-bold">Check your inbox.</p><p className="mt-1">If an account exists for that email, reset instructions are on their way.</p></div> : <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">{error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}<label><span className="field-label">Email address</span><input className="field-input" type="email" autoComplete="email" placeholder="you@example.com" {...register("email", { required: true })} /></label><button className="button-primary mt-1 w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{isSubmitting ? "Preparing request…" : "Send reset instructions"}</button><p className="text-center text-sm text-slate-500"><Link to="/login" className="font-bold text-abuja-blue hover:underline">Back to log in</Link></p></form>}</AuthLayout>;
}
