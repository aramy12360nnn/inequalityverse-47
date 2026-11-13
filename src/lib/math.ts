// محرك المتباينات الخطية: كسور دقيقة + محلل + حلّ بالخطوات
export type F = { n: number; d: number };
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const fr = (n: number, d = 1): F => {
  if (d < 0) { n = -n; d = -d; }
  const k = gcd(n, d) || 1;
  return { n: n / k + 0, d: d / k };
};
const add = (a: F, b: F) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: F, b: F) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: F, b: F) => fr(a.n * b.n, a.d * b.d);
const div = (a: F, b: F) => fr(a.n * b.d, a.d * b.n);
const val = (a: F) => a.n / a.d;
const isZero = (a: F) => a.n === 0;
const abs = (a: F) => fr(Math.abs(a.n), a.d);

const DIG = "٠١٢٣٤٥٦٧٨٩";
export const ar = (s: string | number) =>
  String(s).replace(/[0-9]/g, (d) => DIG[+d]).replace(/-/g, "−").replace(/\./g, "٫");

export const fmtF = (f: F): string => {
  if (f.d === 1) return ar(f.n);
  return (f.n < 0 ? "−" : "") + ar(`${Math.abs(f.n)}/${f.d}`);
};
export const fmtNum = (x: number): string => {
  if (!isFinite(x)) return x > 0 ? "∞" : "−∞";
  if (Math.abs(x - Math.round(x)) < 1e-9) return ar(Math.round(x));
  for (let d = 2; d <= 100; d++) {
    const n = x * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return fmtF(fr(Math.round(n), d));
  }
  return ar(x.toFixed(2));
};

export type Lin = { a: F; b: F };
const lc = (b: F): Lin => ({ a: fr(0), b });
export const fmtLin = (l: Lin): string => {
  let s = "";
  if (!isZero(l.a)) {
    const a = l.a;
    if (a.n === 1 && a.d === 1) s = "س";
    else if (a.n === -1 && a.d === 1) s = "−س";
    else if (a.d > 1 && Math.abs(a.n) === 1) s = (a.n < 0 ? "−" : "") + "س/" + ar(a.d);
    else s = fmtF(a) + "س";
    if (!isZero(l.b)) s += val(l.b) > 0 ? ` + ${fmtF(l.b)}` : ` − ${fmtF(abs(l.b))}`;
    return s;
  }
  return fmtF(l.b);
};
const evalLin = (l: Lin, t: number) => val(l.a) * t + val(l.b);

// ---------- المحلل ----------
type Tok = { t: "num" | "x" | "op" | "(" | ")"; v: string };
function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " ") { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: "num", v: s.slice(i, j) });
      i = j; continue;
    }
    if (c === "x") { out.push({ t: "x", v: c }); i++; continue; }
    if ("+-*/".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    if (c === "(" || c === ")") { out.push({ t: c, v: c }); i++; continue; }
    throw new Error(`رمز غير مفهوم: «${c}»`);
  }
  return out;
}
const numF = (s: string): F => {
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) throw new Error("عدد غير صحيح");
  const [i, d = ""] = s.split(".");
  return fr(parseInt((i || "0") + d, 10), Math.pow(10, d.length));
};

