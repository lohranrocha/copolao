-- CreateTable
CREATE TABLE "bonus_questions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "lock_at_utc" TIMESTAMP(3) NOT NULL,
    "correct_answer" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer" VARCHAR(120) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bonus_questions_title_key" ON "bonus_questions"("title");

-- CreateIndex
CREATE INDEX "bonus_questions_lock_at_utc_idx" ON "bonus_questions"("lock_at_utc");

-- CreateIndex
CREATE INDEX "bonus_predictions_question_id_idx" ON "bonus_predictions"("question_id");

-- CreateIndex
CREATE INDEX "bonus_predictions_user_id_idx" ON "bonus_predictions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bonus_predictions_user_id_question_id_key" ON "bonus_predictions"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "bonus_predictions" ADD CONSTRAINT "bonus_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_predictions" ADD CONSTRAINT "bonus_predictions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "bonus_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
