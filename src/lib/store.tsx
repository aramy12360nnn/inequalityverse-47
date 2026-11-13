"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_QUESTIONS, type Question } from "./questions";

export type Settings = { hints: boolean; solutions: boolean; projector: boolean; theme: "dark" | "light"; sound: boolean; passcode: string };
export type Attempt = { qid: string; correct: boolean; at: number; source: string };
export type Progress = {
  answers: Record<string, { correct: boolean; tries: number }>;
  stars: number;
  log: Attempt[];
  stations: number; // عدد المحطات المكتملة
  challengeScore: number;
  lessonsDone: number[];
  labUses: number;
  name: string;
};
const DEF_SETTINGS: Settings = { hints: true, solutions: true, projector: false, theme: "dark", sound: true, passcode: "4747" };
const DEF_PROGRESS: Progress = { answers: {}, stars: 0, log: [], stations: 0, challengeScore: 0, lessonsDone: [], labUses: 0, name: "" };

type Ctx = {
  settings: Settings; setSettings: (s: Partial<Settings>) => void;
  progress: Progress; setProgress: (f: (p: Progress) => Progress) => void; resetProgress: () => void;
  questions: Question[]; setQuestions: (q: Question[]) => void;
  record: (qid: string, correct: boolean, source: string) => void;
  play: (kind: "ok" | "try" | "win" | "click") => void;
  ready: boolean;
};
const C = createContext<Ctx | null>(null);
const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; }
};

let actx: AudioContext | null = null;
function tone(freqs: number[], dur = 0.12) {
  try {
    actx = actx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = actx!.createOscillator(), g = actx!.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = actx!.currentTime + i * dur;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.6);
      o.connect(g).connect(actx!.destination);
      o.start(t); o.stop(t + dur * 1.8);
    });
  } catch { /* no audio */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setS] = useState<Settings>(DEF_SETTINGS);
  const [progress, setP] = useState<Progress>(DEF_PROGRESS);
  const [questions, setQ] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setS(load("ineq-settings", DEF_SETTINGS));
    setP(load("ineq-progress", DEF_PROGRESS));
    try { const q = localStorage.getItem("ineq-questions"); if (q) setQ(JSON.parse(q)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("ineq-settings", JSON.stringify(settings)); }, [settings, ready]);
  useEffect(() => { if (ready) localStorage.setItem("ineq-progress", JSON.stringify(progress)); }, [progress, ready]);
  useEffect(() => {
    const r = document.documentElement;
    r.classList.toggle("light", settings.theme === "light");
    r.classList.toggle("projector", settings.projector);
  }, [settings.theme, settings.projector]);

  const setSettings = useCallback((s: Partial<Settings>) => setS((o) => ({ ...o, ...s })), []);
  const setProgress = useCallback((f: (p: Progress) => Progress) => setP(f), []);
  const setQuestions = useCallback((q: Question[]) => { setQ(q); localStorage.setItem("ineq-questions", JSON.stringify(q)); }, []);
  const resetProgress = useCallback(() => setP({ ...DEF_PROGRESS }), []);
  const play = useCallback((k: "ok" | "try" | "win" | "click") => {
    if (!settings.sound) return;
    if (k === "ok") tone([660, 880, 1175]);
    else if (k === "try") tone([440, 392], 0.15);
    else if (k === "win") tone([523, 659, 784, 1046, 1318], 0.14);
    else tone([700], 0.05);
  }, [settings.sound]);
  const record = useCallback((qid: string, correct: boolean, source: string) => {
    setP((p) => {
      const prev = p.answers[qid];
      const tries = (prev?.tries ?? 0) + 1;
      const already = prev?.correct;
      const gained = correct && !already ? (tries === 1 ? 3 : 1) : 0;
      return {
        ...p,
        answers: { ...p.answers, [qid]: { correct: already || correct, tries } },
        stars: p.stars + gained,
        log: [...p.log, { qid, correct, at: Date.now(), source }].slice(-500),
      };
    });
  }, []);
  return <C.Provider value={{ settings, setSettings, progress, setProgress, resetProgress, questions, setQuestions, record, play, ready }}>{children}</C.Provider>;
}
export const useApp = () => {
  const c = useContext(C);
  if (!c) throw new Error("AppProvider missing");
  return c;
};
