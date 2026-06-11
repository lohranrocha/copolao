UPDATE "matches"
SET
  "match_date_utc" = '2026-06-11T19:00:00.000Z',
  "lock_at_utc" = '2026-06-11T18:30:00.000Z'
WHERE "match_number" = 1;

UPDATE "matches"
SET
  "match_date_utc" = '2026-06-12T02:00:00.000Z',
  "lock_at_utc" = '2026-06-12T01:30:00.000Z'
WHERE "match_number" = 2;
