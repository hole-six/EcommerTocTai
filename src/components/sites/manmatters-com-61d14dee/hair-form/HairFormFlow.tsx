"use client";
import { useState } from "react";
import styles from "./HairFormFlowFixed.module.css";

const answers = ["Stage 1 hair fall", "Stage 2 hair fall", "Stage 3 hair fall", "Not sure"];

export function HairFormFlow() {
  const [screen, setScreen] = useState<"intro" | "question" | "upload">("intro");
  const [selected, setSelected] = useState("");
  const header = (back?: () => void, step = "Hair assessment") => <header><button className={styles.back} onClick={back}>←</button><b>Man Matters</b><span>{step}</span></header>;
  if (screen === "intro") return <main className={styles.page}>{header()}<section className={styles.intro}><div className={styles.illustration}><span>✦</span><i>✓</i></div><p className={styles.kicker}>PERSONALISED HAIR CARE</p><h1>Let’s understand your hair better</h1><p>Answer a few basic health questions and get an expert-built hair loss plan.</p><button onClick={() => setScreen("question")}>Let&apos;s Begin <span>→</span></button><small>It takes less than a minute</small></section></main>;
  if (screen === "question") return <main className={styles.page}>{header(() => setScreen("intro"), "1 of 1")}<section className={styles.form}><div className={styles.progress}><i /></div><p className={styles.kicker}>HAIR LOSS ASSESSMENT</p><h1>Which of the following best describes your hair loss?</h1><p className={styles.muted}>Choose the option that feels closest to your current concern.</p><div className={styles.options}>{answers.map((answer) => <button className={selected === answer ? styles.selected : ""} key={answer} onClick={() => setSelected(answer)}><span>{answer}</span>{selected === answer && <b>✓</b>}</button>)}</div><button className={styles.next} disabled={!selected} onClick={() => setScreen("upload")}>Next <span>→</span></button></section></main>;
  return <main className={styles.page}>{header(() => setScreen("question"), "2 of 2")}<section className={styles.form}><div className={styles.progress}><i className={styles.full} /></div><p className={styles.kicker}>UPLOAD IMAGES</p><h1>Upload images of the affected area</h1><p className={styles.muted}>Uploading images helps the doctor assess your condition better.</p><div className={styles.uploadCard}><div className={styles.uploadIcon}>＋</div><b>Upload Images</b><span>Take a picture of your hairline and crown</span><label>Choose from gallery<input type="file" accept="image/*" /></label></div><p className={styles.skip}>Skip Image Upload?</p><button className={styles.next} onClick={() => setScreen("intro")}>Continue <span>→</span></button></section></main>;
}
