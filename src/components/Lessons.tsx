"use client";
import { useMemo, useState } from "react";
import { LESSONS } from "@/lib/questions";
import { solve, ar, inSet } from "@/lib/math";
import { useApp } from "@/lib/store";
import { NumberLineView } from "./NumberLine";
import QuestionCard from "./QuestionCard";
import { CoordPlane } from "./Graphing";

const CONTENT: Record<number, { idea: string; rules: string[]; example: string; mistake: { wrong: string; right: string; why: string } }> = {
  1: {
    idea: "إذا أضفنا العدد نفسه إلى طرفي متباينة صحيحة أو طرحناه منهما، تبقى المتباينة صحيحة ولا يتغير اتجاه الإشارة.",
    rules: ["إذا كان أ > ب فإن أ + ج > ب + ج", "إذا كان أ > ب فإن أ − ج > ب − ج", "تنطبق الخاصية على الإشارات < ، ≤ ، ≥ أيضًا"],
    example: "x - 8 >= -3",
    mistake: { wrong: "س + ٤ < ٩ ⟸ س < ١٣", right: "س + ٤ < ٩ ⟸ س < ٥", why: "للتخلص من +٤ نطرح ٤ من الطرفين، ولا نضيفها." },
  },
  2: {
    idea: "عند ضرب طرفي متباينة أو قسمتهما على عدد موجب يبقى اتجاه الإشارة كما هو، أما عند الضرب أو القسمة على عدد سالب فيجب عكس اتجاه الإشارة.",
    rules: ["ج > ٠: إذا كان أ < ب فإن أج < ب ج", "ج < ٠: إذا كان أ < ب فإن أج > ب ج ⚠️", "مثال: ٢ < ٥ لكن −٢ > −٥"],
    example: "-6x < 24",
    mistake: { wrong: "−٦س < ٢٤ ⟸ س < −٤", right: "−٦س < ٢٤ ⟸ س > −٤", why: "القسمة على −٦ (عدد سالب) تعكس الإشارة." },
  },
  3: {
    idea: "نحل المتباينة المتعددة الخطوات كما نحل المعادلة: نوزّع، ونجمع الحدود المتشابهة، ثم نعزل المتغير بالعمليات العكسية، مع مراعاة عكس الإشارة عند الضرب أو القسمة على سالب.",
    rules: ["١) التوزيع وتبسيط كل طرف", "٢) جمع حدود المتغير في طرف واحد", "٣) عزل حد المتغير", "٤) القسمة على المعامل (وعكس الإشارة إن كان سالبًا)"],
    example: "3(x - 2) > 5x + 4",
    mistake: { wrong: "٣(س − ٢) ⟸ ٣س − ٢", right: "٣(س − ٢) ⟸ ٣س − ٦", why: "نضرب العدد في كل حد داخل القوس." },
  },
  4: {
    idea: "المتباينة المركبة متباينتان مرتبطتان بـ «و» أو «أو». «و» تعني التقاطع (الأعداد المشتركة)، و«أو» تعني الاتحاد (أي عدد يحقق إحداهما).",
    rules: ["أ < س و س < ب تُكتب أ < س < ب", "في «و» نجري العملية على الأجزاء الثلاثة", "في «أو» نحل كل متباينة ثم نمثل الحلين معًا"],
    example: "-4 <= 3x + 2 < 11",
    mistake: { wrong: "−٤ ≤ ٣س + ٢ < ١١ ⟸ −٦ ≤ ٣س < ١١", right: "−٦ ≤ ٣س < ٩", why: "يجب طرح ٢ من الأجزاء الثلاثة جميعها." },
  },
  5: {
    idea: "|س| تمثل بُعد س عن الصفر. إذا كان |س| < ن فإن −ن < س < ن (و). وإذا كان |س| > ن فإن س < −ن أو س > ن (أو).",
    rules: ["|أ| < ب ⟸ −ب < أ < ب", "|أ| > ب ⟸ أ < −ب أو أ > ب", "إذا كان ب سالبًا: |أ| < ب لا حل لها، و|أ| > ب كل الأعداد حل"],
    example: "|x + 2| <= 3",
    mistake: { wrong: "|س| > ٣ ⟸ −٣ < س < ٣", right: "|س| > ٣ ⟸ س < −٣ أو س > ٣", why: "«أكبر من» تعني الابتعاد عن الصفر أكثر من ٣ في الاتجاهين." },
  },
  6: {
    idea: "منطقة الحل لمتباينة خطية في متغيرين نصف مستوى يحدّه خط الحدود. نرسم الخط متصلًا مع ≤ أو ≥، ومتقطعًا مع < أو >، ثم نختبر نقطة لتحديد المنطقة المظللة.",
    rules: ["١) نرسم خط الحدود ص = م س + ب", "٢) متصل (≤ ، ≥) أو متقطع (< ، >)", "٣) نختبر نقطة مثل (٠، ٠) ونظلل المنطقة التي تحقق المتباينة"],
    example: "",
    mistake: { wrong: "ص < ٢س + ١ ⟸ خط متصل", right: "ص < ٢س + ١ ⟸ خط متقطع", why: "النقاط على الخط لا تحقق «أصغر من» فلا تنتمي للحل." },
  },
};

function TryValue({ expr }: { expr: string }) {
  const [x, setX] = useState(0);
  const r = useMemo(() => solve(expr), [expr]);
  if (!r.ok) return null;
  const ok = inSet(r.set, x);
  return (
    <div className="space-y-2">
      <div className="text-sm opacity-80">حرّكي المؤشر لاختبار قيم س في المتباينة <b>{r.original}</b>:</div>
      <input type="range" min={-10} max={10} value={x} onChange={(e) => setX(+e.target.value)} className="w-full" />
      <div className={ok ? "feedback-ok" : "hint-box"}>س = {ar(x)} ⟸ {ok ? "تحقق المتباينة ✔ (ضمن مجموعة الحل)" : "لا تحقق المتباينة ✘"}</div>
      <NumberLineView set={[{ lo: x, hi: x, loC: true, hiC: true }]} color={ok ? "#4ade80" : "#f87171"} range={[-10, 10]} />
      <NumberLineView set={r.set} range={[-10, 10]} />
    </div>
  );
}

