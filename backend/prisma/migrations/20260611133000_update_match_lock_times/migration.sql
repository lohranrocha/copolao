UPDATE "matches"
SET "lock_at_utc" = "match_date_utc" - INTERVAL '30 minutes';
