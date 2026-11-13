"use client";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { LESSONS, LEVEL_NAMES, TYPE_NAMES, type Question, type Ray } from "@/lib/questions";
import { RayEditor, rayToSet } from "./NumberLine";
import { sameSet, ar } from "@/lib/math";

const PRAISE = ["أحسنتِ يا بطلة! 🌟", "رائع! تفكير رياضي مميز ✨", "إجابة صحيحة، استمري! 🚀", "مذهلة! أنتِ تتقنين المهارة 💜"];

function shuffleOrder(items: string[], seed: string) {
  const idx = items.map((_, i) => i);
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 9973;
  for (let i = idx.length - 1; i > 0; i--) { h = (h * 7 + 13) % 9973; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (idx.every((v, i) => v === i)) idx.reverse();
  return idx;
}

export default function QuestionCard({ q, source, onDone }: { q: Question; source: string; onDone?: (correct: boolean, firstTry: boolean) => void }) {
  const { settings, record, play } = useApp();
  const [sel, setSel] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>(() => (q.items ? shuffleOrder(q.items, q.id) : []));
  const [ray, setRay] = useState<Ray>({ point: 0, closed: false, dir: "right" });
  const [state, setState] = useState<"idle" | "ok" | "try">("idle");
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(false);
  const [sol, setSol] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], []);
  const lesson = LESSONS.find((l) => l.id === q.lesson);
  const done = state === "ok";

  const check = () => {
    let ok = false;
    if (q.type === "order") ok = order.every((v, i) => v === i);
    else if (q.type === "graph") ok = !!q.target && sameSet(rayToSet(ray), rayToSet(q.target));
    else ok = sel !== null && sel === q.answer;
    const t = tries + 1;
    setTries(t);
    record(q.id, ok, source);
    if (ok) { setState("ok"); play("ok"); if (settings.solutions) setSol(true); onDone?.(true, t === 1); }
    else { setState("try"); play("try"); }
  };
  const canCheck = q.type === "order" || q.type === "graph" || sel !== null;
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const o = [...order];
    [o[i], o[j]] = [o[j], o[i]];
    setOrder(o); setState("idle");
  };

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="chip">{lesson?.code} {lesson?.title}</span>
        <span className="chip">{LEVEL_NAMES[q.level]}</span>
        <span className="chip">{TYPE_NAMES[q.type]}</span>
      </div>
      <p className="text-lg md:text-xl font-bold whitespace-pre-line leading-relaxed">{q.type === "drag" ? q.prompt.split("   ⟸")[0].replace("اسحبي الرمز الصحيح إلى الفراغ:", "اسحبي الرمز الصحيح إلى الفراغ لإكمال الحل:") : q.prompt}</p>
      {q.expr && q.type !== "drag" && <div className="math-box">{q.expr}</div>}

      {(q.type === "mcq" || q.type === "error" || q.type === "word") && (
        <div className="grid sm:grid-cols-2 gap-3">
          {q.choices!.map((c, i) => (
            <button key={i} disabled={done} onClick={() => { setSel(i); setState("idle"); play("click"); }}
              className={`choice ${sel === i ? "choice-sel" : ""} ${done && i === q.answer ? "choice-ok" : ""}`}>
              <span className="choice-num">{["أ", "ب", "ج", "د"][i]}</span>{c}
            </button>
          ))}
        </div>
      )}

      {q.type === "drag" && (
        <div className="space-y-4">
          <div className="math-box flex flex-wrap items-center justify-center gap-3">
            <span>{q.expr}</span><span className="opacity-70">⟸</span><span>س</span>
            <span onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const i = Number(e.dataTransfer.getData("text")); if (!done) { setSel(i); setState("idle"); } }}
              className={`drop-zone ${sel !== null ? "filled" : ""}`}>{sel !== null ? q.choices![sel] : "؟"}</span>
            <span>{ar(q.prompt.split("س ـــ ")[1] ?? "")}</span>
          </div>
          <div className="flex justify-center gap-3">
            {q.choices!.map((c, i) => (
              <button key={i} draggable={!done} onDragStart={(e) => e.dataTransfer.setData("text", String(i))} onClick={() => { if (!done) { setSel(i); setState("idle"); play("click"); } }}
                className="drag-chip">{c}</button>
            ))}
          </div>
          <p className="text-center text-sm opacity-70">اسحبي الرمز أو المسيه ليوضع في الفراغ</p>
        </div>
      )}

      {q.type === "order" && (
        <ol className="space-y-2">
          {order.map((v, i) => (
            <li key={v} draggable={!done} onDragStart={() => setDragIdx(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx === null || done) return; const o = [...order]; const [m] = o.splice(dragIdx, 1); o.splice(i, 0, m); setOrder(o); setDragIdx(null); setState("idle"); }}
              className={`order-item ${done ? "choice-ok" : ""}`}>
              <span className="choice-num">{ar(i + 1)}</span>
              <span className="flex-1 text-lg font-bold">{q.items![v]}</span>
              {!done && <span className="flex gap-1"><button className="mini-btn" onClick={() => move(i, -1)} aria-label="أعلى">▲</button><button className="mini-btn" onClick={() => move(i, 1)} aria-label="أسفل">▼</button></span>}
            </li>
          ))}
        </ol>
      )}

      {q.type === "graph" && (
        <div className="space-y-3">
          <RayEditor rays={[ray]} onChange={(_, r) => { setRay(r); setState("idle"); }} colors={["#e879f9"]} compare={done && q.target ? rayToSet(q.target) : null} />
          <div className="flex flex-wrap gap-2 justify-center">
            <button className={`btn-sm ${!ray.closed ? "btn-on" : ""}`} onClick={() => setRay({ ...ray, closed: false })}>○ دائرة مفتوحة</button>
            <button className={`btn-sm ${ray.closed ? "btn-on" : ""}`} onClick={() => setRay({ ...ray, closed: true })}>● دائرة مغلقة</button>
            <button className="btn-sm" onClick={() => setRay({ ...ray, point: Math.max(-10, ray.point - 1) })}>نقطة − ١</button>
            <button className="btn-sm" onClick={() => setRay({ ...ray, point: Math.min(10, ray.point + 1) })}>نقطة + ١</button>
            <button className={`btn-sm ${ray.dir === "left" ? "btn-on" : ""}`} onClick={() => setRay({ ...ray, dir: "left" })}>⬅ السهم يسارًا</button>
            <button className={`btn-sm ${ray.dir === "right" ? "btn-on" : ""}`} onClick={() => setRay({ ...ray, dir: "right" })}>السهم يمينًا ➡</button>
          </div>
          <p className="text-center text-sm opacity-70">اسحبي النقطة لتحريكها، واسحبي على أحد جانبيها لتوجيه السهم.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {!done && <button className="btn-primary" disabled={!canCheck} onClick={check}>تحقّقي ✔</button>}
        {settings.hints && !done && <button className="btn-ghost" onClick={() => setHint((h) => !h)}>💡 تلميح</button>}
        {settings.solutions && tries > 0 && !sol && <button className="btn-ghost" onClick={() => setSol(true)}>📜 عرض الحل خطوة بخطوة</button>}
      </div>

      {state === "ok" && (
        <div className="feedback-ok pop">
          <div className="text-3xl">⭐⭐⭐</div>
          <div className="text-xl font-extrabold">{praise}</div>
          {tries === 1 ? <div className="text-sm">+٣ نجوم للإجابة من المحاولة الأولى</div> : <div className="text-sm">+نجمة لإصرارك الجميل</div>}
        </div>
      )}
      {state === "try" && (
        <div className="feedback-try pop">
          <div className="text-lg font-bold">🌱 محاولة جميلة، فكّري في الخطوة التالية</div>
          {settings.hints && <div className="text-sm opacity-80">يمكنك الاستعانة بالتلميح ثم المحاولة مرة أخرى.</div>}
        </div>
      )}
      {hint && settings.hints && !done && <div className="hint-box">💡 {q.hint}</div>}
      {sol && settings.solutions && (
        <div className="sol-box">
          <div className="font-bold mb-2">طريقة الحل الصحيحة:</div>
          <ol className="space-y-1"> 
<ol className="space-y-1">
  {q.steps.map((s, i) => (
    <li key={i} className="step-line">
      <b>{ar(i + 1)}.</b>
      <span
        dir="ltr"
        style={{
          direction: "ltr",
          unicodeBidi: "isolate",
          display: "inline-block",
          textAlign: "center",
          whiteSpace: "pre-wrap",
        }}
      >
        {s}
      </span>
    </li>
  ))}
</ol>

      
        </div>
      )}
    </div>
  );
}
