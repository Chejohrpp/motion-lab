"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";

type QuestId = "lantern" | "route" | "shards";
type Progress = { completed: QuestId[]; xp: number; path: "ridge" | "grove" | null; shards: number; visits: number };
const DEFAULT_PROGRESS: Progress = { completed: [], xp: 0, path: null, shards: 0, visits: 1 };
const QUESTS: { id: QuestId; number: string; title: string; body: string; reward: number }[] = [
  { id: "lantern", number: "01", title: "Wake the lantern", body: "Your first interaction: trigger a timeline on a custom SVG group.", reward: 25 },
  { id: "route", number: "02", title: "Choose a route", body: "Your choice persists locally and changes the map state.", reward: 40 },
  { id: "shards", number: "03", title: "Collect the signal shards", body: "Click each SVG object. GSAP gives feedback while React stores the result.", reward: 60 },
];
const lessonCode = {
  lantern: `const tl = gsap.timeline();\ntl.to(lantern, { rotation: -8, duration: .2 })\n  .to(lantern, { rotation: 8, duration: .2 })\n  .to(flare, { scale: 1.5, opacity: 0, duration: .7 });`,
  route: `gsap.to(mapPath, {\n  strokeDashoffset: 0,\n  duration: 1.1,\n  ease: "power2.out"\n});\nlocalStorage.setItem("path", choice);`,
  shards: `gsap.to(shard, {\n  scale: 1.35,\n  rotation: 180,\n  duration: .35,\n  ease: "back.out(2)"\n});\nsetProgress(p => ({ ...p, shards: p.shards + 1 }));`,
};

function readProgress(): Progress {
  try {
    const raw = localStorage.getItem("motion-lab-quest");
    if (!raw) return DEFAULT_PROGRESS;
    const saved = JSON.parse(raw) as Partial<Progress>;
    return { ...DEFAULT_PROGRESS, ...saved, visits: (saved.visits || 0) + 1 };
  } catch { return DEFAULT_PROGRESS; }
}