function parseLinear(src: string): { lin: Lin; complex: boolean } {
  const toks = tokenize(src);
  if (!toks.length) throw new Error("أحد طرفي المتباينة فارغ");
  let p = 0;
  let paren = false;
  const peek = () => toks[p];
  const expr = (top: boolean): Lin => {
    let r = term();
    let xt = isZero(r.a) ? 0 : 1, ct = isZero(r.b) ? 0 : 1;
    while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
      const o = toks[p++].v;
      const t = term();
      if (!isZero(t.a)) xt++;
      if (!isZero(t.b)) ct++;
      r = o === "+" ? { a: add(r.a, t.a), b: add(r.b, t.b) } : { a: sub(r.a, t.a), b: sub(r.b, t.b) };
    }
    if (top && (xt > 1 || ct > 1)) paren = true;
    return r;
  };
  const term = (): Lin => {
    let r = factor();
    for (;;) {
      const k = peek();
      if (!k) break;
      if (k.t === "op" && (k.v === "*" || k.v === "/")) {
        p++;
        const f = factor();
        if (k.v === "*") r = mulLin(r, f);
        else {
          if (!isZero(f.a)) throw new Error("القسمة على متغير تجعلها غير خطية");
          if (isZero(f.b)) throw new Error("لا يمكن القسمة على صفر");
          if (!isZero(r.a) && !isZero(r.b)) paren = true;
          r = { a: div(r.a, f.b), b: div(r.b, f.b) };
        }
      } else if (k.t === "num" || k.t === "x" || k.t === "(") {
        r = mulLin(r, factor());
      } else break;
    }
    return r;
  };
  const mulLin = (u: Lin, v: Lin): Lin => {
    if (!isZero(u.a) && !isZero(v.a)) throw new Error("المتباينة ليست خطية (تحتوي س²)");
    if (isZero(u.a)) return { a: mul(v.a, u.b), b: mul(v.b, u.b) };
    return { a: mul(u.a, v.b), b: mul(u.b, v.b) };
  };
  const factor = (): Lin => {
    const k = toks[p++];
    if (!k) throw new Error("التعبير غير مكتمل");
    if (k.t === "op" && k.v === "-") { const f = factor(); return { a: fr(-f.a.n, f.a.d), b: fr(-f.b.n, f.b.d) }; }
    if (k.t === "op" && k.v === "+") return factor();
    if (k.t === "num") return lc(numF(k.v));
    if (k.t === "x") return { a: fr(1), b: fr(0) };
    if (k.t === "(") {
      paren = true;
      const e = expr(false);
      if (!toks[p] || toks[p].t !== ")") throw new Error("قوس غير مغلق");
      p++;
      return e;
    }
    throw new Error("تركيب غير صحيح");
  };
  const lin = expr(true);
  if (p < toks.length) throw new Error("تركيب غير صحيح");
  return { lin, complex: paren };
}

// ---------- المجموعات ----------
export type Iv = { lo: number; hi: number; loC: boolean; hiC: boolean };
export type Set = Iv[];
export const ALL: Set = [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }];
export const inSet = (S: Set, x: number) =>
  S.some((i) => (x > i.lo || (i.loC && x === i.lo)) && (x < i.hi || (i.hiC && x === i.hi)));

export function intersect(A: Set, B: Set): Set {
  const out: Set = [];
  for (const a of A) for (const b of B) {
    let lo, loC, hi, hiC;
    if (a.lo > b.lo) { lo = a.lo; loC = a.loC; } else if (b.lo > a.lo) { lo = b.lo; loC = b.loC; } else { lo = a.lo; loC = a.loC && b.loC; }
    if (a.hi < b.hi) { hi = a.hi; hiC = a.hiC; } else if (b.hi < a.hi) { hi = b.hi; hiC = b.hiC; } else { hi = a.hi; hiC = a.hiC && b.hiC; }
    if (lo < hi || (lo === hi && loC && hiC)) out.push({ lo, hi, loC, hiC });
  }
  return union(out, []);
}
export function union(A: Set, B: Set): Set {
  const all = [...A, ...B].sort((x, y) => x.lo - y.lo || (x.loC ? -1 : 1));
  const out: Set = [];
  for (const iv of all) {
    const c = out[out.length - 1];
    if (c && (c.hi > iv.lo || (c.hi === iv.lo && (c.hiC || iv.loC)))) {
      if (iv.hi > c.hi) { c.hi = iv.hi; c.hiC = iv.hiC; } else if (iv.hi === c.hi) c.hiC = c.hiC || iv.hiC;
    } else out.push({ ...iv });
  }
  return out;
}
export const sameSet = (A: Set, B: Set) => {
  const a = union(A, []), b = union(B, []);
  return a.length === b.length && a.every((x, i) => x.lo === b[i].lo && x.hi === b[i].hi && (x.loC === b[i].loC || !isFinite(x.lo)) && (x.hiC === b[i].hiC || !isFinite(x.hi)));
};

