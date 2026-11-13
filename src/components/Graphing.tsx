"use client";
import { useState } from "react";
import { ar, fmtNum, intersect, sameSet, setText, solve, union, type Set } from "@/lib/math";
import type { Ray } from "@/lib/questions";
import { useApp } from "@/lib/store";
import { RayEditor, rayToSet } from "./NumberLine";

type Op = "<" | ">" | "≤" | "≥";
export function CoordPlane({ initial = { m: 1, b: 1, op: ">" as Op }, controls = true }: { initial?: { m: number; b: number; op: Op }; controls?: boolean }) {
  const [m, setM] = useState(initial.m);
  const [b, setB] = useState(initial.b);
  const [op, setOp] = useState<Op>(initial.op);
  const [pt, setPt] = useState<[number, number] | null>(null);
  const S = 380, R = 6, u = S / (2 * R);
  const X = (x: number) => S / 2 + x * u, Y = (y: number) => S / 2 - y * u;
  const f = (x: number) => m * x + b;
  const above = op === ">" || op === "≥";
  const dashed = op === "<" || op === ">";
  const poly = above ? `${X(-R)},${Y(f(-R))} ${X(R)},${Y(f(R))} ${X(R)},${Y(100)} ${X(-R)},${Y(100)}` : `${X(-R)},${Y(f(-R))} ${X(R)},${Y(f(R))} ${X(R)},${Y(-100)} ${X(-R)},${Y(-100)}`;
  const lineTxt = `ص ${op} ${m === 0 ? "" : m === 1 ? "س" : m === -1 ? "−س" : ar(m) + "س"}${m === 0 ? fmtNum(b) : b === 0 ? "" : b > 0 ? " + " + ar(b) : " − " + ar(-b)}`;
  const test = (x: number, y: number) => {
    const v = f(x);
    return op === ">" ? y > v : op === "<" ? y < v : op === "≥" ? y >= v : y <= v;
  };
  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width * S - S / 2) / u);
    const y = Math.round((S / 2 - (e.clientY - r.top) / r.height * S) / u);
    setPt([x, y]);
  };
  return (
    <div className="grid md:grid-cols-2 gap-4 items-start">
      <div dir="ltr">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[420px] mx-auto rounded-2xl bg-[var(--card)] border border-white/10 cursor-crosshair" onClick={click}>
          <defs><clipPath id="clipP"><rect x={0} y={0} width={S} height={S} /></clipPath></defs>
          {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map((k) => (
            <g key={k}>
              <line x1={X(k)} x2={X(k)} y1={0} y2={S} stroke="var(--grid)" />
              <line y1={Y(k)} y2={Y(k)} x1={0} x2={S} stroke="var(--grid)" />
              {k !== 0 && <text x={X(k)} y={Y(0) + 14} fontSize={10} textAnchor="middle" fill="var(--axis)">{ar(k)}</text>}
              {k !== 0 && <text x={X(0) - 6} y={Y(k) + 4} fontSize={10} textAnchor="end" fill="var(--axis)">{ar(k)}</text>}
            </g>
          ))}
          <line x1={0} x2={S} y1={Y(0)} y2={Y(0)} stroke="var(--axis)" strokeWidth={2} />
          <line y1={0} y2={S} x1={X(0)} x2={X(0)} stroke="var(--axis)" strokeWidth={2} />
          <text x={S - 12} y={Y(0) - 6} fill="var(--axis)" fontSize={13}>س</text>
          <text x={X(0) + 6} y={14} fill="var(--axis)" fontSize={13}>ص</text>
          <g clipPath="url(#clipP)">
            <polygon points={poly} fill="#e879f9" opacity={0.25} />
            <line x1={X(-R)} y1={Y(f(-R))} x2={X(R)} y2={Y(f(R))} stroke="#22d3ee" strokeWidth={3.5} strokeDasharray={dashed ? "10 8" : undefined} />
          </g>
          {pt && <circle cx={X(pt[0])} cy={Y(pt[1])} r={7} fill={test(pt[0], pt[1]) ? "#4ade80" : "#f87171"} stroke="white" strokeWidth={2} />}
        </svg>
      </div>
      <div className="space-y-3">
        <div className="math-box text-2xl">{lineTxt}</div>
        {controls && (
          <>
            <label className="block">الميل م = {ar(m)}<input type="range" min={-4} max={4} value={m} onChange={(e) => setM(+e.target.value)} className="w-full" /></label>
            <label className="block">المقطع الصادي ب = {ar(b)}<input type="range" min={-5} max={5} value={b} onChange={(e) => setB(+e.target.value)} className="w-full" /></label>
            <div className="flex gap-2">{(["<", ">", "≤", "≥"] as Op[]).map((o) => <button key={o} className={`btn-sm text-xl ${op === o ? "btn-on" : ""}`} onClick={() => setOp(o)}>{o}</button>)}</div>
          </>
        )}
        <ul className="text-sm space-y-1 opacity-90">
          <li>• خط الحدود: <b>{dashed ? "متقطع" : "متصل"}</b> لأن الإشارة {dashed ? "لا تتضمن المساواة" : "تتضمن المساواة"}.</li>
          <li>• نظلّل المنطقة <b>{above ? "أعلى" : "أسفل"}</b> الخط.</li>
          <li>• انقري أي نقطة على المستوى لاختبارها.</li>
        </ul>
        {pt && <div className={test(pt[0], pt[1]) ? "feedback-ok" : "hint-box"}>النقطة ({ar(pt[0])}، {ar(pt[1])}): {ar(pt[1])} {op} {fmtNum(f(pt[0]))} ⟸ {test(pt[0], pt[1]) ? "صحيحة ✔ النقطة حل" : "خاطئة ✘ ليست حلًا"}</div>}
      </div>
    </div>
  );
}

