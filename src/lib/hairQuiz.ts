// Shared taxonomy + scoring for the hair-loss quiz recommendation engine.
// Used by both the admin product-tagging UI and the public quiz flow so the
// two never drift apart.

export type QuizTags = {
  goals: string[];
  stages: string[];
  durations: string[];
  formats: string[];
  priorities: string[];
};

export const emptyQuizTags = (): QuizTags => ({
  goals: [],
  stages: [],
  durations: [],
  formats: [],
  priorities: [],
});

export type QuizOption = { value: string; label: string; hint?: string };

export const QUIZ_GOALS: QuizOption[] = [
  { value: "regrow", label: "Phục hồi tóc đã rụng" },
  { value: "preserve", label: "Giữ mái tóc hiện tại" },
  { value: "both", label: "Cả hai" },
];

export const QUIZ_STAGES: QuizOption[] = [
  { value: "early", label: "Mới bắt đầu", hint: "Bắt đầu nhận thấy tóc thưa" },
  { value: "visible", label: "Rụng tóc rõ rệt", hint: "Thưa hoặc rụng nhận thấy rõ" },
  { value: "receding", label: "Hói trán hoặc thưa đỉnh đầu", hint: "Rụng theo kiểu mẫu ở trán hoặc đỉnh đầu" },
  { value: "advanced", label: "Rụng tóc nặng", hint: "Thưa hoặc hói trên diện rộng" },
];

export const QUIZ_DURATIONS: QuizOption[] = [
  { value: "under_6m", label: "Dưới 6 tháng" },
  { value: "6_12m", label: "6–12 tháng" },
  { value: "1_3y", label: "1–3 năm" },
  { value: "3y_plus", label: "Trên 3 năm" },
];

export const QUIZ_FORMATS: QuizOption[] = [
  { value: "oral", label: "Dạng uống", hint: "Viên uống / kẹo dẻo dùng hằng ngày" },
  { value: "topical", label: "Dạng bôi ngoài da", hint: "Thoa trực tiếp lên da đầu" },
];

export const QUIZ_PRIORITIES: QuizOption[] = [
  { value: "fast", label: "Thấy hiệu quả càng sớm càng tốt" },
  { value: "balanced", label: "Hiệu quả cân bằng, chăm sóc lâu dài" },
  { value: "affordable", label: "Đơn giản & tiết kiệm" },
];

export type QuizAnswers = {
  goal?: string;
  stage?: string;
  duration?: string;
  format?: string;
  priority?: string;
};

/**
 * Weighted match score between a product's quiz tags and the user's answers.
 * Goal + stage carry more weight since they're the primary clinical signal;
 * duration/format/priority only refine among already-relevant products.
 * A dimension the admin left untagged contributes 0 either way — it never
 * excludes a product, it's just not counted as a point in its favor.
 */
export function scoreProduct(tags: Partial<QuizTags> | undefined, answers: QuizAnswers): number {
  if (!tags) return 0;
  let score = 0;
  if (answers.goal && tags.goals?.includes(answers.goal)) score += 2;
  if (answers.stage && tags.stages?.includes(answers.stage)) score += 2;
  if (answers.duration && tags.durations?.includes(answers.duration)) score += 1;
  if (answers.format && tags.formats?.includes(answers.format)) score += 1;
  if (answers.priority && tags.priorities?.includes(answers.priority)) score += 1;
  return score;
}

export function hasAnyQuizTags(tags: Partial<QuizTags> | undefined): boolean {
  if (!tags) return false;
  return Boolean(
    tags.goals?.length ||
      tags.stages?.length ||
      tags.durations?.length ||
      tags.formats?.length ||
      tags.priorities?.length,
  );
}
