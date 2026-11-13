"use client";
import { useRef, useState } from "react";
import { ar, type Set } from "@/lib/math";
import type { Ray } from "@/lib/questions";

const W = 640, PAD = 34;
export const rayToSet = (r: Ray): Set =>
  r.dir === "left" ? [{ lo: -Infinity, hi: r.point, loC: false, hiC: r.closed }] : [{ lo: r.point, hi: Infinity, loC: r.closed, hiC: false }];

function autoRange(set: Set): [number, number] {
  const pts = set.flatMap((i) => [i.lo, i.hi]).filter((x) => isFinite(x));
  if (!pts.length) return [-10, 10];
  let lo = Math.floor(Math.min(...pts)) - 3, hi = Math.ceil(Math.max(...pts)) + 3;
  if (hi - lo < 12) { const c = Math.round((lo + hi) / 2); lo = c - 6; hi = c + 6; }
  return [lo, hi];
}

function Axis({ lo, hi, y }: { lo: number; hi: number; y: number }) {
  const X = (v: number) => PAD + ((v - lo) / (hi - lo)) * (W - 2 * PAD);
  const step = Math.max(1, Math.ceil((hi - lo) / 24));
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  return (
    <g>
      <line x1={8} x2={W - 8} y1={y} y2={y} stroke="var(--axis)" strokeWidth={2.5} />
      <polygon points={`${W - 4},${y} ${W - 16},${y - 7} ${W - 16},${y + 7}`} fill="var(--axis)" />
      <polygon points={`4,${y} 16,${y - 7} 16,${y + 7}`} fill="var(--axis)" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={y - 7} y2={y + 7} stroke="var(--axis)" strokeWidth={v === 0 ? 3 : 1.5} />
          <text x={X(v)} y={y + 26} textAnchor="middle" fontSize={15} fill="var(--axis)" fontWeight={v === 0 ? 800 : 500}>{ar(v)}</text>
        </g>
      ))}
    </g>
  );
}

function SetPath({ set, lo, hi, y, color }: { set: Set; lo: number; hi: number; y: number; color: string }) {
  const X = (v: number) => (v === -Infinity ? 10 : v === Infinity ? W - 10 : PAD + ((v - lo) / (hi - lo)) * (W - 2 * PAD));
  return (
    <g>
      {set.map((iv, k) => (
        <g key={k}>
          <line x1={X(iv.lo)} x2={X(iv.hi)} y1={y} y2={y} stroke={color} strokeWidth={7} strokeLinecap="round" />
          {iv.lo === -Infinity && <polygon points={`2,${y} 18,${y - 10} 18,${y + 10}`} fill={color} />}
          {iv.hi === Infinity && <polygon points={`${W - 2},${y} ${W - 18},${y - 10} ${W - 18},${y + 10}`} fill={color} />}
          {isFinite(iv.lo) && <circle cx={X(iv.lo)} cy={y} r={9} fill={iv.loC ? color : "var(--card)"} stroke={color} strokeWidth={3.5} />}
          {isFinite(iv.hi) && iv.hi !== iv.lo && <circle cx={X(iv.hi)} cy={y} r={9} fill={iv.hiC ? color : "var(--card)"} stroke={color} strokeWidth={3.5} />}
        </g>
      ))}
    </g>
  );
}

export function NumberLineView({ set, color = "#22d3ee", range }: { set: Set; color?: string; range?: [number, number] }) {
  const [lo, hi] = range ?? autoRange(set);
  return (
    <div dir="ltr" className="w-full">
      <svg viewBox={`0 0 ${W} 80`} className="w-full h-auto select-none">
        <Axis lo={lo} hi={hi} y={34} />
        <SetPath set={set} lo={lo} hi={hi} y={34} color={color} />
      </svg>
    </div>
  );
}

/** محرر تفاعلي بالسحب واللمس لشعاع أو شعاعين، مع إمكانية عرض مجموعة ناتجة */
export function RayEditor({ rays, onChange, colors = ["#e879f9", "#22d3ee"], result, compare, range = [-10, 10] }: {
  rays: Ray[]; onChange: (i: number, r: Ray) => void; colors?: string[]; result?: Set; compare?: Set | null; range?: [number, number];
}) {
  const [lo, hi] = range;
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<{ i: number; mode: "point" | "arrow" } | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const rowY = (i: number) => 34 + i * 54;
  const extra = (result ? 1 : 0) + (compare ? 1 : 0);
  const H = 34 + (rays.length + extra) * 54 + 6;
  const X = (v: number) => PAD + ((v - lo) / (hi - lo)) * (W - 2 * PAD);
  const toVal = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * W;
    return Math.max(lo, Math.min(hi, Math.round(lo + ((px - PAD) / (W - 2 * PAD)) * (hi - lo))));
  };
  const down = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const py = ((e.clientY - r.top) / r.height) * H;
    const px = ((e.clientX - r.left) / r.width) * W;
    let i = Math.round((py - 34) / 54);
    i = Math.max(0, Math.min(rays.length - 1, i));
    const ray = rays[i];
    const near = Math.abs(px - X(ray.point)) < 26;
    drag.current = { i, mode: near ? "point" : "arrow" };
    setActive(i);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    move(e);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const ray = rays[d.i];
    const v = toVal(e.clientX);
    if (d.mode === "point") { if (v !== ray.point) onChange(d.i, { ...ray, point: v }); }
    else {
      const dir = v < ray.point ? "left" : v > ray.point ? "right" : ray.dir;
      if (dir !== ray.dir) onChange(d.i, { ...ray, dir });
    }
  };
  const up = () => { drag.current = null; setActive(null); };
  return (
    <div dir="ltr" className="w-full">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none cursor-pointer" style={{ touchAction: "none" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {rays.map((r, i) => (
          <g key={i} opacity={active === null || active === i ? 1 : 0.6}>
            <Axis lo={lo} hi={hi} y={rowY(i)} />
            <SetPath set={rayToSet(r)} lo={lo} hi={hi} y={rowY(i)} color={colors[i]} />
            <circle cx={X(r.point)} cy={rowY(i)} r={20} fill={colors[i]} opacity={0.15} />
          </g>
        ))}
        {result && (
          <g>
            <Axis lo={lo} hi={hi} y={rowY(rays.length)} />
            <SetPath set={result} lo={lo} hi={hi} y={rowY(rays.length)} color="#facc15" />
          </g>
        )}
        {compare && (
          <g>
            <Axis lo={lo} hi={hi} y={rowY(rays.length + (result ? 1 : 0))} />
            <SetPath set={compare} lo={lo} hi={hi} y={rowY(rays.length + (result ? 1 : 0))} color="#4ade80" />
          </g>
        )}
      </svg>
    </div>
  );
}
