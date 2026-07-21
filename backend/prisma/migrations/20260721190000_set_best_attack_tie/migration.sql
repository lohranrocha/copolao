WITH target_question AS (
  UPDATE "bonus_questions"
  SET
    "correct_answer" = 'França; Inglaterra',
    "updated_at" = NOW()
  WHERE "title" = 'Melhor ataque'
  RETURNING "id", "points"
)
UPDATE "bonus_predictions"
SET
  "is_correct" = translate(
    lower(trim("bonus_predictions"."answer")),
    'áàâãäéèêëíìîïóòôõöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'
  ) IN ('franca', 'inglaterra'),
  "points" = CASE
    WHEN translate(
      lower(trim("bonus_predictions"."answer")),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ) IN ('franca', 'inglaterra') THEN target_question."points"
    ELSE 0
  END,
  "updated_at" = NOW()
FROM target_question
WHERE "bonus_predictions"."question_id" = target_question."id";
