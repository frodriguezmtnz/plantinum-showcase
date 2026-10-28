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
  Save,
  Undo2,
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
  describePsnProfile,
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
  psnProfileUrl: string | null;
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

  const initialPsn = describePsnProfile(user.psnProfileUrl);
  const [bio, setBio] = useState(user.bio ?? '');
  const [psnProvider, setPsnProvider] = useState<PsnProvider>(
    initialPsn?.kind ?? 'psnprofiles',
  );
  const [psnHandle, setPsnHandle] = useState(initialPsn?.handle ?? '');
  const [savedBio, setSavedBio] = useState(user.bio ?? '');
  const [savedPsnProvider, setSavedPsnProvider] = useState<PsnProvider>(
    initialPsn?.kind ?? 'psnprofiles',
  );
  const [savedPsnHandle, setSavedPsnHandle] = useState(
    initialPsn?.handle ?? '',
  );
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [isSavingProfile, startSavingProfile] = useTransition();

  const bioIssue = bioProblem(bio);
  const psnProblem = psnHandle.trim()
    ? psnHandleProblem(psnHandle)
    : null;
  const isProfileDirty =
    bio !== savedBio ||
    psnProvider !== savedPsnProvider ||
    psnHandle.trim() !== savedPsnHandle;
  const canSaveProfile = !bioIssue && !psnProblem;
  const psnPreview =
    psnHandle.trim() && !psnProblem
      ? buildPsnProfileUrl(psnProvider, psnHandle.trim())
      : null;

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
    setPsnProvider(savedPsnProvider);
    setPsnHandle(savedPsnHandle);
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
    formData.set('psnProvider', psnProvider);
    formData.set('psnHandle', psnHandle);

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

      const savedPsn = describePsnProfile(result.psnProfileUrl);
      setBio(result.bio ?? '');
      setSavedBio(result.bio ?? '');
      setPsnProvider(savedPsn?.kind ?? 'psnprofiles');
      setPsnHandle(savedPsn?.handle ?? '');
      setSavedPsnProvider(savedPsn?.kind ?? 'psnprofiles');
      setSavedPsnHandle(savedPsn?.handle ?? '');

      router.refresh();
      toast({
        title: 'Profile saved',
        description: 'Your bio and PlayStation link are up to date.',
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
              <Input
                id="settings-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                aria-describedby="settings-username-hint"
                disabled={usernameLocked}
              />
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

            <div className="space-y-2">
              <Label htmlFor="settings-psn">PlayStation profile</Label>
              <div className="grid gap-2 sm:grid-cols-[13rem_1fr]">
                <Select
                  value={psnProvider}
                  onValueChange={(value) =>
                    setPsnProvider(value as PsnProvider)
                  }
                >
                  <SelectTrigger
                    id="settings-psn-provider"
                    aria-label="PlayStation profile provider"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PSN_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="settings-psn"
                  value={psnHandle}
                  onChange={(event) => setPsnHandle(event.target.value)}
                  placeholder="Your PSN nickname"
                  maxLength={16}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="settings-psn-hint"
                />
              </div>
              <p
                id="settings-psn-hint"
                className="text-xs text-muted-foreground"
              >
                {psnPreview ? (
                  <>
                    We will link to{' '}
                    <span className="break-all font-medium text-foreground">
                      {psnPreview}
                    </span>
                  </>
                ) : (
                  'Pick a provider and type the nickname; we build the profile link.'
                )}
              </p>
              {psnProblem === 'invalid' && (
                <p className="text-xs text-destructive" role="alert">
                  3–16 characters: letters, numbers, dashes or underscores.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile || !canSaveProfile}
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
                    setPsnProvider(savedPsnProvider);
                    setPsnHandle(savedPsnHandle);
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
            <div className="grid gap-4 sm:grid-cols-3">
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
