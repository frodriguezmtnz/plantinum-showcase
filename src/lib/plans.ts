/**
 * Plan entitlements — the single source of truth for what each tier gets.
 * Payments (Stripe) are not wired yet: every account is FREE until a plan is
 * provisioned, and the pricing page shows the paid tiers as "Coming soon".
 */

export type Plan = 'FREE' | 'PRO' | 'PLATINUM';

export const PLAN_ORDER: Plan[] = ['FREE', 'PRO', 'PLATINUM'];

export interface PlanConfig {
  /** Uploads allowed per calendar month (Europe/Madrid). Infinity = unlimited. */
  monthlyUploadLimit: number;
  /** Whether uploads get the baked-in site watermark. */
  watermark: boolean;
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: { monthlyUploadLimit: 3, watermark: true },
  PRO: { monthlyUploadLimit: 10, watermark: false },
  PLATINUM: { monthlyUploadLimit: Infinity, watermark: false },
};

export function planConfig(plan: string | null | undefined): PlanConfig {
  return PLANS[(plan as Plan) in PLANS ? (plan as Plan) : 'FREE'] ?? PLANS.FREE;
}

export function uploadsRemaining(
  usedThisMonth: number,
  plan: string | null | undefined,
): number {
  const { monthlyUploadLimit } = planConfig(plan);
  if (!Number.isFinite(monthlyUploadLimit)) return Infinity;
  return Math.max(0, monthlyUploadLimit - usedThisMonth);
}

export function quotaReached(
  usedThisMonth: number,
  plan: string | null | undefined,
): boolean {
  return uploadsRemaining(usedThisMonth, plan) === 0;
}

/** Next tier up, or null when already on the top plan. */
export function nextPlan(plan: string | null | undefined): Plan | null {
  const current: Plan = (plan as Plan) in PLANS ? (plan as Plan) : 'FREE';
  const idx = PLAN_ORDER.indexOf(current);
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? PLAN_ORDER[idx + 1]! : null;
}
