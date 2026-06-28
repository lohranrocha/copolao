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
  ('52307f04-98bb-4d46-b6ea-c1db4c284e3f', 74, 'Alemanha', 'Paraguai', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-29T17:00:00.000Z', '2026-06-29T16:30:00.000Z', 'SCHEDULED', NOW()),
  ('a4c76ac5-44f0-4b76-b241-b1b861972075', 75, 'Holanda', 'Marrocos', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-29T20:30:00.000Z', '2026-06-29T20:00:00.000Z', 'SCHEDULED', NOW()),
  ('3d748172-d10e-482a-ae31-3fe7ccc641ca', 76, 'Brasil', 'Japão', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-30T01:00:00.000Z', '2026-06-30T00:30:00.000Z', 'SCHEDULED', NOW()),
  ('567e3057-9a68-49bd-afb5-d355d7430a46', 77, 'França', 'Suécia', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-30T17:00:00.000Z', '2026-06-30T16:30:00.000Z', 'SCHEDULED', NOW()),
  ('eecb3879-6575-4867-ad36-7b3f09a33d20', 78, 'Costa do Marfim', 'Noruega', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-06-30T21:00:00.000Z', '2026-06-30T20:30:00.000Z', 'SCHEDULED', NOW()),
  ('91ff6939-7d4b-4eb8-8966-e80aa899646d', 79, 'México', 'Equador', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-01T01:00:00.000Z', '2026-07-01T00:30:00.000Z', 'SCHEDULED', NOW()),
  ('c2d26f61-b817-4059-a306-f9bf2501fce7', 80, 'Inglaterra', 'RD Congo', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-01T16:00:00.000Z', '2026-07-01T15:30:00.000Z', 'SCHEDULED', NOW()),
  ('bda8c3d3-9a68-47a3-8d67-1c97a29fd083', 81, 'Estados Unidos', 'Bósnia e Herzegovina', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-01T23:00:00.000Z', '2026-07-01T22:30:00.000Z', 'SCHEDULED', NOW()),
  ('dcbcf2df-2523-4e89-a778-c128d98c579d', 82, 'Bélgica', 'Senegal', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-02T02:30:00.000Z', '2026-07-02T02:00:00.000Z', 'SCHEDULED', NOW()),
  ('5b99ffc1-b6cd-41a5-a6a0-3d542d59c8de', 83, 'Portugal', 'Croácia', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-02T19:00:00.000Z', '2026-07-02T18:30:00.000Z', 'SCHEDULED', NOW()),
  ('5e5538d6-bf0d-40a8-a8db-588cc319ad94', 84, 'Espanha', 'Áustria', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-02T23:00:00.000Z', '2026-07-02T22:30:00.000Z', 'SCHEDULED', NOW()),
  ('0f4e725a-00da-4ef9-8548-04f2d6a9eac7', 85, 'Suíça', 'Argélia', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-03T02:00:00.000Z', '2026-07-03T01:30:00.000Z', 'SCHEDULED', NOW()),
  ('35f81eef-7210-4a82-9585-d989f5a9849a', 86, 'Argentina', 'Cabo Verde', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-03T18:00:00.000Z', '2026-07-03T17:30:00.000Z', 'SCHEDULED', NOW()),
  ('9aef51c4-595d-4eb9-bfe0-1762194c9250', 87, 'Colômbia', 'Gana', NULL, 'ROUND_OF_32', 'A definir', 'A definir', '2026-07-03T22:00:00.000Z', '2026-07-03T21:30:00.000Z', 'SCHEDULED', NOW()),
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
  "updated_at" = NOW()
WHERE "matches"."status" <> 'FINISHED';
