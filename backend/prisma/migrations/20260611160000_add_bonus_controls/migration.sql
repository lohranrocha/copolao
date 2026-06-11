CREATE TABLE "bonus_controls" (
  "key" VARCHAR(80) NOT NULL,
  "lock_at_utc" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "bonus_controls_pkey" PRIMARY KEY ("key")
);
