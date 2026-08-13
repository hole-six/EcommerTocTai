import { HairLossQuiz } from "@/components/store/HairLossQuiz";

export const metadata = {
  title: "Kiểm tra tóc",
  robots: { index: false, follow: false },
};

export default function HairFormPage() {
  return <HairLossQuiz />;
}
