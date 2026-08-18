// Shared taxonomy + scoring for the hair-loss quiz recommendation engine.
// Used by both the admin product-tagging UI and the public quiz flow so the
// two never drift apart.

export type QuizOption = { value: string; label: string; hint?: string };
export type QuizQuestion = {
  id: string;
  title: string;
  eyebrow?: string;
  hint?: string;
  options: QuizOption[];
  weight?: number;
  allowSkip?: boolean;
  skipValue?: string;
};
export type QuizConfig = {
  title?: string;
  lead?: string;
  questions: QuizQuestion[];
};
export type QuizTags = Record<string, string[]>;
export type QuizAnswers = Record<string, string | undefined>;

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

export const DEFAULT_QUIZ_CONFIG: QuizConfig = {
  title: "Phác đồ gợi ý dành riêng cho bạn",
  lead: "Chọn tất cả các trường hợp mà sản phẩm này phù hợp. Bỏ trống một mục nghĩa là mục đó không ảnh hưởng đến việc gợi ý.",
  questions: [
    {
      id: "goals",
      eyebrow: "BƯỚC 1",
      title: "Mục tiêu của bạn với mái tóc là gì?",
      hint: "Điều này giúp xác định phác đồ phù hợp nhất.",
      options: QUIZ_GOALS,
      weight: 2,
    },
    {
      id: "stages",
      eyebrow: "BƯỚC 2",
      title: "Bạn mô tả tình trạng rụng tóc hiện tại như thế nào?",
      options: QUIZ_STAGES,
      weight: 2,
      allowSkip: true,
      skipValue: "visible",
    },
    {
      id: "durations",
      eyebrow: "BƯỚC 3",
      title: "Tình trạng này đã kéo dài bao lâu?",
      options: QUIZ_DURATIONS,
      weight: 1,
      allowSkip: true,
      skipValue: "6_12m",
    },
    {
      id: "formats",
      eyebrow: "BƯỚC 4",
      title: "Bạn muốn điều trị theo hình thức nào?",
      options: QUIZ_FORMATS,
      weight: 1,
      allowSkip: true,
    },
    {
      id: "priorities",
      eyebrow: "BƯỚC 5",
      title: "Ưu tiên hàng đầu của bạn là gì?",
      hint: "Giúp CareWise chọn đúng hướng chăm sóc cho bạn.",
      options: QUIZ_PRIORITIES,
      weight: 1,
    },
  ],
};

export const emptyQuizTags = (config: QuizConfig = DEFAULT_QUIZ_CONFIG): QuizTags =>
  Object.fromEntries(config.questions.map((question) => [question.id, []]));

export function normalizeQuizConfig(config?: Partial<QuizConfig> | null): QuizConfig {
  const questions = (config?.questions?.length ? config.questions : DEFAULT_QUIZ_CONFIG.questions)
    .map((question) => ({
      ...question,
      id: String(question.id || "").trim(),
      title: String(question.title || "").trim(),
      options: (question.options ?? []).filter((option) => option.value && option.label),
      weight: Math.max(1, Number(question.weight || 1)),
    }))
    .filter((question) => question.id && question.title && question.options.length);
  return {
    title: config?.title || DEFAULT_QUIZ_CONFIG.title,
    lead: config?.lead || DEFAULT_QUIZ_CONFIG.lead,
    questions: questions.length ? questions : DEFAULT_QUIZ_CONFIG.questions,
  };
}

export function answerKey(questionId: string) {
  const legacyAnswerKeys: Record<string, string> = {
    goals: "goal",
    stages: "stage",
    durations: "duration",
    formats: "format",
    priorities: "priority",
  };
  return legacyAnswerKeys[questionId] ?? questionId;
}

export function scoreProduct(tags: Partial<QuizTags> | undefined, answers: QuizAnswers, config: QuizConfig = DEFAULT_QUIZ_CONFIG): number {
  if (!tags) return 0;
  let score = 0;
  for (const question of config.questions) {
    const answer = answers[answerKey(question.id)] ?? answers[question.id];
    if (answer && tags[question.id]?.includes(answer)) score += Math.max(1, question.weight ?? 1);
  }
  return score;
}

export function hasAnyQuizTags(tags: Partial<QuizTags> | undefined): boolean {
  if (!tags) return false;
  return Object.values(tags).some((values) => Array.isArray(values) && values.length > 0);
}
