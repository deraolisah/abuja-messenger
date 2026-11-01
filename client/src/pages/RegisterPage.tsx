import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import type { RegisterInput } from "@abuja-messenger/contracts";
import { AuthLayout } from "../layouts/AuthLayout.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getApiError } from "../lib/format";

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<RegisterInput>();

  async function onSubmit(input: RegisterInput) {
    setError("");
    try { await createAccount(input); navigate("/app"); } catch (reason) { setError(getApiError(reason, "We couldn’t create your account. Please try again.")); }
  }

  return <AuthLayout eyebrow="Start moving" title="Create your delivery workspace." description="Set up your account once. Then every delivery starts with a clear, confident next step."><form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
    {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <label><span className="field-label">Full name</span><input className="field-input" type="text" autoComplete="name" placeholder="Your full name" {...register("displayName", { required: true, minLength: 2 })} /></label>
    <label><span className="field-label">Email address</span><input className="field-input" type="email" autoComplete="email" placeholder="you@example.com" {...register("email", { required: true })} /></label>
    <label><span className="field-label">Phone number <span className="normal-case tracking-normal text-slate-400">(optional)</span></span><input className="field-input" type="tel" autoComplete="tel" placeholder="0800 000 0000" {...register("phone")} /></label>
    <label><span className="field-label">Password</span><input className="field-input" type="password" autoComplete="new-password" placeholder="At least 8 characters" {...register("password", { required: true, minLength: 8 })} /></label>
    <button className="button-primary mt-1 w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{isSubmitting ? "Creating your workspace…" : "Create account"}</button>
    <p className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-abuja-blue hover:underline">Log in</Link></p>
  </form></AuthLayout>;
}
