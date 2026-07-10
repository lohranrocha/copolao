UPDATE "matches"
SET
  "match_date_utc" = schedule."match_date_utc"::timestamp,
  "lock_at_utc" = schedule."match_date_utc"::timestamp - INTERVAL '30 minutes'
FROM (
  VALUES
    (98, '2026-07-10T19:00:00.000Z'),
    (99, '2026-07-11T21:00:00.000Z'),
    (100, '2026-07-12T01:00:00.000Z')
) AS schedule("match_number", "match_date_utc")
WHERE "matches"."match_number" = schedule."match_number";
