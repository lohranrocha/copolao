UPDATE "matches"
SET "lock_at_utc" = "match_date_utc" - INTERVAL '15 minutes'
WHERE "match_number" IN (103, 104);
