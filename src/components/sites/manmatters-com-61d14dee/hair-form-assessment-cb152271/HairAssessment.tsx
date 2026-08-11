"use client";

import { Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "../shared/SiteHeader";
import styles from "./HairAssessment.module.css";

type Question = { title: string; helper: string; options: string[] };

const questions: Question[] = [
  { title: "What would you like help with today?", helper: "Pick the concern that feels most relevant right now.", options: ["Hair fall", "Thinning hair", "Dandruff & flaking", "Overall hair health"] },
  { title: "How long have you noticed this concern?", helper: "This helps us understand where to begin.", options: ["Less than 3 months", "3–6 months", "6–12 months", "More than a year"] },
  { title: "Which area concerns you the most?", helper: "Choose the area you notice first in the mirror.", options: ["Hairline", "Crown", "Across the scalp", "Not sure yet"] },
  { title: "How would you describe your scalp?", helper: "Your scalp type shapes a comfortable routine.", options: ["Oily", "Dry", "Itchy or flaky", "Balanced"] },
  { title: "How often do you currently care for your hair?", helper: "There is no wrong answer — we will keep your plan realistic.", options: ["Every day", "A few times a week", "Once a week", "I am just getting started"] },
];

export function HairAssessment() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const complete = step === questions.length;
  const current = questions[step];
  const concern = answers[0] ?? "hair health";
  const progress = complete ? 100 : ((step + 1) / questions.length) * 100;
  const recommendation = useMemo(() => concern === "Dandruff & flaking" ? "a scalp-first cleansing routine" : concern === "Hair fall" || concern === "Thinning hair" ? "a consistent strengthening and scalp-care routine" : "a simple, supportive hair routine", [concern]);

  function choose(option: string) {
    setAnswers((previous) => {
      const next = [...previous];
      next[step] = option;
      return next;
    });
  }

  function next() {
    if (!answers[step]) return;
    setStep((value) => Math.min(value + 1, questions.length));
  }

  function restart() {
    setAnswers([]);
    setStep(0);
  }

  return (
    <main className={styles.page}>
      <SiteHeader />
      <section className={styles.canvas}>
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />
        <div className={styles.intro}>
          <span><Sparkles size={15} /> Personalised hair assessment</span>
          <h1>Your hair, understood.</h1>
          <p>Answer a few quick questions to get a hair-care plan tailored to you.</p>
        </div>
        <div className={styles.card}>
          {!complete ? (
            <>
              <div className={styles.progressMeta}><span>Step {step + 1} of {questions.length}</span><span>{Math.round(progress)}%</span></div>
              <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>
              <p className={styles.eyebrow}>LET&apos;S GET TO KNOW YOUR HAIR</p>
              <h2>{current.title}</h2>
              <p className={styles.helper}>{current.helper}</p>
              <div className={styles.options}>
                {current.options.map((option) => {
                  const selected = answers[step] === option;
                  return <button className={selected ? styles.selected : ""} key={option} onClick={() => choose(option)}><span>{option}</span>{selected && <Check size={18} />}</button>;
                })}
              </div>
              <div className={styles.controls}>
                <button className={styles.back} disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ChevronLeft size={18} /> Back</button>
                <button className={styles.next} disabled={!answers[step]} onClick={next}>Continue <ChevronRight size={18} /></button>
              </div>
            </>
          ) : (
            <div className={styles.result}>
              <div className={styles.resultMark}><Check size={28} /></div>
              <p className={styles.eyebrow}>ASSESSMENT COMPLETE</p>
              <h2>Your personalised starting point</h2>
              <p>Based on your answers, we&apos;d suggest {recommendation}. Begin gently, stay consistent, and check in with an expert if your concern feels sudden or severe.</p>
              <div className={styles.plan}><b>Your focus</b><span>{concern}</span><b>Your next step</b><span>Build a simple 3-step routine</span></div>
              <button className={styles.restart} onClick={restart}><RotateCcw size={17} /> Start over</button>
            </div>
          )}
        </div>
        <p className={styles.note}>This assessment is for guidance only and does not replace medical advice.</p>
      </section>
    </main>
  );
}
