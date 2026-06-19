UPDATE "matches"
SET
  "match_date_utc" = corrected."match_date_utc",
  "lock_at_utc" = corrected."match_date_utc" - INTERVAL '30 minutes'
FROM (
  VALUES
    (28, TIMESTAMP '2026-06-19 01:00:00'),
    (31, TIMESTAMP '2026-06-20 03:00:00'),
    (32, TIMESTAMP '2026-06-20 00:30:00'),
    (36, TIMESTAMP '2026-06-21 04:00:00'),
    (48, TIMESTAMP '2026-06-24 02:00:00'),
    (53, TIMESTAMP '2026-06-25 01:00:00'),
    (54, TIMESTAMP '2026-06-25 01:00:00'),
    (64, TIMESTAMP '2026-06-27 00:00:00')
) AS corrected("match_number", "match_date_utc")
WHERE "matches"."match_number" = corrected."match_number";
