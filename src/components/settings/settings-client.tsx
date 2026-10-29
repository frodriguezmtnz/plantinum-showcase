'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  CircleAlert,
  Crown,
  ExternalLink,
  KeyRound,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { checkUsernameAvailability } from '@/app/register/actions';
import {
  changePassword,
  updateProfile,
  updateUsername,
} from '@/app/settings/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AvatarField } from '@/components/settings/avatar-field';
import { DeleteAccount } from '@/components/settings/delete-account';
import { PasswordInput } from '@/components/shared/password-input';
import { PasswordRules } from '@/components/shared/password-rules';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BIO_MAX_LENGTH,
  BIO_PROBLEM_MESSAGE,
  bioProblem,
} from '@/lib/bio';
import { passwordPolicyError } from '@/lib/password';
import { nextPlan, planConfig, uploadsRemaining } from '@/lib/plans';
import {
  formatUsernameChangeDate,
  usernameCooldownStatus,
} from '@/lib/username-policy';
import {
  buildPsnProfileUrl,
  psnHandleProblem,
  PSN_PROVIDERS,
  type PsnProvider,
} from '@/lib/psn';
import { usernameProblem } from '@/lib/usernames';
import { cn } from '@/lib/utils';


export interface SettingsUser {
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  initialLinks: { provider: PsnProvider; handle: string }[];
  plan: string;
  usernameChangedAt: string | null;
  uploadsUsed: number;
}

type Availability =
  | 'same'
  | 'checking'
  | 'available'
  | 'taken'
  | 'reserved'
  | 'invalid'
  | 'rate-limited';

