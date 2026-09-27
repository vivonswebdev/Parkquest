"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { signInSchema, type SignInInput } from "@/lib/validation";
import { sendMagicLinkAction } from "@/server/auth-actions";

export function SignInForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "sent" | "error" | "demo">("idle");
  const { register, handleSubmit, formState } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", locale },
  });

  const onSubmit = handleSubmit(async (values) => {
    const r = await sendMagicLinkAction(values);
    setStatus(r.ok ? "sent" : r.error === "DEMO" ? "demo" : "error");
  });

  if (status === "sent") return <p role="status" className="rounded-2xl bg-primary/10 p-4 font-semibold text-primary">{t("sent")}</p>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <input type="hidden" {...register("locale")} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">{t("email")}</span>
        <span className="glass flex h-14 items-center gap-3 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-ring">
          <Mail className="size-5 text-primary" aria-hidden />
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(formState.errors.email)}
            {...register("email")}
            className="h-full flex-1 bg-transparent text-base outline-none"
          />
        </span>
        {formState.errors.email && <span className="mt-1 block text-sm text-danger">{t("invalidEmail")}</span>}
      </label>
      <Button type="submit" size="lg" block disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2 className="animate-spin" />}
        {t("send")}
      </Button>
      {status === "error" && <p role="alert" className="text-sm text-danger">{t("error")}</p>}
      {status === "demo" && <p role="status" className="rounded-2xl bg-gold/10 p-3 text-sm text-gold">{t("demoUnavailable")}</p>}
    </form>
  );
}
