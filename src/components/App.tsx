"use client";
import { useEffect, useState, type ReactNode } from "react";
import { AppProvider, useApp } from "@/lib/store";
import { ar } from "@/lib/math";
import Lab from "./Lab";
import Lessons from "./Lessons";
import Practice from "./Practice";
import Graphing from "./Graphing";
import Challenge from "./Challenge";
import Achievements from "./Achievements";
import Teacher from "./Teacher";

const NAV = [
  ["home", "الرئيسية", "🏠"], ["explore", "استكشفي المفهوم", "🔭"], ["lessons", "دروس المتباينات", "📚"], ["practice", "التدريب التفاعلي", "✍️"],
  ["graph", "التمثيل البياني", "📈"], ["challenge", "تحدي المهارات", "🎮"], ["achievements", "إنجازاتي", "🏅"], ["teacher", "مساحة المعلمة", "👩‍🏫"],
] as const;

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 py-14 px-4 md:px-8 max-w-7xl mx-auto">
      <h2 className="section-title">{title}</h2>
      {sub && <p className="text-center opacity-80 mb-8 -mt-2">{sub}</p>}
      {children}
    </section>
  );
}

function Nav() {
  const { settings, setSettings, progress } = useApp();
  const [active, setActive] = useState("home");
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    const f = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => { obs.disconnect(); document.removeEventListener("fullscreenchange", f); };
  }, []);
  const toggleFs = () => { Promise.resolve(document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()).catch(() => {}); };
  return (
    <header className="nav no-print">
      <div className="max-w-7xl mx-auto flex items-center gap-2 px-3 py-2">
        <a href="#home" className="font-extrabold text-lg whitespace-nowrap brand">∞ عالم المتباينات <span className="gold">٣٦٠°</span></a>
        <nav className="flex-1 overflow-x-auto no-scrollbar">
          <ul className="flex gap-1 min-w-max">
            {NAV.map(([id, t, i]) => (
              <li key={id}><a href={`#${id}`} className={`nav-link ${active === id ? "nav-on" : ""}`}><span>{i}</span> {t}</a></li>
            ))}
          </ul>
        </nav>
        <div className="flex gap-1 items-center">
          <span className="chip hidden md:inline-flex">⭐ {ar(progress.stars)}</span>
          <button title="تبديل الثيم" className="icon-btn" onClick={() => setSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}>{settings.theme === "dark" ? "🌙" : "☀️"}</button>
          <button title="ملء الشاشة" className="icon-btn" onClick={toggleFs}>{fs ? "🗗" : "⛶"}</button>
          <button title="وضع البروجكتور" className={`icon-btn ${settings.projector ? "btn-on" : ""}`} onClick={() => setSettings({ projector: !settings.projector })}>📽️</button>
          <button title="الصوت" className="icon-btn" onClick={() => setSettings({ sound: !settings.sound })}>{settings.sound ? "🔊" : "🔇"}</button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const syms = ["<", ">", "≤", "≥", "س", "|س|", "∞", "∅", "−", "+"];
  return (
    <section id="home" className="hero no-print">
      <div className="scene">
        {syms.concat(syms).map((s, i) => (
          <span key={i} className="sym" style={{ right: `${(i * 37) % 95}%`, top: `${(i * 53) % 85}%`, animationDelay: `${(i % 7) * -1.3}s`, fontSize: `${1.4 + (i % 4) * 0.8}rem`, color: ["#c084fc", "#22d3ee", "#f472b6", "#facc15"][i % 4] }}>{s}</span>
        ))}
        <div className="line3d" dir="ltr">
          {Array.from({ length: 13 }, (_, i) => i - 6).map((k) => <span key={k} className="tick3d"><i />{ar(k)}</span>)}
        </div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="chip mx-auto mb-4">المتوسطة السابعة والأربعون (٤٧) · رياضيات الثالث المتوسط · الفصل الرابع</div>
        <h1 className="hero-title">عالم المتباينات الخطية <span className="gold">٣٦٠°</span></h1>
        <p className="text-2xl md:text-3xl font-bold mt-2 grad-text">رحلة التحدي والإبداع</p>
        <div className="cube-wrap my-8"><div className="cube">
          <div className="f f1">&lt;</div><div className="f f2">&gt;</div><div className="f f3">≤</div><div className="f f4">≥</div><div className="f f5">س</div><div className="f f6">٣٦٠°</div>
        </div></div>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#explore" className="btn-primary text-lg">🚀 ابدئي الرحلة</a>
          <a href="#practice" className="btn-ghost text-lg">✍️ التدريب التفاعلي</a>
          <a href="#challenge" className="btn-ghost text-lg">🎮 تحدي المهارات</a>
        </div>
        <p className="mt-6 opacity-80">إعداد وتصميم: المعلمة نوف المطيري</p>
      </div>
    </section>
  );
}

