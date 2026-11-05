-- The old default avatar was a random pravatar photo. Accounts without an
-- uploaded image now resolve deterministic initials + trophy art from their
-- handle, so clear the stock photos (including frozen monthly snapshots).
UPDATE "User"
SET "image" = NULL
WHERE "image" LIKE 'https://i.pravatar.cc/%'
   OR "image" LIKE 'http://i.pravatar.cc/%';

UPDATE "MonthlyResult"
SET "avatarUrl" = '/api/generated-avatars/' || "username"
WHERE "avatarUrl" LIKE '%i.pravatar.cc/%';
