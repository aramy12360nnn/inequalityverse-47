"use client";
import { useApp } from "@/lib/store";
import { LESSONS } from "@/lib/questions";
import { ar } from "@/lib/math";

export default function Achievements() {
  const { questions, progress, setProgress } = useApp();
  const total = questions.length;
  const correct = questions.filter((q) => progress.answers[q.id]?.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const skills = LESSONS.map((l) => {
    const lq = questions.filter((q) => q.lesson === l.id);
    const c = lq.filter((q) => progress.answers[q.id]?.correct).length;
    const p = lq.length ? Math.round((c / lq.length) * 100) : 0;
    return { ...l, p, mastered: p >= 70 || progress.lessonsDone.includes(l.id) };
  });
  const date = new Date().toLocaleDateString("ar-SA");
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-5 text-center"><div className="ring" style={{ ["--p" as string]: `${pct}%` }}><span>{ar(pct)}٪</span></div><div className="mt-2 font-bold">نسبة الإنجاز</div></div>
        <div className="card p-5 text-center"><div className="text-5xl">⭐</div><div className="text-3xl font-extrabold gold">{ar(progress.stars)}</div><div>نجمة</div></div>
        <div className="card p-5 text-center"><div className="text-5xl">🎯</div><div className="text-3xl font-extrabold">{ar(correct)} / {ar(total)}</div><div>سؤالًا متقنًا</div></div>
        <div className="card p-5 text-center"><div className="text-5xl">🗺️</div><div className="text-3xl font-extrabold">{ar(Math.min(progress.stations, 6))} / ٦</div><div>محطات التحدي</div></div>
      </div>
      <div className="card p-5">
        <h3 className="font-extrabold text-xl mb-3">المهارات</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {skills.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-white/5">
              <div className="flex justify-between mb-1"><span>{s.icon} {s.title}</span><span>{s.mastered ? "🏅 متقنة" : `${ar(s.p)}٪`}</span></div>
              <div className="progress"><div style={{ width: `${s.mastered ? 100 : s.p}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-5 space-y-3 no-print">
        <label className="font-bold block">اكتبي اسمك ليظهر على الشهادة (يُحفظ على جهازك فقط):</label>
        <div className="flex gap-2 flex-wrap">
          <input className="input flex-1" value={progress.name} onChange={(e) => setProgress((p) => ({ ...p, name: e.target.value }))} placeholder="اسم الطالبة" />
          <button className="btn-primary" onClick={() => window.print()}>🖨️ طباعة الشهادة</button>
        </div>
      </div>
      <div id="certificate" className="certificate">
        <div className="cert-inner">
          <div className="text-sm">المملكة العربية السعودية — وزارة التعليم</div>
          <div className="text-sm">المتوسطة السابعة والأربعون (٤٧)</div>
          <div className="text-6xl my-3">🏆</div>
          <h2 className="cert-title">شهادة «بطلة المتباينات الخطية»</h2>
          <p className="text-lg">تتشرف المدرسة بمنح الطالبة</p>
          <div className="cert-name">{progress.name || "................................"}</div>
          <p className="text-lg">هذه الشهادة لإنجازها في الفصل الرابع «المتباينات الخطية» — رياضيات الصف الثالث المتوسط</p>
          <p className="text-xl font-bold mt-2">الدرجة: {ar(pct)}٪ — النجوم: {ar(progress.stars)} ⭐</p>
          <div className="flex justify-between mt-8 text-base">
            <div>المعلمة: نوف المطيري</div>
            <div>التاريخ: {date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
