import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/http";
import { useModules } from "@/lib/modules";
import type { User } from "@/services/auth.service";

/**
 * Shown above every signed-in page while the account's university email is
 * unverified and the server requires verification. Reading works meanwhile;
 * posting unlocks once the emailed code is entered.
 */
export function VerifyEmailBanner() {
  const { user, setUser } = useAuth();
  const { emailVerificationRequired } = useModules();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified || !emailVerificationRequired) return null;

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: User }>("/auth/email/verify", { method: "POST", body: { code } });
      setUser(res.user);
      toast.success("Email verified. You can post now.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      const res = await api<{ message: string }>("/auth/email/send", { method: "POST", body: {} });
      toast.success(res.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send a code");
    }
  };

  return (
    <div role="region" aria-label="Verify your email" className="border-b border-primary/30 bg-primary/[0.07]">
      <form onSubmit={verify} className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4 sm:px-10">
        <p className="min-w-[240px] flex-1 text-[14px] leading-6">
          We emailed a 6-digit code to <strong className="font-medium">{user.email}</strong>. Enter it to start posting.
        </p>
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          aria-label="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="w-32 tracking-[0.3em]"
        />
        <Button type="submit" size="sm" disabled={busy || code.length !== 6}>Verify</Button>
        <Button type="button" size="sm" variant="ghost" onClick={resend}>Send a new code</Button>
      </form>
    </div>
  );
}