function Section({
  title,
  description,
  tone = 'default',
  children,
}: {
  title: string;
  description?: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'panel-solid rounded-2xl p-6 md:p-8',
        tone === 'danger' && 'border-destructive/40',
      )}
    >
      <h2
        className={cn(
          'font-headline text-xl font-bold tracking-tight',
          tone === 'danger' && 'text-destructive',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

export function SettingsClient({ user }: { user: SettingsUser }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const [savedUsername, setSavedUsername] = useState(user.username);
  const [username, setUsername] = useState(user.username);
  const [changedAt, setChangedAt] = useState(user.usernameChangedAt);
  const cooldown = usernameCooldownStatus(changedAt);
  const usernameLocked = cooldown.locked;
  const [probe, setProbe] = useState<{ value: string; state: Availability } | null>(
    null,
  );
  const [isSavingUsername, startSavingUsername] = useTransition();
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);

  const [bio, setBio] = useState(user.bio ?? '');
  const [links, setLinks] = useState(user.initialLinks);
  const [savedBio, setSavedBio] = useState(user.bio ?? '');
  const [savedLinks, setSavedLinks] = useState(user.initialLinks);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [isSavingProfile, startSavingProfile] = useTransition();

  const linksKey = (value: { provider: PsnProvider; handle: string }[]) =>
    value
      .map((link) => `${link.provider}:${link.handle.trim().toLowerCase()}`)
      .sort()
      .join('|');

  const bioIssue = bioProblem(bio);
  const linkProblem = links.some(
    (link) =>
      !link.handle.trim() || psnHandleProblem(link.handle) === 'invalid',
  );
  const isProfileDirty =
    bio !== savedBio || linksKey(links) !== linksKey(savedLinks);
  const canSaveProfile = !bioIssue && !linkProblem;

  const usedProviders = new Set(links.map((link) => link.provider));
  const availableProviders = PSN_PROVIDERS.filter(
    (provider) => !usedProviders.has(provider.value),
  );

  function addLink() {
    const next = availableProviders[0];
    if (!next) return;
    setLinks((current) => [...current, { provider: next.value, handle: '' }]);
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index));
  }

  function updateLink(
    index: number,
    patch: Partial<{ provider: PsnProvider; handle: string }>,
  ) {
    setLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, startSavingPassword] = useTransition();

  const newPasswordIssue = newPassword ? passwordPolicyError(newPassword) : null;
  const passwordsMatch = Boolean(
    newPassword && confirmPassword && newPassword === confirmPassword,
  );
  const passwordDiffers = Boolean(
    newPassword && currentPassword && newPassword !== currentPassword,
  );
  const canChangePassword =
    Boolean(currentPassword) &&
    !newPasswordIssue &&
    passwordsMatch &&
    passwordDiffers;

  // Shape and "unchanged" are derived during render; only the network probe
  // needs an effect, so no setState runs synchronously in an effect body.
  const trimmedUsername = username.trim();
  const sameUsername = trimmedUsername === savedUsername;
  const usernameIssue = sameUsername ? null : usernameProblem(trimmedUsername);
  const derivedAvailability: Availability | null = sameUsername
    ? 'same'
    : usernameIssue
      ? usernameIssue === 'reserved'
        ? 'reserved'
        : 'invalid'
      : null;

  useEffect(() => {
    if (usernameLocked) return;
    if (derivedAvailability !== null) return;

    let alive = true;
    const handle = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(trimmedUsername);
        if (!alive) return;
        setProbe({
          value: trimmedUsername,
          state: result.available ? 'available' : (result.reason ?? 'invalid'),
        });
      } catch {
        if (alive) setProbe({ value: trimmedUsername, state: 'invalid' });
      }
    }, 500);

    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [trimmedUsername, derivedAvailability, usernameLocked]);

  const availability: Availability =
    derivedAvailability ??
    (probe?.value === trimmedUsername ? probe.state : 'checking');

  useEffect(() => {
    if (!isProfileDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isProfileDirty]);

  function handleNavigate(href: string) {
    if (isProfileDirty) {
      setPendingNav(href);
      return;
    }
    router.push(href);
  }

  function discardAndLeave() {
    setBio(savedBio);
    setLinks(savedLinks);
    const href = pendingNav;
    setPendingNav(null);
    if (href) router.push(href);
  }

  function handleSaveUsername() {
    startSavingUsername(async () => {
      const result = await updateUsername(username.trim());
      if (!result.success) {
        toast({
          title: 'Username not changed',
          description: result.error,
          variant: 'danger',
        });
        return;
      }
      setSavedUsername(result.username);
      setUsername(result.username);
      setChangedAt(result.changedAt);
      setUsernameDialogOpen(false);
      void refresh();
      router.refresh();
      toast({
        title: 'Username updated',
        description: `Your profile now lives at /u/${result.username}.`,
        variant: 'success',
      });
    });
  }

  function handleSaveProfile() {
    const formData = new FormData();
    formData.set('bio', bio);
    formData.set(
      'links',
      JSON.stringify(
        links.map((link) => ({
          provider: link.provider,
          handle: link.handle.trim(),
        })),
      ),
    );

    startSavingProfile(async () => {
      const result = await updateProfile(formData);
      if (!result.success) {
        toast({
          title: 'Profile not saved',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      const nextLinks = result.links.map(({ provider, handle }) => ({
        provider,
        handle,
      }));
      setBio(result.bio ?? '');
      setSavedBio(result.bio ?? '');
      setLinks(nextLinks);
      setSavedLinks(nextLinks);

      router.refresh();
      toast({
        title: 'Profile saved',
        description: 'Your bio and profile links are up to date.',
        variant: 'success',
      });
    });
  }

  function handleChangePassword() {
    const formData = new FormData();
    formData.set('currentPassword', currentPassword);
    formData.set('newPassword', newPassword);
    formData.set('confirmPassword', confirmPassword);

    startSavingPassword(async () => {
      const result = await changePassword(formData);
      if (!result.success) {
        toast({
          title: 'Password not changed',
          description: result.error,
          variant: 'danger',
        });
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password changed',
        description: 'Use the new password the next time you sign in.',
        variant: 'success',
      });
    });
  }

  const plan = planConfig(user.plan);
  const upgrade = nextPlan(user.plan);
  const remaining = uploadsRemaining(user.uploadsUsed, user.plan);
  const remainingLabel = Number.isFinite(remaining)
    ? `${remaining} left this month`
    : 'Unlimited';

  const availabilityCopy: Record<Availability, string | null> = {
    same: null,
    checking: 'Checking availability…',
    available: 'Available',
    taken: 'That username is already taken.',
    reserved: 'That username is reserved.',
    invalid: '3–20 characters: letters, numbers, dashes and underscores.',
    'rate-limited': 'Too many checks. Wait a moment and try again.',
  };

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <header className="mb-8">
        <p className="field-mark">Account</p>
        <h1 className="mt-2 font-headline text-3xl font-bold tracking-tight md:text-4xl">
          Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your identity, security and plan.
        </p>
        <div className="mt-3 text-sm">
          <button
            type="button"
            onClick={() => handleNavigate(`/u/${savedUsername}`)}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← Back to your profile
          </button>
        </div>
      </header>

      <div className="space-y-6">
        <Section
          title="Profile"
          description="How hunters see you on the board."
        >
          <AvatarField username={savedUsername} initialImage={user.image} />

          <div className="h-px bg-border" />

          <div className="space-y-2">
            <Label htmlFor="settings-username">Username</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:flex-1">
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="settings-username-hint"
                  disabled={usernameLocked}
                  className="pr-20"
                />
                {!usernameLocked &&
                  (username !== savedUsername || username.length > 0) && (
                    <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                      {username !== savedUsername && (
                        <button
                          type="button"
                          onClick={() => setUsername(savedUsername)}
                          aria-label="Reset username"
                          title="Reset to your saved username"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                      {username.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUsername('')}
                          aria-label="Clear username"
                          title="Clear username"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
              </div>
              {!usernameLocked && (
                <Button
                  type="button"
                  onClick={() => setUsernameDialogOpen(true)}
                  disabled={
                    availability !== 'available' || isSavingUsername
                  }
                  className="shrink-0"
                >
                  {isSavingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save username
                </Button>
              )}
            </div>
            <p
              id="settings-username-hint"
              className={cn(
                'text-xs',
                availability === 'available'
                  ? 'text-emerald-600'
                  : availability === 'same' || availability === 'checking'
                    ? 'text-muted-foreground'
                    : 'text-destructive',
              )}
              aria-live="polite"
            >
              {usernameLocked && cooldown.nextAt
                ? `You can change it again on ${formatUsernameChangeDate(cooldown.nextAt)} (once every 12 months).`
                : (availabilityCopy[availability] ??
                  'This is also your public profile URL.')}
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-bio">Bio</Label>
              <Textarea
                id="settings-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={BIO_MAX_LENGTH}
                rows={3}
                placeholder="Short line about your trophy hunting."
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/{BIO_MAX_LENGTH} · shown in your About tab. Plain
                text only — HTML, &lt; &gt; and javascript: are not allowed.
              </p>
              {bioIssue && (
                <p className="text-xs text-destructive" role="alert">
                  {BIO_PROBLEM_MESSAGE[bioIssue]}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>PlayStation profiles</Label>

              {links.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No profile links yet. Add one or more sites where your PSN
                  profile lives.
                </p>
              )}

              {links.map((link, index) => {
                const preview =
                  link.handle.trim() && psnHandleProblem(link.handle) !== 'invalid'
                    ? buildPsnProfileUrl(link.provider, link.handle.trim())
                    : null;
                const providerOptions = PSN_PROVIDERS.filter(
                  (provider) =>
                    provider.value === link.provider ||
                    !usedProviders.has(provider.value),
                );

                return (
                  <div
                    key={`${link.provider}-${index}`}
                    className="space-y-1.5 rounded-xl border border-border/70 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={link.provider}
                        onValueChange={(value) =>
                          updateLink(index, {
                            provider: value as PsnProvider,
                          })
                        }
                      >
                        <SelectTrigger
                          className="sm:w-[13rem]"
                          aria-label={`Profile provider ${index + 1}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {providerOptions.map((provider) => (
                            <SelectItem
                              key={provider.value}
                              value={provider.value}
                            >
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={link.handle}
                        onChange={(event) =>
                          updateLink(index, { handle: event.target.value })
                        }
                        placeholder="Your PSN nickname"
                        maxLength={16}
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={`PSN nickname ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(index)}
                        aria-label={`Remove profile link ${index + 1}`}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {preview ? (
                        <>
                          We will link to{' '}
                          <span className="break-all font-medium text-foreground">
                            {preview}
                          </span>
                        </>
                      ) : (
                        'Pick a provider and type the nickname; we build the link.'
                      )}
                    </p>
                    {psnHandleProblem(link.handle) === 'invalid' && (
                      <p className="text-xs text-destructive" role="alert">
                        3–16 characters: letters, numbers, dashes or
                        underscores.
                      </p>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLink}
                disabled={availableProviders.length === 0}
              >
                <Plus className="h-4 w-4" />
                Add profile
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !canSaveProfile || !isProfileDirty}
              >
                {isSavingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save profile
              </Button>
              {isProfileDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setBio(savedBio);
                    setLinks(savedLinks);
                  }}
                  disabled={isSavingProfile}
                >
                  <Undo2 className="h-4 w-4" />
                  Discard changes
                </Button>
              )}
              {isProfileDirty && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <CircleAlert className="h-3.5 w-3.5" aria-hidden />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          {!usernameLocked && (
          <AlertDialog
            open={usernameDialogOpen}
            onOpenChange={(open) => !isSavingUsername && setUsernameDialogOpen(open)}
          >
            <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem]">
              <AlertDialogHeader>
                <AlertDialogTitle>Change your username?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile moves from /u/{savedUsername} to /u/
                  {trimmedUsername}. Old links — and notifications that point at
                  your previous handle — will stop working, and the old handle is
                  reserved forever. You can change it again in 12 months.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSavingUsername}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername}
                >
                  {isSavingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Change username
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          )}
        </Section>

        <Section
          title="Account"
          description="Your sign-in details and password."
        >
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={user.email} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Email changes are not available yet.
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden />
              Change password
            </p>
            <div className="grid max-w-md gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current</Label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New</Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  aria-describedby="password-rules"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <PasswordRules
              id="password-rules"
              value={newPassword}
              confirm={confirmPassword}
              current={currentPassword}
            />

            <Button
              type="button"
              variant="outline"
              onClick={handleChangePassword}
              disabled={isSavingPassword || !canChangePassword}
            >
              {isSavingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Update password
            </Button>
          </div>
        </Section>

        <Section
          title="Plan & billing"
          description="What your account can do today."
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              {user.plan}
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.monthlyUploadLimit === Infinity
                ? 'Unlimited uploads (fair use)'
                : `${plan.monthlyUploadLimit} uploads per month`}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 p-4">
              <dt className="field-mark">Uploads</dt>
              <dd className="mt-1 text-sm">
                {user.uploadsUsed} used · {remainingLabel}
              </dd>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <dt className="field-mark">Watermark</dt>
              <dd className="mt-1 text-sm">
                {plan.watermark ? 'On your uploads' : 'Removed'}
              </dd>
            </div>
          </dl>

          <p className="text-sm text-muted-foreground">
            Billing is not live yet — nothing is charged. Managing or cancelling
            a subscription will arrive with Stripe.
          </p>

          {upgrade && (
            <Button asChild variant="outline" className="w-fit">
              <Link
                href="/pricing"
                onClick={(event) => {
                  if (!isProfileDirty) return;
                  event.preventDefault();
                  setPendingNav('/pricing');
                }}
              >
                See {upgrade} plans
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </Section>

        <Section
          title="Danger zone"
          description="This action is permanent."
          tone="danger"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Deleting your account removes your profile, platinums and uploaded
              images.
            </p>
            <DeleteAccount username={savedUsername} />
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" aria-hidden />
            You will be asked for your username and password.
          </p>
        </Section>
      </div>

      <AlertDialog
        open={pendingNav !== null}
        onOpenChange={(open) => !open && setPendingNav(null)}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your bio and PlayStation link changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={discardAndLeave}>
              Discard and leave
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