export default function Lessons() {
  const { questions, progress, setProgress, play } = useApp();
  const [active, setActive] = useState(1);
  const [quizKey, setQuizKey] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [score, setScore] = useState(0);
  const L = LESSONS.find((l) => l.id === active)!;
  const C = CONTENT[active];
  const ex = C.example ? solve(C.example) : null;
  const lq = questions.filter((q) => q.lesson === active);
  const practice = lq[0];
  const quiz = lq.slice(1, 4);
  const choose = (id: number) => { setActive(id); setQuizIdx(0); setScore(0); setQuizKey((k) => k + 1); };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {LESSONS.map((l) => (
          <button key={l.id} onClick={() => choose(l.id)} className={`lesson-tab ${active === l.id ? "lesson-tab-on" : ""}`}>
            <div className="text-3xl">{l.icon}</div>
            <div className="text-xs opacity-80">الدرس {l.code}</div>
            <div className="font-bold text-sm leading-snug">{l.title}</div>
            {progress.lessonsDone.includes(l.id) && <div className="text-xs mt-1">✅ مكتمل</div>}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-2xl font-extrabold gold">{L.code} {L.title}</h3>
          <p className="text-lg leading-loose">{C.idea}</p>
          <ul className="space-y-2">{C.rules.map((r) => <li key={r} className="rule">{r}</li>)}</ul>
          <div className="pt-2 border-t border-white/10">
            <div className="font-bold mb-2">🔬 شرح تفاعلي</div>
            {active === 6 ? <CoordPlane initial={{ m: 2, b: 1, op: "<" }} /> : <TryValue expr={ex && ex.ok ? C.example : "x > 0"} />}
          </div>
        </div>
        <div className="space-y-5">
          <div className="card p-5 space-y-3">
            <div className="font-bold text-lg">📘 مثال محلول</div>
            {ex && ex.ok ? (
              <>
                <div className="math-box text-2xl">{ex.original}</div>
                <ol className="space-y-2">{ex.steps.slice(1).map((s, i) => <li key={i} className="step-card"><b className="text-xl">{s.expr}</b><div className="text-sm opacity-80">{s.reason}</div></li>)}</ol>
                <div className="math-box gold">{ex.builder}</div>
                <NumberLineView set={ex.set} />
              </>
            ) : (
              <div className="space-y-2">
                <div className="math-box text-2xl">ص ≥ −س + ٢</div>
                <ol className="space-y-2">
                  <li className="step-card">نرسم خط الحدود ص = −س + ٢ (المقطع ٢، الميل −١).</li>
                  <li className="step-card">الإشارة ≥ ⟸ الخط متصل.</li>
                  <li className="step-card">نختبر (٠، ٠): ٠ ≥ ٢ خاطئة ⟸ نظلل الجهة التي لا تحتوي الأصل (أعلى الخط).</li>
                </ol>
              </div>
            )}
          </div>
          <div className="card p-5 space-y-2 border-pink-400/40">
            <div className="font-bold text-lg">⚠️ خطأ شائع</div>
            <div className="line-through decoration-pink-400 opacity-80">{C.mistake.wrong}</div>
            <div className="text-emerald-300 font-bold">✔ {C.mistake.right}</div>
            <div className="text-sm">{C.mistake.why}</div>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <div className="font-bold text-lg mb-2">✍️ تدريب قصير</div>
          {practice ? <QuestionCard key={`p-${active}-${practice.id}`} q={practice} source={`درس ${active}`} /> : <div className="card p-5">لا توجد أسئلة لهذا الدرس.</div>}
        </div>
        <div>
          <div className="font-bold text-lg mb-2">⚡ تقييم فوري ({ar(Math.min(quizIdx + 1, quiz.length))} / {ar(quiz.length)}) — الدرجة: {ar(score)}</div>
          {quizIdx < quiz.length ? (
            <div key={`${quizKey}-${quizIdx}`} className="space-y-2">
              <QuestionCard q={quiz[quizIdx]} source={`تقييم درس ${active}`} onDone={(ok, first) => { if (ok && first) setScore((s) => s + 1); }} />
              <button className="btn-ghost" onClick={() => setQuizIdx(quizIdx + 1)}>السؤال التالي ⬅</button>
            </div>
          ) : (
            <div className="card p-6 text-center space-y-3">
              <div className="text-5xl">{score >= Math.ceil(quiz.length * 0.6) ? "🏅" : "🌱"}</div>
              <div className="text-xl font-bold">درجتك {ar(score)} من {ar(quiz.length)}</div>
              {score >= Math.ceil(quiz.length * 0.6) ? (
                <button className="btn-primary" onClick={() => { setProgress((p) => ({ ...p, lessonsDone: p.lessonsDone.includes(active) ? p.lessonsDone : [...p.lessonsDone, active] })); play("win"); }}>
                  {progress.lessonsDone.includes(active) ? "✅ الدرس مسجّل كمكتمل" : "سجّلي إتقان الدرس ✅"}
                </button>
              ) : <p>محاولة جميلة! راجعي المثال المحلول ثم أعيدي التقييم.</p>}
              <button className="btn-ghost" onClick={() => { setQuizIdx(0); setScore(0); setQuizKey((k) => k + 1); }}>إعادة التقييم ↺</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
