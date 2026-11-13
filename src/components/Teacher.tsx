"use client";
import { useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { DEFAULT_QUESTIONS, LESSONS, LEVEL_NAMES, TYPE_NAMES, type Question, type QType } from "@/lib/questions";
import { ar } from "@/lib/math";

const EMPTY: Question = { id: "", level: 1, lesson: 1, type: "mcq", prompt: "", choices: ["", "", "", ""], answer: 0, hint: "", steps: [] };

export default function Teacher() {
  const { settings, setSettings, questions, setQuestions, progress, resetProgress } = useApp();
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState("");
  const [edit, setEdit] = useState<Question | null>(null);
  const [filter, setFilter] = useState(0);
  const [newCode, setNewCode] = useState("");
  const file = useRef<HTMLInputElement>(null);

  if (!authed) return (
    <div className="card p-6 max-w-md mx-auto space-y-4 text-center">
      <div className="text-5xl">🔐</div>
      <p>أدخلي رمز الدخول لمساحة المعلمة (الرمز الافتراضي: ٤٧٤٧ ويمكن تغييره من الداخل).</p>
      <input type="password" dir="ltr" className="input text-center text-2xl" value={code} onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (code === settings.passcode ? setAuthed(true) : setMsg("الرمز غير صحيح"))} />
      <button className="btn-primary w-full" onClick={() => (code === settings.passcode ? (setAuthed(true), setMsg("")) : setMsg("الرمز غير صحيح"))}>دخول</button>
      {msg && <div className="text-pink-300">{msg}</div>}
    </div>
  );

  const save = () => {
    if (!edit) return;
    if (!edit.prompt.trim()) return setMsg("اكتبي نص السؤال");
    const isChoice = ["mcq", "error", "word", "drag"].includes(edit.type);
    if (isChoice && (edit.choices ?? []).some((c) => !c.trim())) return setMsg("أكملي جميع الخيارات");
    const q: Question = { ...edit, steps: edit.steps.filter((s) => s.trim()) };
    if (!q.id) { q.id = "t" + Date.now(); setQuestions([...questions, q]); }
    else setQuestions(questions.map((x) => (x.id === q.id ? q : x)));
    setEdit(null); setMsg("✔ تم حفظ السؤال");
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "بنك-أسئلة-المتباينات.json"; a.click();
  };
  const importJson = (f: File) => {
    f.text().then((t) => {
      try {
        const data = JSON.parse(t);
        if (!Array.isArray(data) || !data.every((q) => q && typeof q.prompt === "string" && q.id && q.type)) throw new Error();
        setQuestions(data); setMsg(`✔ تم استيراد ${ar(data.length)} سؤالًا`);
      } catch { setMsg("⚠️ الملف غير صالح"); }
    });
  };
  const shown = questions.filter((q) => !filter || q.lesson === filter);
  const log = progress.log;
  const right = log.filter((l) => l.correct).length;

  return (
    <div className="space-y-5">
      {msg && <div className="hint-box flex justify-between"><span>{msg}</span><button onClick={() => setMsg("")}>✕</button></div>}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-5 space-y-3">
          <h3 className="font-extrabold text-xl">⚙️ إعدادات العرض</h3>
          {([["hints", "تشغيل التلميحات"], ["solutions", "إظهار الحلول خطوة بخطوة"], ["projector", "وضع البروجكتور (خط كبير وتباين عالٍ)"], ["sound", "المؤثرات الصوتية"]] as const).map(([k, t]) => (
            <label key={k} className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer">
              <span>{t}</span>
              <input type="checkbox" className="w-6 h-6 accent-fuchsia-500" checked={settings[k]} onChange={(e) => setSettings({ [k]: e.target.checked })} />
            </label>
          ))}
          <div className="flex gap-2">
            <input dir="ltr" className="input" placeholder="رمز دخول جديد" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            <button className="btn-ghost whitespace-nowrap" onClick={() => { if (newCode.trim().length < 4) return setMsg("الرمز ٤ خانات على الأقل"); setSettings({ passcode: newCode.trim() }); setNewCode(""); setMsg("✔ تم تغيير الرمز"); }}>تغيير الرمز</button>
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <h3 className="font-extrabold text-xl">📊 نتائج الجلسة على هذا الجهاز</h3>
          <p className="text-sm opacity-75">تُحفظ البيانات محليًا في متصفح هذا الجهاز فقط، ولا توجد متابعة مركزية لحسابات الطالبات.</p>
          {log.length === 0 ? <p>لا توجد محاولات مسجلة بعد.</p> : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="chip">المحاولات: {ar(log.length)}</div>
                <div className="chip">الصحيحة: {ar(right)}</div>
                <div className="chip">الدقة: {ar(Math.round((right / log.length) * 100))}٪</div>
              </div>
              <div className="space-y-1">
                {LESSONS.map((l) => {
                  const ll = log.filter((x) => questions.find((q) => q.id === x.qid)?.lesson === l.id);
                  const c = ll.filter((x) => x.correct).length;
                  return <div key={l.id} className="flex justify-between text-sm"><span>{l.code} {l.title}</span><span>{ar(c)} / {ar(ll.length)}</span></div>;
                })}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <button className="btn-ghost" onClick={() => { if (confirm("إعادة ضبط تقدم الطالبة على هذا الجهاز؟")) { resetProgress(); setMsg("✔ تمت إعادة ضبط التقدم"); } }}>↺ إعادة ضبط التقدم</button>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <h3 className="font-extrabold text-xl">📚 بنك الأسئلة ({ar(questions.length)})</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => setEdit({ ...EMPTY, choices: ["", "", "", ""] })}>+ سؤال جديد</button>
            <button className="btn-ghost" onClick={exportJson}>⬇ تصدير JSON</button>
            <button className="btn-ghost" onClick={() => file.current?.click()}>⬆ استيراد JSON</button>
            <button className="btn-ghost" onClick={() => { if (confirm("استعادة البنك الأصلي (٦٠ سؤالًا)؟")) { setQuestions(DEFAULT_QUESTIONS); setMsg("✔ تمت الاستعادة"); } }}>استعادة الأصلي</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          </div>
        </div>
        <select className="input !w-auto" value={filter} onChange={(e) => setFilter(+e.target.value)}>
          <option value={0}>كل الدروس</option>
          {LESSONS.map((l) => <option key={l.id} value={l.id}>{l.code} {l.title}</option>)}
        </select>

        {edit && (
          <div className="p-4 rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/10 space-y-3">
            <div className="font-bold">{edit.id ? "تعديل سؤال" : "سؤال جديد"}</div>
            <div className="grid md:grid-cols-3 gap-2">
              <select className="input" value={edit.lesson} onChange={(e) => setEdit({ ...edit, lesson: +e.target.value })}>
                {LESSONS.map((l) => <option key={l.id} value={l.id}>{l.code} {l.title}</option>)}
              </select>
              <select className="input" value={edit.level} onChange={(e) => setEdit({ ...edit, level: +e.target.value as 1 | 2 | 3 })}>
                {([1, 2, 3] as const).map((l) => <option key={l} value={l}>{LEVEL_NAMES[l]}</option>)}
              </select>
              <select className="input" value={edit.type} disabled={!!edit.id && !["mcq", "error", "word"].includes(edit.type)}
                onChange={(e) => setEdit({ ...edit, type: e.target.value as QType })}>
                {(["mcq", "error", "word"] as QType[]).map((t) => <option key={t} value={t}>{TYPE_NAMES[t]}</option>)}
                {!["mcq", "error", "word"].includes(edit.type) && <option value={edit.type}>{TYPE_NAMES[edit.type]}</option>}
              </select>
            </div>
            <textarea className="input min-h-[80px]" placeholder="نص السؤال" value={edit.prompt} onChange={(e) => setEdit({ ...edit, prompt: e.target.value })} />
            <input className="input" placeholder="متباينة تظهر في السؤال (اختياري) مثل: ٢س + ٣ > ٧" value={edit.expr ?? ""} onChange={(e) => setEdit({ ...edit, expr: e.target.value })} />
            {["mcq", "error", "word"].includes(edit.type) && (
              <div className="space-y-2">
                <div className="text-sm">الخيارات (حددي الإجابة الصحيحة):</div>
                {(edit.choices ?? []).map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="radio" name="ans" className="w-5 h-5" checked={edit.answer === i} onChange={() => setEdit({ ...edit, answer: i })} />
                    <input className="input" value={c} placeholder={`الخيار ${ar(i + 1)}`} onChange={(e) => setEdit({ ...edit, choices: edit.choices!.map((x, k) => (k === i ? e.target.value : x)) })} />
                  </div>
                ))}
              </div>
            )}
            <input className="input" placeholder="التلميح" value={edit.hint} onChange={(e) => setEdit({ ...edit, hint: e.target.value })} />
            <textarea className="input min-h-[80px]" placeholder="خطوات الحل (كل خطوة في سطر)" value={edit.steps.join("\n")} onChange={(e) => setEdit({ ...edit, steps: e.target.value.split("\n") })} />
            <div className="flex gap-2"><button className="btn-primary" onClick={save}>حفظ</button><button className="btn-ghost" onClick={() => setEdit(null)}>إلغاء</button></div>
          </div>
        )}

        <div className="max-h-[520px] overflow-auto space-y-2">
          {shown.map((q) => (
            <div key={q.id} className="flex gap-3 items-start p-3 rounded-xl bg-white/5">
              <div className="flex-1">
                <div className="text-xs opacity-70">{LESSONS.find((l) => l.id === q.lesson)?.code} · {LEVEL_NAMES[q.level]} · {TYPE_NAMES[q.type]}</div>
                <div className="line-clamp-2">{q.prompt} {q.expr && <b>{q.expr}</b>}</div>
              </div>
              <button className="btn-sm" onClick={() => setEdit({ ...q, choices: q.choices ? [...q.choices] : undefined, steps: [...q.steps] })}>تعديل</button>
              <button className="btn-sm !border-pink-400/60" onClick={() => { if (confirm("حذف السؤال؟")) setQuestions(questions.filter((x) => x.id !== q.id)); }}>حذف</button>
            </div>
          ))}
        </div>
      </div>
      <button className="btn-ghost" onClick={() => setAuthed(false)}>🔒 تسجيل الخروج</button>
    </div>
  );
}