const CHALLENGES = ["x + 3 > 1", "-2x >= 6", "-3 < x <= 4", "x < -2 or x >= 3", "|x| <= 5", "|x - 1| > 3", "2x - 1 <= 7 and x > -4"];

export default function Graphing() {
  const { play } = useApp();
  const [mode, setMode] = useState<"single" | "union" | "intersection">("single");
  const [rays, setRays] = useState<Ray[]>([{ point: -2, closed: false, dir: "right" }, { point: 4, closed: true, dir: "left" }]);
  const [ch, setCh] = useState(0);
  const [cmp, setCmp] = useState<null | boolean>(null);
  const used = mode === "single" ? rays.slice(0, 1) : rays;
  const result: Set = mode === "single" ? rayToSet(rays[0]) : mode === "union" ? union(rayToSet(rays[0]), rayToSet(rays[1])) : intersect(rayToSet(rays[0]), rayToSet(rays[1]));
  const target = solve(CHALLENGES[ch]);
  const tset = target.ok ? target.set : [];
  const set = (i: number, r: Ray) => { setRays((o) => o.map((x, k) => (k === i ? r : x))); setCmp(null); };
  const colors = ["#e879f9", "#22d3ee"];
  return (
    <div className="space-y-6">
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-extrabold">🎯 خط الأعداد الذكي</h3>
          <div className="flex gap-2">
            {([["single", "متباينة واحدة"], ["union", "اتحاد (أو)"], ["intersection", "تقاطع (و)"]] as const).map(([k, t]) => (
              <button key={k} className={`btn-sm ${mode === k ? "btn-on" : ""}`} onClick={() => { setMode(k); setCmp(null); }}>{t}</button>
            ))}
          </div>
        </div>
        <div className="hint-box flex flex-wrap items-center gap-3">
          <span>التحدي: مثّلي مجموعة حل</span>
          <span className="math-box !py-1 !px-3 text-xl">{target.ok ? target.original : ""}</span>
          <button className="btn-sm" onClick={() => { setCh((ch + 1) % CHALLENGES.length); setCmp(null); }}>تحدٍ آخر ↻</button>
        </div>
        <RayEditor rays={used} onChange={set} colors={colors} result={mode === "single" ? undefined : result} compare={cmp === null ? null : tset} />
        <div className="grid md:grid-cols-2 gap-3">
          {used.map((r, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-white/5">
              <span className="font-bold" style={{ color: colors[i] }}>المجموعة {i === 0 ? "الأولى" : "الثانية"}:</span>
              <button className="btn-sm" onClick={() => set(i, { ...r, point: Math.max(-10, r.point - 1) })}>−</button>
              <span className="font-bold w-8 text-center">{ar(r.point)}</span>
              <button className="btn-sm" onClick={() => set(i, { ...r, point: Math.min(10, r.point + 1) })}>+</button>
              <button className={`btn-sm ${!r.closed ? "btn-on" : ""}`} onClick={() => set(i, { ...r, closed: false })}>○ مفتوحة</button>
              <button className={`btn-sm ${r.closed ? "btn-on" : ""}`} onClick={() => set(i, { ...r, closed: true })}>● مغلقة</button>
              <button className="btn-sm" onClick={() => set(i, { ...r, dir: r.dir === "left" ? "right" : "left" })}>{r.dir === "left" ? "⬅ يسار" : "يمين ➡"}</button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="math-box !text-xl flex-1">تمثيلك: {setText(result)}</div>
          <button className="btn-primary" onClick={() => { const ok = sameSet(result, tset); setCmp(ok); play(ok ? "ok" : "try"); }}>قارني بالتمثيل الصحيح</button>
        </div>
        {cmp !== null && (cmp ? <div className="feedback-ok pop">⭐ تمثيل مطابق تمامًا! الخط الأخضر هو التمثيل الصحيح.</div>
          : <div className="feedback-try pop">🌱 محاولة جميلة! قارني تمثيلك بالخط الأخضر (الصحيح: {target.ok ? target.text : ""}). جرّبي وضع {target.ok && target.set.length > 1 ? "الاتحاد" : "التقاطع أو المتباينة الواحدة"} المناسب.</div>)}
      </div>
      <div className="card p-5 space-y-3">
        <h3 className="text-2xl font-extrabold">📈 تمثيل المتباينات الخطية بيانيًا في المستوى الإحداثي</h3>
        <CoordPlane />
      </div>
    </div>
  );
}