export function setText(S: Set): string {
  if (!S.length) return "∅ (لا يوجد حل)";
  if (S.length === 1 && S[0].lo === -Infinity && S[0].hi === Infinity) return "جميع الأعداد الحقيقية";
  return S.map((i) => {
    if (i.lo === -Infinity) return `س ${i.hiC ? "≤" : "<"} ${fmtNum(i.hi)}`;
    if (i.hi === Infinity) return `س ${i.loC ? "≥" : ">"} ${fmtNum(i.lo)}`;
    if (i.lo === i.hi) return `س = ${fmtNum(i.lo)}`;
    return `${fmtNum(i.lo)} ${i.loC ? "≤" : "<"} س ${i.hiC ? "≤" : "<"} ${fmtNum(i.hi)}`;
  }).join(" أو ");
}
export const setBuilder = (S: Set) => (S.length && !(S[0].lo === -Infinity && S[0].hi === Infinity && S.length === 1) ? `{ س | ${setText(S)} }` : setText(S));

// ---------- الحل ----------
export type Op = "<" | ">" | "≤" | "≥";
const FLIP: Record<Op, Op> = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
const cmp = (l: number, op: Op, r: number) => {
  const e = 1e-9;
  if (op === "<") return l < r - e;
  if (op === ">") return l > r + e;
  if (op === "≤") return l <= r + e;
  return l >= r - e;
};
const ray = (op: Op, v: number): Set =>
  op === "<" || op === "≤" ? [{ lo: -Infinity, hi: v, loC: false, hiC: op === "≤" }] : [{ lo: v, hi: Infinity, loC: op === "≥", hiC: false }];

export type Step = { expr: string; reason: string };
type Piece = { set: Set; steps: Step[]; pred: (t: number) => boolean; sub: (t: number) => string; display: string };

function solveSimple(L: Lin, op: Op, R: Lin, complex: boolean, steps: Step[]): Set {
  const line = () => `${fmtLin(L)} ${op} ${fmtLin(R)}`;
  if (complex) steps.push({ expr: line(), reason: "نبسّط كل طرف: نوزّع الضرب على الأقواس ونجمع الحدود المتشابهة." });
  if (!isZero(R.a)) {
    const k = R.a;
    L = { a: sub(L.a, k), b: L.b }; R = { a: fr(0), b: R.b };
    const kt = fmtLin({ a: abs(k), b: fr(0) });
    steps.push({ expr: line(), reason: val(k) > 0 ? `نطرح ${kt} من الطرفين لنجمع حدود المتغير في طرف واحد (الطرح لا يغيّر اتجاه الإشارة).` : `نضيف ${kt} إلى الطرفين لنجمع حدود المتغير في طرف واحد (الجمع لا يغيّر اتجاه الإشارة).` });
  }
  if (isZero(L.a)) {
    const ok = cmp(val(L.b), op, val(R.b));
    const ex = `${fmtF(L.b)} ${op} ${fmtF(R.b)}`;
    if (steps.length && steps[steps.length - 1].expr === ex) steps.pop();
    steps.push({ expr: ex, reason: ok ? "اختفى المتغير والعبارة الناتجة صحيحة دائمًا، إذن كل الأعداد الحقيقية حلول." : "اختفى المتغير والعبارة الناتجة خاطئة دائمًا، إذن لا يوجد حل." });
    return ok ? ALL : [];
  }
  if (!isZero(L.b)) {
    const k = L.b;
    R = { a: fr(0), b: sub(R.b, k) }; L = { a: L.a, b: fr(0) };
    steps.push({ expr: line(), reason: val(k) > 0 ? `نطرح ${fmtF(k)} من الطرفين لعزل حد المتغير (خاصية الطرح للمتباينة).` : `نضيف ${fmtF(abs(k))} إلى الطرفين لعزل حد المتغير (خاصية الجمع للمتباينة).` });
  }
  const a = L.a;
  if (!(a.n === 1 && a.d === 1)) {
    const neg = val(a) < 0;
    const v = div(R.b, a);
    const by = a.d > 1 && Math.abs(a.n) === 1 ? `نضرب الطرفين في ${fmtF(fr(a.n < 0 ? -a.d : a.d))}` : `نقسم الطرفين على ${neg ? "(" + fmtF(a) + ")" : fmtF(a)}`;
    if (neg) op = FLIP[op];
    L = { a: fr(1), b: fr(0) }; R = lc(v);
    steps.push({ expr: line(), reason: neg ? `${by}، وهو عدد سالب؛ لذا نعكس اتجاه إشارة المتباينة ⚠️` : `${by}، وهو عدد موجب؛ فيبقى اتجاه الإشارة كما هو.` });
  }
  return ray(op, val(R.b));
}

