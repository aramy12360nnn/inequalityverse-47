"use client";
import { useState } from "react";
import { solve, ar, type Solution } from "@/lib/math";
import { useApp } from "@/lib/store";
import { NumberLineView } from "./NumberLine";

const EXAMPLES = ["2x + 3 > 11", "-3x + 4 <= 19", "4(x - 2) >= 2x + 6", "x/2 - 1 < 3", "-5 < 2x + 1 <= 9", "|x - 3| < 4", "|2x + 1| >= 5", "x + 1 < -2 or x - 1 > 3"];

export default function Lab() {
  const { play, setProgress } = useApp();
  const [input, setInput] = useState("-3x + 4 <= 19");
  const [res, setRes] = useState<Solution | null>(null);
  const [err, setErr] = useState("");
  const [shown, setShown] = useState(0);
  const [why, setWhy] = useState<number | null>(null);

  const run = (s = input) => {
    const r = solve(s);
    if (!r.ok) { setErr(r.error); setRes(null); play("try"); return; }
    setErr(""); setRes(r); setShown(1); setWhy(0); play("click");
    setProgress((p) => ({ ...p, labUses: p.labUses + 1 }));
  };
  const total = res ? res.steps.length + 3 : 0; // خطوات + المجموعة + خط الأعداد + التحقق
  const insert = (t: string) => setInput((v) => v + t);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-2 card p-5 space-y-4">
        <label className="font-bold block">اكتبي متباينة خطية (استخدمي x أو س):</label>
        <input dir="ltr" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          className="input text-2xl text-center font-mono" placeholder="2x + 3 > 11" />
        <div className="grid grid-cols-6 gap-2" dir="ltr">
          {["x", "<", ">", "≤", "≥", "|", "(", ")", "+", "-", "/", " or "].map((t) => (
            <button key={t} className="key-btn" onClick={() => insert(t)}>{t === " or " ? "أو" : t}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1 text-lg" onClick={() => run()}>✨ حلّي معي</button>
          <button className="btn-ghost" onClick={() => { setInput(""); setRes(null); setErr(""); }}>مسح</button>
        </div>
        {err && <div className="feedback-try">⚠️ {err}</div>}
        <div>
          <div className="text-sm opacity-75 mb-2">أمثلة جاهزة:</div>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {EXAMPLES.map((e) => <button key={e} className="chip hover:scale-105 transition" onClick={() => { setInput(e); run(e); }}>{e}</button>)}
          </div>
        </div>
        <p className="text-xs opacity-70 leading-relaxed">يدعم المختبر: المتباينات ذات الخطوة الواحدة والمتعددة الخطوات، الأقواس والكسور، المتباينات المركبة (و / أو / الصيغة الثلاثية)، والقيمة المطلقة بالصيغة |…| ﹤ عدد.</p>
      </div>

      <div className="lg:col-span-3 card p-5 space-y-4 min-h-[420px]">
        {!res && <div className="h-full grid place-items-center text-center opacity-80"><div><div className="text-6xl float">🧪</div><p className="mt-3 text-lg">اكتبي متباينة واضغطي «حلّي معي» لنبدأ الرحلة خطوة بخطوة</p></div></div>}
        {res && (
          <>
            <div className="text-sm opacity-70">١) المتباينة الأصلية</div>
            <div className="math-box text-3xl">{res.original}</div>
            <div className="text-sm opacity-70">٢) خطوات الحل</div>
            <ol className="space-y-2">
              {res.steps.slice(1).map((s, i) => i + 1 < shown && (
                <li key={i} className="step-card pop">
                  <div className="flex items-center gap-3">
                    <span className="choice-num">{ar(i + 1)}</span>
                    <span className="text-2xl font-extrabold flex-1">{s.expr}</span>
                    <button className="btn-sm" onClick={() => setWhy(why === i + 1 ? null : i + 1)}>لماذا؟</button>
                  </div>
                  {(why === i + 1) && <div className="hint-box mt-2">🤔 {s.reason}</div>}
                </li>
              ))}
            </ol>
            {shown >= res.steps.length && (
              <div className="pop space-y-2">
                <div className="text-sm opacity-70">٣) مجموعة الحل</div>
                <div className="math-box text-2xl gold">{res.builder}</div>
              </div>
            )}
            {shown >= res.steps.length + 1 && (
              <div className="pop">
                <div className="text-sm opacity-70 mb-1">٤) التمثيل على خط الأعداد</div>
                <NumberLineView set={res.set} />
              </div>
            )}
            {shown >= res.steps.length + 2 && (
              <div className="pop space-y-2">
                <div className="text-sm opacity-70">٥) التحقق باستخدام قيمة اختبارية</div>
                {res.test ? (
                  <div className="feedback-ok text-right">عوّضنا س = {ar(res.test.value)} (من مجموعة الحل) في المتباينة الأصلية: <b dir="rtl">{res.test.sub}</b> {res.test.ok ? "✔ صحيحة" : "✘"}</div>
                ) : <div className="hint-box">لا توجد قيمة تحقق المتباينة، فمجموعة الحل خالية.</div>}
                {res.counter && <div className="hint-box">وللمقارنة: س = {ar(res.counter.value)} (خارج الحل): <b>{res.counter.sub}</b> {res.counter.ok ? "✔" : "✘ غير صحيحة"} كما توقعنا.</div>}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {shown < total && <button className="btn-primary" onClick={() => { setShown(shown + 1); setWhy(shown <= res.steps.length - 1 ? shown : null); play("click"); }}>الخطوة التالية ⬅</button>}
              {shown > 1 && shown <= res.steps.length && <button className="btn-ghost" onClick={() => setWhy(shown - 1)}>لماذا فعلنا ذلك؟ 🤔</button>}
              {shown < total && <button className="btn-ghost" onClick={() => setShown(total)}>عرض الحل كاملًا</button>}
              {shown >= total && <button className="btn-ghost" onClick={() => { setShown(1); setWhy(null); }}>إعادة العرض ↺</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
