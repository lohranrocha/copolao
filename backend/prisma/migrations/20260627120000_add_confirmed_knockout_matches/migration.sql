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
  ('c8fa6bd5-fad2-49c7-9765-88a12097a073', 73, 'África do Sul', 'Canadá', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-28T19:00:00.000Z', '2026-06-28T18:30:00.000Z', 'SCHEDULED', NOW()),
  ('a4c76ac5-44f0-4b76-b241-b1b861972075', 75, 'Holanda', 'Marrocos', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-29T20:30:00.000Z', '2026-06-29T20:00:00.000Z', 'SCHEDULED', NOW()),
  ('3d748172-d10e-482a-ae31-3fe7ccc641ca', 76, 'Brasil', 'Japão', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-30T01:00:00.000Z', '2026-06-30T00:30:00.000Z', 'SCHEDULED', NOW()),
  ('eecb3879-6575-4867-ad36-7b3f09a33d20', 78, 'Costa do Marfim', 'Noruega', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-30T21:00:00.000Z', '2026-06-30T20:30:00.000Z', 'SCHEDULED', NOW()),
  ('09ea40dd-d47e-4f08-9295-9901c484b5b7', 88, 'Austrália', 'Egito', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-04T00:30:00.000Z', '2026-07-04T00:00:00.000Z', 'SCHEDULED', NOW())
ON CONFLICT ("match_number") DO UPDATE SET
  "home_team" = EXCLUDED."home_team",
  "away_team" = EXCLUDED."away_team",
  "group_code" = EXCLUDED."group_code",
  "stage" = EXCLUDED."stage",
  "venue" = EXCLUDED."venue",
  "city" = EXCLUDED."city",
  "match_date_utc" = EXCLUDED."match_date_utc",
  "lock_at_utc" = EXCLUDED."lock_at_utc",
  "updated_at" = NOW();