function solveTriple(c1: F, op1: Op, E: Lin, op2: Op, c2: F, steps: Step[]): Set {
  if ((op1 === ">" || op1 === "≥") && (op2 === ">" || op2 === "≥")) {
    [c1, c2] = [c2, c1]; [op1, op2] = [FLIP[op2], FLIP[op1]];
    steps.push({ expr: `${fmtF(c1)} ${op1} ${fmtLin(E)} ${op2} ${fmtF(c2)}`, reason: "نعيد كتابة المتباينة المركبة بحيث يكون الأصغر على اليسار." });
  } else if (!((op1 === "<" || op1 === "≤") && (op2 === "<" || op2 === "≤"))) throw new Error("إشارتا المتباينة المركبة يجب أن تكونا في الاتجاه نفسه");
  if (isZero(E.a)) throw new Error("الطرف الأوسط يجب أن يحتوي على س");
  const line = () => `${fmtF(c1)} ${op1} ${fmtLin(E)} ${op2} ${fmtF(c2)}`;
  if (!isZero(E.b)) {
    const k = E.b;
    c1 = sub(c1, k); c2 = sub(c2, k); E = { a: E.a, b: fr(0) };
    steps.push({ expr: line(), reason: val(k) > 0 ? `نطرح ${fmtF(k)} من الأجزاء الثلاثة.` : `نضيف ${fmtF(abs(k))} إلى الأجزاء الثلاثة.` });
  }
  const a = E.a;
  if (!(a.n === 1 && a.d === 1)) {
    const neg = val(a) < 0;
    c1 = div(c1, a); c2 = div(c2, a); E = { a: fr(1), b: fr(0) };
    if (neg) {
      steps.push({ expr: `${fmtF(c1)} ${FLIP[op1]} س ${FLIP[op2]} ${fmtF(c2)}`, reason: `نقسم الأجزاء الثلاثة على (${fmtF(a)}) وهو سالب، فنعكس الإشارتين ⚠️` });
      [c1, c2] = [c2, c1]; [op1, op2] = [op2, op1];
      steps.push({ expr: line(), reason: "نعيد الترتيب ليكون الأصغر على اليسار." });
    } else steps.push({ expr: line(), reason: `نقسم الأجزاء الثلاثة على ${fmtF(a)} (موجب) فتبقى الإشارات كما هي.` });
  }
  const lo = val(c1), hi = val(c2), loC = op1 === "≤", hiC = op2 === "≤";
  if (lo < hi || (lo === hi && loC && hiC)) return [{ lo, hi, loC, hiC }];
  steps.push({ expr: "∅", reason: "لا يوجد عدد يحقق الشرطين معًا." });
  return [];
}