function FlipDemo() {
  const [k, setK] = useState(-2);
  const a = 3, b = 5;
  const ka = k * a, kb = k * b;
  const sign = ka < kb ? "<" : ka > kb ? ">" : "=";
  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-extrabold text-xl">🔄 لماذا تنعكس الإشارة؟</h3>
      <p>نبدأ من العبارة الصحيحة <b>٣ &lt; ٥</b> ونضرب الطرفين في العدد ك:</p>
      <input type="range" min={-5} max={5} value={k} onChange={(e) => setK(+e.target.value)} className="w-full" />
      <div className="math-box text-3xl">{ar(a)} × ({ar(k)}) {sign} {ar(b)} × ({ar(k)}) ⟸ {ar(ka)} {sign} {ar(kb)}</div>
      <div className={k < 0 ? "feedback-try" : "feedback-ok"}>{k < 0 ? "ك سالب: انعكست الإشارة من < إلى > ⚠️" : k === 0 ? "الضرب في صفر يجعل الطرفين متساويين، لذلك لا نضرب في الصفر." : "ك موجب: بقيت الإشارة كما هي ✔"}</div>
    </div>
  );
}

function Explore() {
  const cards = [["<", "أصغر من", "دائرة مفتوحة ○", "س < ٣"], [">", "أكبر من", "دائرة مفتوحة ○", "س > ٣"], ["≤", "أصغر من أو يساوي / على الأكثر / لا يزيد على", "دائرة مغلقة ●", "س ≤ ٣"], ["≥", "أكبر من أو يساوي / على الأقل / لا يقل عن", "دائرة مغلقة ●", "س ≥ ٣"]];
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([s, m, c, e]) => (
          <div key={s} className="card card3d p-5 text-center">
            <div className="text-6xl font-black grad-text">{s}</div>
            <div className="font-bold mt-2">{m}</div>
            <div className="text-sm opacity-80 mt-1">{c}</div>
            <div className="math-box mt-3 !text-xl">{e}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5 space-y-3">
          <h3 className="font-extrabold text-xl">💡 ما المتباينة؟</h3>
          <p className="leading-loose">المتباينة جملة رياضية تقارن بين عبارتين باستعمال إحدى الإشارات &lt; ، &gt; ، ≤ ، ≥. وحل المتباينة ليس عددًا واحدًا غالبًا، بل <b>مجموعة من الأعداد</b> تُكتب بصورة الصفة المميزة مثل {"{ س | س > ٣ }"} وتُمثّل على خط الأعداد.</p>
          <p className="leading-loose">نحل المتباينة كما نحل المعادلة تمامًا، مع قاعدة ذهبية واحدة: <b className="gold">إذا ضربنا أو قسمنا الطرفين على عدد سالب نعكس اتجاه الإشارة.</b></p>
        </div>
        <FlipDemo />
      </div>
      <div id="lab" className="scroll-mt-28">
        <h3 className="section-sub">🧪 مختبر المتباينات التفاعلي</h3>
        <Lab />
      </div>
    </div>
  );
}

function Inner() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <div className="no-print">
          <Section id="explore" title="🔭 استكشفي المفهوم" sub="تعرّفي على رموز المتباينات وجرّبي المختبر الذي يحل معك خطوة بخطوة"><Explore /></Section>
          <Section id="lessons" title="📚 دروس الفصل الرابع: المتباينات الخطية" sub="ستة دروس وفق كتاب الرياضيات للصف الثالث المتوسط"><Lessons /></Section>
          <Section id="practice" title="✍️ التدريب التفاعلي" sub="٦٠ سؤالًا في ثلاثة مستويات وستة أنواع"><Practice /></Section>
          <Section id="graph" title="📈 التمثيل البياني" sub="خط أعداد ذكي بالسحب واللمس، ومستوى إحداثي تفاعلي"><Graphing /></Section>
          <Section id="challenge" title="🎮 تحدي المتباينات" sub="مغامرة من ست محطات نحو كأس «بطلة المتباينات»"><Challenge /></Section>
        </div>
        <Section id="achievements" title="🏅 إنجازاتي"><Achievements /></Section>
        <div className="no-print">
          <Section id="teacher" title="👩‍🏫 مساحة المعلمة"><Teacher /></Section>
        </div>
      </main>
      <footer className="text-center py-8 opacity-80 no-print">
        عالم المتباينات الخطية ٣٦٠° — المتوسطة السابعة والأربعون (٤٧) — إعداد وتصميم المعلمة نوف المطيري
        <div className="text-xs mt-1">يُحفظ التقدم على جهازك فقط، ولا تُجمع أي بيانات شخصية.</div>
      </footer>
    </>
  );
}

export default function App() {
  return <AppProvider><Inner /></AppProvider>;
}
