"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { LESSONS, LEVEL_NAMES, TYPE_NAMES, type QType } from "@/lib/questions";
import { ar } from "@/lib/math";
import QuestionCard from "./QuestionCard";

export default function Practice() {
  const { questions, progress } = useApp();
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [lesson, setLesson] = useState(0);
  const [type, setType] = useState<"" | QType>("");
  const [i, setI] = useState(0);
  const list = questions.filter((q) => (!level || q.level === level) && (!lesson || q.lesson === lesson) && (!type || q.type === type));
  const q = list[Math.min(i, list.length - 1)];
  const solved = list.filter((x) => progress.answers[x.id]?.correct).length;
  const reset = (f: () => void) => { f(); setI(0); };
  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {([0, 1, 2, 3] as const).map((l) => (
            <button key={l} className={`btn-sm ${level === l ? "btn-on" : ""}`} onClick={() => reset(() => setLevel(l))}>
              {l === 0 ? "كل المستويات" : LEVEL_NAMES[l]} ({ar(questions.filter((x) => !l || x.level === l).length)})
            </button>
          ))}
        </div>
        <select className="input !w-auto !py-2" value={lesson} onChange={(e) => reset(() => setLesson(+e.target.value))}>
          <option value={0}>كل الدروس</option>
          {LESSONS.map((l) => <option key={l.id} value={l.id}>{l.code} {l.title}</option>)}
        </select>
        <select className="input !w-auto !py-2" value={type} onChange={(e) => reset(() => setType(e.target.value as QType | ""))}>
          <option value="">كل الأنواع</option>
          {Object.entries(TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {list.length === 0 ? <div className="card p-6 text-center">لا توجد أسئلة بهذه التصفية.</div> : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 progress"><div style={{ width: `${(solved / list.length) * 100}%` }} /></div>
            <span className="text-sm whitespace-nowrap">أتقنتِ {ar(solved)} من {ar(list.length)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {list.map((x, k) => (
              <button key={x.id} onClick={() => setI(k)} className={`dot ${k === i ? "dot-on" : ""} ${progress.answers[x.id]?.correct ? "dot-ok" : progress.answers[x.id] ? "dot-try" : ""}`}>{ar(k + 1)}</button>
            ))}
          </div>
          <QuestionCard key={q.id} q={q} source="التدريب" />
          <div className="flex justify-between gap-2">
            <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>➡ السابق</button>
            <button className="btn-ghost" onClick={() => setI(Math.floor(Math.random() * list.length))}>🎲 سؤال عشوائي</button>
            <button className="btn-primary" disabled={i >= list.length - 1} onClick={() => setI(i + 1)}>التالي ⬅</button>
          </div>
        </>
      )}
    </div>
  );
}