function normalize(s: string) {
  return s
    .replace(/[٠-٩]/g, (d) => String(DIG.indexOf(d)))
    .replace(/٫/g, ".").replace(/[سX]/g, "x").replace(/×/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-")
    .replace(/<=|=</g, "≤").replace(/>=|=>/g, "≥").replace(/\s+/g, " ").trim();
}

function solvePiece(src: string): Piece {
  const ops = [...src.matchAll(/[<>≤≥]/g)];
  if (ops.length === 0) throw new Error("لم أجد إشارة متباينة (< أو > أو ≤ أو ≥)");
  const steps: Step[] = [];
  const parts: string[] = [];
  let last = 0;
  ops.forEach((m) => { parts.push(src.slice(last, m.index).trim()); last = (m.index ?? 0) + 1; });
  parts.push(src.slice(last).trim());
  const opv = ops.map((m) => m[0] as Op);
  const pretty = (s: string) => fmtLinOrRaw(s);
  if (ops.length === 1) {
    let [l, r] = parts;
    let op = opv[0];
    if (/\|/.test(r) && !/\|/.test(l)) { [l, r] = [r, l]; op = FLIP[op]; }
    const am = l.match(/^\|(.+)\|$/);
    if (am) {
      const E = parseLinear(am[1]).lin;
      const c = parseLinear(r).lin;
      if (!isZero(c.a)) throw new Error("في متباينة القيمة المطلقة يجب أن يكون الطرف الآخر عددًا");
      const cv = val(c.b);
      const disp = `|${fmtLin(E)}| ${op} ${fmtF(c.b)}`;
      steps.push({ expr: disp, reason: "متباينة تتضمن قيمة مطلقة: |أ| تمثل بُعد أ عن الصفر." });
      let set: Set;
      if (cv < 0 || (cv === 0 && (op === "<" || op === "≥"))) {
        const none = op === "<" || op === "≤";
        steps.push({ expr: none ? "∅" : "جميع الأعداد الحقيقية", reason: none ? "القيمة المطلقة لا تكون سالبة أبدًا، فلا يمكن أن تكون أصغر من عدد سالب (أو من الصفر)." : "القيمة المطلقة دائمًا ≥ ٠ فهي أكبر من أي عدد سالب، إذن كل الأعداد حلول." });
        set = none ? [] : ALL;
      } else if (cv === 0 && op === "≤") {
        steps.push({ expr: `${fmtLin(E)} = ٠`, reason: "القيمة المطلقة لا تكون أقل من صفر، فيجب أن تساوي صفرًا." });
        const x = -val(E.b) / val(E.a);
        steps.push({ expr: `س = ${fmtNum(x)}`, reason: "نحل المعادلة." });
        set = [{ lo: x, hi: x, loC: true, hiC: true }];
      } else if (op === "<" || op === "≤") {
        steps.push({ expr: `${fmtF(fr(-c.b.n, c.b.d))} ${op} ${fmtLin(E)} ${op} ${fmtF(c.b)}`, reason: `|أ| ${op} ب تعني أن أ تقع بين −ب و ب، فنكتبها متباينة مركبة بـ «و».` });
        set = solveTriple(fr(-c.b.n, c.b.d), op, E, op, c.b, steps);
      } else {
        const op2: Op = op === ">" ? "<" : "≤";
        steps.push({ expr: `${fmtLin(E)} ${op2} ${fmtF(fr(-c.b.n, c.b.d))} أو ${fmtLin(E)} ${op} ${fmtF(c.b)}`, reason: `|أ| ${op} ب تعني أن أ أبعد من ب عن الصفر، فنكتبها متباينة مركبة بـ «أو».` });
        const s1: Step[] = [], s2: Step[] = [];
        const A = solveSimple(E, op2, lc(fr(-c.b.n, c.b.d)), false, s1);
        const B = solveSimple(E, op, lc(c.b), false, s2);
        s1.forEach((s) => steps.push({ ...s, reason: "(الجزء الأول) " + s.reason }));
        s2.forEach((s) => steps.push({ ...s, reason: "(الجزء الثاني) " + s.reason }));
        set = union(A, B);
      }
      return {
        set, steps, display: disp,
        pred: (t) => cmp(Math.abs(evalLin(E, t)), op, cv),
        sub: (t) => `|${fmtNum(evalLin(E, t))}| = ${fmtNum(Math.abs(evalLin(E, t)))} ${op} ${fmtNum(cv)}`,
      };
    }
    const L = parseLinear(l), R = parseLinear(r);
    const disp = `${pretty(l)} ${op} ${pretty(r)}`;
    steps.push({ expr: disp, reason: "المتباينة الأصلية." });
    const set = solveSimple(L.lin, op, R.lin, L.complex || R.complex, steps);
    return { set, steps, display: disp, pred: (t) => cmp(evalLin(L.lin, t), op, evalLin(R.lin, t)), sub: (t) => `${fmtNum(evalLin(L.lin, t))} ${op} ${fmtNum(evalLin(R.lin, t))}` };
  }
  if (ops.length === 2) {
    const [a, m, b] = parts.map((p) => parseLinear(p));
    if (!isZero(a.lin.a) || !isZero(b.lin.a)) throw new Error("في المتباينة المركبة يكون المتغير في الجزء الأوسط فقط");
    const disp = `${pretty(parts[0])} ${opv[0]} ${pretty(parts[1])} ${opv[1]} ${pretty(parts[2])}`;
    steps.push({ expr: disp, reason: "متباينة مركبة تتضمن «و»: نجري العملية نفسها على الأجزاء الثلاثة." });
    if (m.complex) steps.push({ expr: `${fmtF(a.lin.b)} ${opv[0]} ${fmtLin(m.lin)} ${opv[1]} ${fmtF(b.lin.b)}`, reason: "نبسّط الجزء الأوسط." });
    const set = solveTriple(a.lin.b, opv[0], m.lin, opv[1], b.lin.b, steps);
    return {
      set, steps, display: disp,
      pred: (t) => cmp(val(a.lin.b), opv[0], evalLin(m.lin, t)) && cmp(evalLin(m.lin, t), opv[1], val(b.lin.b)),
      sub: (t) => `${fmtF(a.lin.b)} ${opv[0]} ${fmtNum(evalLin(m.lin, t))} ${opv[1]} ${fmtF(b.lin.b)}`,
    };
  }
  throw new Error("عدد إشارات المتباينة كبير جدًا");
}
function fmtLinOrRaw(s: string): string {
  const m = s.match(/^\|(.+)\|$/);
  if (m) return `|${fmtLinOrRaw(m[1])}|`;
  return ar(s.replace(/\s+/g, "").replace(/x/g, "س").replace(/\*/g, "×").replace(/([+\-×≤≥<>])/g, " $1 ").replace(/\(\s*-\s*/g, "(−").replace(/^\s*-\s*/, "−").replace(/\s+/g, " ").trim());
}

export type Solution = {
  ok: true; original: string; steps: Step[]; set: Set; text: string; builder: string;
  test: { value: number; sub: string; ok: boolean } | null;
  counter: { value: number; sub: string; ok: boolean } | null;
};
export function solve(input: string): Solution | { ok: false; error: string } {
  try {
    const s = normalize(input);
    if (!s) throw new Error("اكتبي متباينة أولًا");
    const orParts = s.split(/\s*(?:أو|or)\s*/);
    let mode: "or" | "and" | null = null;
    let parts = orParts;
    if (orParts.length > 1) mode = "or";
    else {
      const andParts = s.split(/\s+(?:و|and)\s+/);
      if (andParts.length > 1) { mode = "and"; parts = andParts; }
    }
    if (parts.length > 2) throw new Error("ادعمي متباينتين فقط في المركبة");
    const pieces = parts.map(solvePiece);
    let steps: Step[], set: Set, original: string;
    if (pieces.length === 1) { steps = pieces[0].steps; set = pieces[0].set; original = pieces[0].display; }
    else {
      original = pieces.map((p) => p.display).join(mode === "or" ? " أو " : " و ");
      steps = [{ expr: original, reason: mode === "or" ? "متباينة مركبة بـ «أو»: نحل كل متباينة على حدة ثم نأخذ الاتحاد." : "متباينة مركبة بـ «و»: نحل كل متباينة على حدة ثم نأخذ التقاطع." }];
      pieces.forEach((p, i) => p.steps.forEach((st) => steps.push({ ...st, reason: `(المتباينة ${i === 0 ? "الأولى" : "الثانية"}) ${st.reason}` })));
      set = mode === "or" ? union(pieces[0].set, pieces[1].set) : intersect(pieces[0].set, pieces[1].set);
      steps.push({ expr: setText(set), reason: mode === "or" ? "الاتحاد: كل عدد يحقق إحدى المتباينتين على الأقل." : "التقاطع: الأعداد التي تحقق المتباينتين معًا." });
    }
    const pred = (t: number) => (pieces.length === 1 ? pieces[0].pred(t) : mode === "or" ? pieces[0].pred(t) || pieces[1].pred(t) : pieces[0].pred(t) && pieces[1].pred(t));
    const subs = (t: number) => pieces.map((p) => p.sub(t)).join(mode === "or" ? " أو " : " و ");
    const cands = Array.from({ length: 201 }, (_, i) => i - 100).sort((x, y) => Math.abs(x) - Math.abs(y) || y - x);
    const tin = cands.find((k) => inSet(set, k));
    const tout = cands.find((k) => !inSet(set, k));
    return {
      ok: true, original, steps, set, text: setText(set), builder: setBuilder(set),
      test: tin === undefined ? null : { value: tin, sub: subs(tin), ok: pred(tin) },
      counter: tout === undefined ? null : { value: tout, sub: subs(tout), ok: pred(tout) },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}
export const flipOp = (o: Op) => FLIP[o];
