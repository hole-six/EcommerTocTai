import { HairLossQuiz } from "@/components/store/HairLossQuiz";

export const metadata = {
  title: "Kiểm tra tóc | CareWise",
  robots: { index: false, follow: false },
};

export default function HairFormPage() {
  return <HairLossQuiz />;
}
