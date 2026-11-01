import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import type { LoginInput } from "@abuja-messenger/contracts";
import { AuthLayout } from "../layouts/AuthLayout.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { getApiError } from "../lib/format";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginInput>();

  async function onSubmit(input: LoginInput) {
    setError("");
    try { await login(input); navigate("/app"); } catch (reason) { setError(getApiError(reason, "We couldn’t log you in. Check your details and try again.")); }
  }

  return <AuthLayout eyebrow="Welcome back" title="Pick up where you left off." description="Log in to manage deliveries, save addresses, and keep your next move close."><form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
    {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
    <label><span className="field-label">Email address</span><input className="field-input" type="email" autoComplete="email" placeholder="you@example.com" {...register("email", { required: true })} /></label>
    <label><span className="field-label">Password</span><input className="field-input" type="password" autoComplete="current-password" placeholder="Your password" {...register("password", { required: true })} /></label>
    <div className="flex justify-end"><Link to="/forgot-password" className="text-xs font-bold text-abuja-blue hover:underline">Forgot password?</Link></div>
    <button className="button-primary mt-1 w-full" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{isSubmitting ? "Logging you in…" : "Log in"}</button>
    <p className="text-center text-sm text-slate-500">New to Abuja Messenger? <Link to="/register" className="font-bold text-abuja-blue hover:underline">Create an account</Link></p>
  </form></AuthLayout>;
}
