INSERT INTO "matches" (
  "id",
  "match_number",
  "home_team",
  "away_team",
  "group_code",
  "stage",
  "venue",
  "city",
  "match_date_utc",
  "lock_at_utc",
  "status",
  "updated_at"
)
VALUES
  ('dd0dc9b8-a854-40fd-8b13-21db5da75f23', 93, 'Portugal', 'Espanha', NULL, 'ROUND_OF_16', 'A definir', 'A definir', '2026-07-06T19:00:00.000Z', '2026-07-06T18:30:00.000Z', 'SCHEDULED', NOW()),
  ('77291189-38c3-4a4f-8dc4-cc507a4c05dc', 94, 'Estados Unidos', 'Bélgica', NULL, 'ROUND_OF_16', 'A definir', 'A definir', '2026-07-07T00:00:00.000Z', '2026-07-06T23:30:00.000Z', 'SCHEDULED', NOW()),
  ('4f389dca-14e7-4937-87df-105c0add4f0f', 95, 'Argentina', 'Egito', NULL, 'ROUND_OF_16', 'A definir', 'A definir', '2026-07-07T16:00:00.000Z', '2026-07-07T15:30:00.000Z', 'SCHEDULED', NOW()),
  ('6d3e9e3a-11f4-407f-b17c-cc35dc90f651', 96, 'Suíça', 'Colômbia', NULL, 'ROUND_OF_16', 'A definir', 'A definir', '2026-07-07T20:00:00.000Z', '2026-07-07T19:30:00.000Z', 'SCHEDULED', NOW()),
  ('b88a73e3-f1c9-45be-94b8-2dd2396cd6c6', 97, 'Marrocos', 'França', NULL, 'QUARTER_FINAL', 'A definir', 'A definir', '2026-07-09T20:00:00.000Z', '2026-07-09T19:30:00.000Z', 'SCHEDULED', NOW())
ON CONFLICT ("match_number") DO UPDATE SET
  "home_team" = EXCLUDED."home_team",
  "away_team" = EXCLUDED."away_team",
  "group_code" = EXCLUDED."group_code",
  "stage" = EXCLUDED."stage",
  "venue" = EXCLUDED."venue",
  "city" = EXCLUDED."city",
  "match_date_utc" = EXCLUDED."match_date_utc",
  "lock_at_utc" = EXCLUDED."lock_at_utc",
  "updated_at" = NOW()
WHERE "matches"."status" <> 'FINISHED';