export default function Home() {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [activeQuest, setActiveQuest] = useState<QuestId>("lantern");
  const [message, setMessage] = useState("The valley is quiet. Wake the lantern to begin.");
  const [showCode, setShowCode] = useState(false);
  const [lastAction, setLastAction] = useState("Waiting for input");
  const scene = useRef<SVGSVGElement>(null);
  const lantern = useRef<SVGGElement>(null);
  const flare = useRef<SVGCircleElement>(null);
  const path = useRef<SVGPathElement>(null);
  const shardRefs = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const saved = readProgress();
      setProgress(saved);
      setActiveQuest(saved.completed.includes("shards") ? "shards" : saved.completed.includes("route") ? "shards" : saved.completed.includes("lantern") ? "route" : "lantern");
      setHydrated(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("motion-lab-quest", JSON.stringify(progress)); }, [progress, hydrated]);
  useLayoutEffect(() => {
    if (!scene.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".scene-copy", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: "power2.out" });
      gsap.fromTo(".map-star", { opacity: 0, scale: 0 }, { opacity: .8, scale: 1, duration: .8, stagger: .04, ease: "back.out(2)" });
      gsap.to(".ambient-dot", { y: -9, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: .3 });
    }, scene);
    return () => ctx.revert();
  }, []);

  const completed = (id: QuestId) => progress.completed.includes(id);
  const completeQuest = (id: QuestId, text: string) => {
    const quest = QUESTS.find(q => q.id === id)!;
    if (!completed(id)) {
      setProgress(p => ({ ...p, completed: [...p.completed, id], xp: p.xp + quest.reward }));
      setLastAction(`Quest ${quest.number} complete · +${quest.reward} XP`);
    } else setLastAction("Already discovered · state loaded from local storage");
    setMessage(text);
  };
  function wakeLantern() {
    if (!lantern.current || !flare.current) return;
    gsap.timeline().to(lantern.current, { rotation: -8, transformOrigin: "50% 85%", duration: .18 }).to(lantern.current, { rotation: 8, duration: .18 }).to(lantern.current, { rotation: 0, duration: .18 }).fromTo(flare.current, { scale: .35, opacity: .9, transformOrigin: "center" }, { scale: 1.7, opacity: 0, duration: .75, ease: "power2.out" }, "-=.15");
    completeQuest("lantern", "A warm signal travels across the valley. The SVG lantern is alive.");
    setActiveQuest("route");
  }
  function choosePath(next: "ridge" | "grove") {
    if (path.current) gsap.fromTo(path.current, { strokeDashoffset: 560 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" });
    setProgress(p => ({ ...p, path: next }));
    completeQuest("route", next === "ridge" ? "You chose the ridge. The wind is strong, but the signal is clear." : "You chose the grove. The trees hide a softer route.");
    setActiveQuest("shards");
  }
  function collectShard(index: number) {
    if (progress.shards > index) return;
    const node = shardRefs.current[index];
    if (node) gsap.to(node, { scale: 1.35, rotation: 180, transformOrigin: "center", duration: .35, ease: "back.out(2)", onComplete: () => gsap.to(node, { opacity: 0, scale: .2, duration: .25 }) });
    const next = progress.shards + 1;
    setProgress(p => ({ ...p, shards: next, ...(next === 3 && !p.completed.includes("shards") ? { completed: [...p.completed, "shards"], xp: p.xp + 60 } : {}) }));
    setMessage(next === 3 ? "Three shards lock together. You completed this tiny SVG quest." : `Signal shard ${next} of 3 collected.`);
    setLastAction(next === 3 ? "Quest 03 complete · +60 XP" : `Shard ${next}/3 collected`);
  }
  function resetProgress() { localStorage.removeItem("motion-lab-quest"); setProgress(DEFAULT_PROGRESS); setActiveQuest("lantern"); setMessage("Progress cleared. The valley is quiet again."); setLastAction("Local save cleared"); }
  const pct = Math.round((progress.completed.length / 3) * 100);
  const currentQuest = QUESTS.find(q => q.id === activeQuest)!;

  return <div className="quest-app">
    <aside className="quest-sidebar"><Link href="/" className="brand"><span className="brand-mark">m<span>↗</span></span>motion<span className="brand-light">lab</span><b>BETA</b></Link><div className="sidebar-kicker">LOCAL CAMPAIGN</div><div className="campaign-card"><span className="campaign-orb">✦</span><strong>The Signal Valley</strong><small>SVG QUEST · CHAPTER 01</small><div className="progress-label"><span>Campaign progress</span><b>{pct}%</b></div><div className="progress-track"><i style={{ width: `${pct}%` }} /></div></div><div className="sidebar-kicker quests-kicker">QUEST LOG</div>{QUESTS.map(q => <button className={`quest-nav ${activeQuest === q.id ? "active" : ""}`} key={q.id} onClick={() => setActiveQuest(q.id)}><span className={`quest-number ${completed(q.id) ? "done" : ""}`}>{completed(q.id) ? "✓" : q.number}</span><span><strong>{q.title}</strong><small>{completed(q.id) ? "Completed" : q.id === "lantern" ? "Interaction" : q.id === "route" ? "State" : `${progress.shards}/3 collected`}</small></span></button>)}<div className="sidebar-bottom"><div><span className="save-dot" /> Saved locally</div><button onClick={resetProgress}>Reset campaign</button></div></aside>
    <main className="quest-main"><header className="quest-topbar"><span>Motion Lab <em>/</em> SVG Quest</span><span className="top-status"><i /> {hydrated ? "LOCAL SAVE ACTIVE" : "LOADING SAVE"}</span></header><div className="quest-content"><div className="quest-heading"><div><span className="eyebrow">A PLAYABLE GSAP LESSON</span><h1>Follow the signal<span>.</span></h1><p>Make choices. Animate the SVG. Keep the progress.</p></div><div className="xp-pill"><span>XP</span><strong>{progress.xp}</strong><small>of 125</small></div></div>
      <section className="quest-layout"><div className="world-card"><div className="world-header"><div><i className="live-dot" /> THE SIGNAL VALLEY <span>CHAPTER 01</span></div><div className="world-controls"><span>GSAP + INLINE SVG</span><button onClick={() => setShowCode(v => !v)}>{showCode ? "Hide code" : "Show code"}</button></div></div><div className="world-scene"><svg ref={scene} viewBox="0 0 900 470" role="img" aria-label="An animated SVG valley with a lantern, two routes and three signal shards"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#18231b" /><stop offset="1" stopColor="#0d120f" /></linearGradient><linearGradient id="ridge" x1="0" x2="1"><stop stopColor="#536c4d" /><stop offset="1" stopColor="#b9df88" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="8" /></filter></defs><rect width="900" height="470" fill="url(#sky)" /><g className="map-stars">{Array.from({ length: 22 }, (_, i) => <circle className="map-star" key={i} cx={45 + (i * 83) % 810} cy={30 + (i * 47) % 180} r={i % 3 === 0 ? 2 : 1} fill="#c4e9a4" />)}</g><g className="ambient-dots">{[0, 1, 2, 3, 4].map(i => <circle className="ambient-dot" key={i} cx={115 + i * 190} cy={255 + (i % 2) * 18} r="2" fill="#b9e990" opacity=".45" />)}</g><path d="M0 340 Q120 245 245 320 T470 295 T700 325 T900 260 V470 H0Z" fill="#1b281b" /><path d="M0 390 Q180 320 325 390 T600 370 T900 330 V470 H0Z" fill="#111a12" /><path ref={path} className="travel-path" d="M180 340 C275 305 315 365 395 335 S525 300 580 335 S690 362 760 310" fill="none" stroke="url(#ridge)" strokeWidth="2" strokeDasharray="8 10" strokeDashoffset="560" /><g className="scene-copy"><text x="42" y="52" fill="#8ca37b" fontSize="10" letterSpacing="3">SIGNAL VALLEY / 01</text><text x="42" y="77" fill="#d9edc7" fontSize="18">The valley is listening.</text><text x="42" y="98" fill="#84977b" fontSize="11">Your choices become part of the next scene.</text></g><g ref={lantern} className="svg-lantern" transform="translate(157 272)"><circle ref={flare} className="lantern-flare" cx="0" cy="-25" r="38" fill="#c8f39a" opacity="0" filter="url(#glow)" /><path d="M-22 22 H22 L15 42 H-15Z" fill="#273522" stroke="#a4c980" /><path d="M-12 -4 Q0 -22 12 -4 V23 H-12Z" fill="#d0eea3" /><path d="M-16 -5 Q0 -38 16 -5" fill="none" stroke="#a4c980" strokeWidth="3" /><circle cx="0" cy="9" r="8" fill="#ffffd6" /><path d="M-24 44 H24" stroke="#9aba7c" strokeWidth="2" /></g><g className="route-marker" onClick={() => choosePath("ridge")} role="button" tabIndex={0}><circle cx="550" cy="256" r="20" fill={progress.path === "ridge" ? "#c4ed91" : "#202d20"} stroke="#aecf91" /><text x="550" y="260" textAnchor="middle" fill="#152014" fontSize="12" fontWeight="bold">A</text><text x="550" y="292" textAnchor="middle" fill="#a8bb99" fontSize="10">RIDGE</text></g><g className="route-marker" onClick={() => choosePath("grove")} role="button" tabIndex={0}><circle cx="690" cy="290" r="20" fill={progress.path === "grove" ? "#c4ed91" : "#202d20"} stroke="#aecf91" /><text x="690" y="294" textAnchor="middle" fill="#152014" fontSize="12" fontWeight="bold">B</text><text x="690" y="326" textAnchor="middle" fill="#a8bb99" fontSize="10">GROVE</text></g><g className="shards">{[0, 1, 2].map(i => <g key={i} ref={el => { shardRefs.current[i] = el; }} className={`signal-shard ${progress.shards > i ? "collected" : ""}`} onClick={() => collectShard(i)} role="button" tabIndex={0} transform={`translate(${430 + i * 100} ${180 + (i % 2) * 36})`}><path d="M0 -12 L10 0 L0 12 L-10 0Z" fill={progress.shards > i ? "#53664b" : "#e9ffbc"} stroke="#c8f39a" /><circle r="17" fill="none" stroke="#c8f39a" opacity=".14" /></g>)}</g></svg><div className="scene-hint">{message}</div><div className="action-log"><span><i /> LAST ACTION</span><strong>{lastAction}</strong></div></div><div className="world-actions">{activeQuest === "lantern" && <button className="primary-action" onClick={wakeLantern}>✦ Wake the lantern <span>Enter</span></button>}{activeQuest === "route" && <div className="choice-actions"><button onClick={() => choosePath("ridge")}>Take the ridge <span>A</span></button><button onClick={() => choosePath("grove")}>Enter the grove <span>B</span></button></div>}{activeQuest === "shards" && <div className="quest-prompt"><span className="prompt-icon">✦</span><div><strong>Collect the three signal shards</strong><small>Click the glowing diamonds in the scene.</small></div><b>{progress.shards}/3</b></div>}</div></div>
        <aside className="quest-panel"><div className="panel-label">CURRENT OBJECTIVE</div><div className="objective-number">{currentQuest.number}</div><h2>{currentQuest.title}</h2><p>{currentQuest.body}</p><div className="lesson-divider" /><div className="panel-label">WHAT GSAP DOES HERE</div><p className="plain-note">GSAP changes SVG and DOM properties over time. React stores the game state. They cooperate instead of competing.</p><div className="property-list"><span><b>1</b> Timeline</span><span><b>2</b> SVG transform</span><span><b>3</b> Local progress</span></div>{showCode ? <pre className="quest-code">{lessonCode[activeQuest]}</pre> : <button className="learn-link" onClick={() => setShowCode(true)}>Open the recipe ↗</button>}<div className="panel-footer"><span>QUEST STATUS</span><strong className={completed(activeQuest) ? "complete" : ""}>{completed(activeQuest) ? "COMPLETE" : "IN PROGRESS"}</strong></div></aside></section>
      <section className="architecture"><div><span className="eyebrow">THE IMPORTANT PART</span><h2>Animation is the feedback loop. State is the game.</h2><p>When you click, GSAP gives immediate visual feedback. React decides what has been unlocked. localStorage keeps the small save file after refresh. That division is the pattern you can carry into a real interactive page.</p></div><div className="architecture-flow"><span>INPUT</span><b>→</b><span>GSAP FEEDBACK</span><b>→</b><span>REACT STATE</span><b>→</b><span>LOCAL SAVE</span></div></section><footer className="quest-footer"><span><i /> Built to break safely</span><span>Progress lives in this browser · <button onClick={resetProgress}>clear save</button></span></footer>
      </div></main>
  </div>;
}
