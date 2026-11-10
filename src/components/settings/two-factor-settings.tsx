'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import {
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateRecoveryCodes,
} from '@/app/settings/two-factor-actions';
import { PasswordInput } from '@/components/shared/password-input';
import { useAutoSubmitTotp } from '@/hooks/use-auto-submit-totp';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'idle' | 'setup' | 'disable' | 'regenerate';

export function TwoFactorSettings({
  enabled,
  required,
}: {
  enabled: boolean;
  required: boolean;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('idle');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(
    null,
  );
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm(nextMode: Mode = 'idle') {
    setMode(nextMode);
    setPassword('');
    setCode('');
    setError(null);
    if (nextMode !== 'setup') setSetup(null);
  }

  function fail(message: string) {
    setError(message);
    toast({ title: 'Two-factor authentication', description: message, variant: 'danger' });
  }

  function handleBeginSetup() {
    const formData = new FormData();
    formData.set('password', password);
    startTransition(async () => {
      const result = await beginTwoFactorSetup(formData);
      if (!result.success) return fail(result.error);
      setSetup({ secret: result.secret, qrDataUrl: result.qrDataUrl });
      setPassword('');
      setCode('');
      setError(null);
      setMode('setup');
    });
  }

  function handleConfirmSetup(codeValue: string) {
    const formData = new FormData();
    formData.set('code', codeValue);
    startTransition(async () => {
      const result = await confirmTwoFactorSetup(formData);
      if (!result.success) return fail(result.error);
      setRecoveryCodes(result.recoveryCodes);
      setCode('');
      setSetup(null);
      setMode('idle');
    });
  }

  function handleDisable() {
    const formData = new FormData();
    formData.set('password', password);
    formData.set('code', code);
    startTransition(async () => {
      const result = await disableTwoFactor(formData);
      if (!result.success) return fail(result.error);
      await signOut({ callbackUrl: '/login?twofactor=disabled' });
    });
  }

  function handleRegenerate() {
    const formData = new FormData();
    formData.set('password', password);
    formData.set('code', code);
    startTransition(async () => {
      const result = await regenerateRecoveryCodes(formData);
      if (!result.success) return fail(result.error);
      setRecoveryCodes(result.recoveryCodes);
      setPassword('');
      setCode('');
      setMode('idle');
    });
  }

  useAutoSubmitTotp({
    value: code,
    enabled: mode === 'setup' && setup !== null,
    pending: isPending,
    onSubmit: () => handleConfirmSetup(code),
  });

  async function copyRecoveryCodes() {
    if (!recoveryCodes) return;
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (recoveryCodes) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold">Save these recovery codes now.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            They are shown once. Each code works a single time if you lose your
            authenticator app.
          </p>
        </div>
        <div className="grid max-w-xl grid-cols-1 gap-2 rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm sm:grid-cols-2">
          {recoveryCodes.map((recoveryCode) => (
            <span key={recoveryCode}>{recoveryCode}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={copyRecoveryCodes}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy codes'}
          </Button>
          <Button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login?twofactor=enabled' })}
          >
            I saved them — sign in again
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'setup' && setup) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
          <div className="rounded-xl border border-border bg-white p-2">
            <Image
              src={setup.qrDataUrl}
              alt="QR code for the authenticator app"
              width={220}
              height={220}
              unoptimized
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">Scan the QR code</p>
            <p className="text-sm text-muted-foreground">
              Use Google Authenticator, 1Password, Authy or any TOTP app. If the
              camera does not work, enter this key manually:
            </p>
            <code className="block break-all rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm">
              {setup.secret}
            </code>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="two-factor-setup-code">6-digit code</Label>
              <Input
                id="two-factor-setup-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => handleConfirmSetup(code)}
                disabled={isPending || code.replace(/\s/g, '').length !== 6}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify and enable
              </Button>
              <Button type="button" variant="ghost" onClick={() => resetForm()}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (mode === 'disable' || mode === 'regenerate') {
    const isDisable = mode === 'disable';
    return (
      <div className="max-w-md space-y-4">
        <p className="text-sm text-muted-foreground">
          {isDisable
            ? 'Confirm with your password and a current code from your authenticator or a recovery code.'
            : 'Confirm with your password and a current code from your authenticator or a recovery code. Your current codes will stop working.'}
        </p>
        <div className="space-y-2">
          <Label htmlFor="two-factor-password">Current password</Label>
          <PasswordInput
            id="two-factor-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="two-factor-confirm-code">
            Authenticator or recovery code
          </Label>
          <Input
            id="two-factor-confirm-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={isDisable ? 'destructive' : 'default'}
            onClick={isDisable ? handleDisable : handleRegenerate}
            disabled={isPending || !password || !code}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDisable ? 'Disable 2FA and sign out' : 'Generate new codes'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => resetForm()}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="space-y-4">
        {required && (
          <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-semibold">Required for moderators and admins.</p>
            <p className="mt-1 text-muted-foreground">
              Enable two-factor authentication to access moderation again.
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
            Off
          </span>
          <p className="text-sm text-muted-foreground">
            Add a second step after your password with an authenticator app.
          </p>
        </div>
        {mode === 'idle' && (
          <Button type="button" onClick={() => resetForm('setup')}>
            <ShieldCheck className="h-4 w-4" />
            Set up two-factor authentication
          </Button>
        )}
        {mode === 'setup' && !setup && (
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <Label htmlFor="two-factor-password">Current password</Label>
              <PasswordInput
                id="two-factor-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleBeginSetup}
                disabled={isPending || !password}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
              </Button>
              <Button type="button" variant="ghost" onClick={() => resetForm()}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          On
        </span>
        <p className="text-sm text-muted-foreground">
          Your password is followed by a code from your authenticator app.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => resetForm('regenerate')}
        >
          <KeyRound className="h-4 w-4" />
          Regenerate recovery codes
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => resetForm('disable')}
        >
          Disable 2FA
        </Button>
      </div>
    </div>
  );
}
