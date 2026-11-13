"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { LESSONS } from "@/lib/questions";
import { ar } from "@/lib/math";
import QuestionCard from "./QuestionCard";

const PER = 3;
const COLORS = ["#a855f7", "#22d3ee", "#ec4899", "#facc15", "#34d399", "#f97316"];

export default function Challenge() {
  const { questions, progress, setProgress, play } = useApp();
  const [station, setStation] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [got, setGot] = useState(0);
  const [answered, setAnswered] = useState(false);
  const unlocked = progress.stations; // المحطة التالية المتاحة
  const pos = station ?? Math.min(unlocked, 5);
  const champion = unlocked >= 6;
  const stationQs = (s: number) => questions.filter((q) => q.lesson === s + 1).slice(-PER);

  const start = (s: number) => { if (s > unlocked) return; setStation(s); setIdx(0); setGot(0); setAnswered(false); play("click"); };
  const qs = station !== null ? stationQs(station) : [];
  const finished = station !== null && idx >= qs.length;
  const passed = got >= Math.ceil(qs.length * 2 / 3);
  const finish = () => {
    if (station === null) return;
    if (passed) {
      setProgress((p) => ({ ...p, stations: Math.max(p.stations, station + 1), challengeScore: p.challengeScore + got * 10 }));
      play("win");
    }
    setStation(null);
  };

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm mb-1">تقدم المغامرة: {ar(Math.min(unlocked, 6))} / ٦ محطات</div>
          <div className="progress"><div style={{ width: `${(Math.min(unlocked, 6) / 6) * 100}%` }} /></div>
        </div>
        <div className="chip text-base">⭐ النجوم: {ar(progress.stars)}</div>
        <div className="chip text-base">🏆 النقاط: {ar(progress.challengeScore)}</div>
        <button className="btn-ghost" onClick={() => { if (confirm("إعادة المغامرة من البداية؟")) { setProgress((p) => ({ ...p, stations: 0, challengeScore: 0 })); setStation(null); } }}>↺ إعادة المحاولة</button>
      </div>

      <div className="world">
        <div className="world-floor">
          {LESSONS.map((l, s) => {
            const open = s <= unlocked, done = s < unlocked;
            return (
              <button key={l.id} onClick={() => start(s)} disabled={!open} className={`station ${open ? "" : "locked"} ${done ? "done" : ""}`}
                style={{ left: `${8 + s * 16.5}%`, top: `${s % 2 ? 22 : 58}%`, ["--c" as string]: COLORS[s] }}>
                <div className="station-top">{done ? "✅" : open ? l.icon : "🔒"}</div>
                <div className="station-label">المحطة {ar(s + 1)}<br />{l.title.replace("حل المتباينات ", "").replace("تمثيل المتباينات الخطية ", "التمثيل ")}</div>
              </button>
            );
          })}
          <div className="hero-girl" style={{ left: `${8 + pos * 16.5 + 3}%`, top: `${pos % 2 ? 6 : 42}%` }}>🧕🏻</div>
          {champion && <div className="trophy">🏆</div>}
        </div>
      </div>

      {champion && station === null && (
        <div className="card p-6 text-center pop">
          <div className="text-6xl">🏆</div>
          <div className="text-3xl font-extrabold gold">كأس «بطلة المتباينات»</div>
          <p>أكملتِ المحطات الست! اطبعي شهادتك من قسم «إنجازاتي».</p>
        </div>
      )}
      {station === null && !champion && <p className="text-center opacity-80">اختاري المحطة المضيئة لتبدئي التحدي. أجيبي إجابة صحيحة عن سؤالين على الأقل من ثلاثة لتفتح المحطة التالية.</p>}

      {station !== null && !finished && qs[idx] && (
        <div className="space-y-2">
          <div className="font-bold">المحطة {ar(station + 1)}: {LESSONS[station].title} — السؤال {ar(idx + 1)} / {ar(qs.length)} — ⭐ {ar(got)}</div>
          <QuestionCard key={`${station}-${idx}`} q={qs[idx]} source={`تحدي المحطة ${station + 1}`} onDone={(ok, first) => { setAnswered(true); if (ok && first) setGot((g) => g + 1); }} />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => { setIdx(idx + 1); setAnswered(false); }}>{answered ? "التالي ⬅" : "تخطي ⬅"}</button>
            <button className="btn-ghost" onClick={() => setStation(null)}>العودة للخريطة</button>
          </div>
        </div>
      )}
      {finished && (
        <div className="card p-6 text-center space-y-3 pop">
          <div className="text-5xl">{passed ? "🌟" : "🌱"}</div>
          <div className="text-2xl font-bold">{passed ? "أحسنتِ! فُتحت المحطة التالية" : "محاولة جميلة! أعيدي المحطة لتفتحي التالية"}</div>
          <div>النجوم في هذه المحطة: {ar(got)} / {ar(qs.length)}</div>
          <div className="flex gap-2 justify-center">
            <button className="btn-primary" onClick={finish}>{passed ? "متابعة المغامرة" : "العودة للخريطة"}</button>
            {!passed && <button className="btn-ghost" onClick={() => start(station!)}>↺ إعادة المحطة</button>}
          </div>
        </div>
      )}
    </div>
  );
}
