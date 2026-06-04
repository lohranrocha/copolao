-- CreateTable
CREATE TABLE "group_standing_predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_code" VARCHAR(2) NOT NULL,
    "first_team" VARCHAR(100) NOT NULL,
    "second_team" VARCHAR(100) NOT NULL,
    "third_team" VARCHAR(100) NOT NULL,
    "fourth_team" VARCHAR(100) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "correct_positions" INTEGER NOT NULL DEFAULT 0,
    "is_perfect" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_standing_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_standing_results" (
    "id" UUID NOT NULL,
    "group_code" VARCHAR(2) NOT NULL,
    "first_team" VARCHAR(100) NOT NULL,
    "second_team" VARCHAR(100) NOT NULL,
    "third_team" VARCHAR(100) NOT NULL,
    "fourth_team" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_standing_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_standing_predictions_group_code_idx" ON "group_standing_predictions"("group_code");

-- CreateIndex
CREATE INDEX "group_standing_predictions_user_id_idx" ON "group_standing_predictions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_standing_predictions_user_id_group_code_key" ON "group_standing_predictions"("user_id", "group_code");

-- CreateIndex
CREATE UNIQUE INDEX "group_standing_results_group_code_key" ON "group_standing_results"("group_code");

-- AddForeignKey
ALTER TABLE "group_standing_predictions" ADD CONSTRAINT "group_standing_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
