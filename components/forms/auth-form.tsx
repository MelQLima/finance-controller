"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, signupAction } from "@/app/actions/auth";
import { defaultActionState } from "@/lib/actions/result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ mode }: { mode: "login" | "signup" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction] = useActionState(action, defaultActionState);

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="space-y-5 px-1 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Finance Controller</p>
        <div className="space-y-3">
          <h1 className="max-w-lg text-4xl font-semibold tracking-tight sm:text-5xl">
            {mode === "login" ? "Your monthly money flow, rebuilt for mobile." : "Start a cleaner personal finance routine."}
          </h1>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {mode === "login"
              ? "Review balances, due dates, and recurring items from a touch-first interface designed to reduce friction."
              : "Create an account and organize transactions, forecasts, and wishlist plans in one responsive workspace."}
          </p>
        </div>
      </section>

      <Card className="w-full max-w-md justify-self-end">
        <CardHeader className="gap-2">
          <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "Log in to access your dashboard." : "Start tracking your finances in minutes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.message ? (
              <p className={`text-sm ${state.success ? "text-emerald-600" : "text-red-500"}`}>{state.message}</p>
            ) : null}
            <SubmitButton mode={mode} />
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/signup" : "/login"} className="font-medium text-foreground underline">
              {mode === "login" ? "Sign up" : "Login"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
