-- Repoint notices that still link to a handle its owner has since changed.
-- The runtime rename action already does this; the backfill fixes rows written
-- before that repair existed. Idempotent: after the update the old link no
-- longer matches a history row.
UPDATE "Notification" AS n
SET "linkUrl" = '/u/' || u."username",
    "title" = replace(n."title", '@' || h."username", '@' || u."username")
FROM "UsernameHistory" AS h
JOIN "User" AS u ON u."id" = h."userId"
WHERE n."linkUrl" = '/u/' || h."username"
  AND u."username" <> h."username";
