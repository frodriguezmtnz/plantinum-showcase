import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { reserveUsername } from '@/lib/username-registry';
import { avatarImageKey, deleteImage, isStorageConfigured } from '@/lib/b2';
import { imageKeyFromUrl } from '@/lib/moderation-core';

export interface DeletableUser {
  id: string;
  username: string | null;
  platinums: { id: string; imageUrl: string; hash: string }[];
}

export type DeleteAccountDataResult =
  | { ok: true }
  | { ok: false; reason: 'token-spent' };

/**
 * Irreversible account teardown shared by the password flow in Settings and
 * the emailed confirmation link. Plates and their stored images go away,
 * frozen monthly rows keep their display data but lose the (now dead) link,
 * and the account is deleted in cascade.
 *
 * When `claim` is provided the single-use token is claimed inside the same
 * transaction as the deletion, so a replayed link cannot delete twice nor a
 * burned link delete at all.
 */
export async function deleteAccountData(
  user: DeletableUser,
  claim?: { tokenId: string; now: Date },
): Promise<DeleteAccountDataResult> {
  const platinumIds = user.platinums.map((plate) => plate.id);

  const deleted = await prisma.$transaction(async (tx) => {
    if (claim) {
      const claimed = await tx.emailToken.updateMany({
        where: {
          id: claim.tokenId,
          usedAt: null,
          expiresAt: { gt: claim.now },
        },
        data: { usedAt: claim.now },
      });
      if (claimed.count === 0) return false;
    }

    // Freeing the handle forever keeps old links from resolving to a stranger.
    if (user.username) {
      await reserveUsername(user.username, user.id, tx);
    }
    if (platinumIds.length > 0) {
      await tx.monthlyResult.updateMany({
        where: { platinumId: { in: platinumIds } },
        data: { platinumId: null },
      });
    }
    await tx.user.delete({ where: { id: user.id } });
    return true;
  });

  if (!deleted) return { ok: false, reason: 'token-spent' };

  // Storage cleanup after the cascade: only drop bytes no other plate shares.
  const seen = new Set<string>();
  for (const plate of user.platinums) {
    if (seen.has(plate.hash)) continue;
    seen.add(plate.hash);
    const remaining = await prisma.platinum.count({
      where: { hash: plate.hash },
    });
    if (remaining > 0) continue;
    const key = imageKeyFromUrl(plate.imageUrl);
    if (!key) continue;
    try {
      await deleteImage(key);
    } catch {
      // Best effort, same policy as moderation deletes.
    }
  }

  if (isStorageConfigured()) {
    try {
      await deleteImage(avatarImageKey(user.id));
    } catch {
      // No avatar stored, or storage down.
    }
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}
