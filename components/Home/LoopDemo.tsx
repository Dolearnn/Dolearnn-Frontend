"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, Sparkles } from "lucide-react";
import s from "@/app/studio.module.css";

const tabs = [
  { id: "assess", name: "Assess", hint: "Exam-style test" },
  { id: "diagnose", name: "Diagnose", hint: "Ranked topic gaps" },
  { id: "support", name: "Support", hint: "AI coach + tutor" },
  { id: "reassess", name: "Reassess", hint: "Prove the change" },
] as const;

const ranked = [
  { topic: "Probability", score: 31, weak: true },
  { topic: "Calculus", score: 43, weak: true },
  { topic: "Trigonometry", score: 68 },
  { topic: "Algebra", score: 84 },
];

export function LoopDemo() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % tabs.length),
      4800,
    );
    return () => clearInterval(timer);
  }, [auto]);

  return (
    <div
      className={s.demo}
      onMouseEnter={() => setAuto(false)}
      onFocus={() => setAuto(false)}
    >
      <div className={s.demoBar} aria-hidden="true">
        <i />
        <i />
        <i />
        <span>dolearnn / student / mathematics</span>
        <em>EXAMPLE</em>
      </div>
      <div className={s.demoBody}>
        <div
          className={s.demoTabs}
          role="tablist"
          aria-label="The DoLearnn loop"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={active === index}
              aria-controls={`panel-${tab.id}`}
              className={active === index ? s.tabOn : ""}
              onClick={() => {
                setActive(index);
                setAuto(false);
              }}
            >
              <span>{index + 1}</span>
              <strong>{tab.name}</strong>
              <small>{tab.hint}</small>
              {active === index && auto && <b className={s.tabTimer} />}
            </button>
          ))}
        </div>

        <div
          key={tabs[active].id}
          role="tabpanel"
          id={`panel-${tabs[active].id}`}
          aria-labelledby={`tab-${tabs[active].id}`}
          className={s.demoPanel}
        >
          {active === 0 && (
            <div className={s.qCard}>
              <div className={s.qMeta}>
                <span>Question 4 of 20 · Probability</span>
                <span>
                  <Clock size={13} /> 12:40
                </span>
              </div>
              <p className={s.qText}>
                A bag holds 3 green counters and 2 white counters. What is the
                probability of picking a green counter?
              </p>
              <ul className={s.qOptions}>
                <li>A. 2/5</li>
                <li className={s.qPicked}>B. 3/2</li>
                <li>C. 3/5</li>
                <li>D. 5/3</li>
              </ul>
              <p className={s.qNote}>
                Every answer is logged against its topic.
              </p>
            </div>
          )}

          {active === 1 && (
            <div className={s.rankCard}>
              <p className={s.rankHead}>
                Topic gaps · ranked by what to fix first
              </p>
              <ol>
                {ranked.map((row, index) => (
                  <li key={row.topic} className={row.weak ? s.rankWeak : ""}>
                    <span className={s.rankIdx}>{index + 1}</span>
                    <span className={s.rankName}>{row.topic}</span>
                    <span className={s.rankBar}>
                      <i style={{ width: `${row.score}%` }} />
                    </span>
                    <strong>{row.score}%</strong>
                  </li>
                ))}
              </ol>
              <p className={s.rankNote}>
                <Sparkles size={15} /> Start with Probability: your next
                mission is built around it.
              </p>
            </div>
          )}

          {active === 2 && (
            <div className={s.chat}>
              <p className={s.bubbleMe}>
                Why is 3/2 wrong? I counted the green ones correctly.
              </p>
              <p className={s.bubbleAi}>
                <b>AI Study Coach</b>
                You did count the green counters correctly. The denominator
                needs <em>all possible outcomes</em>, green ones included: 3
                green ÷ 5 total = <strong>3/5</strong>.
              </p>
              <div className={s.handoff}>
                <span>
                  Still not clicking? A matched tutor gets your diagnosis and
                  attempts.
                </span>
                <b>
                  Book a tutor <ArrowRight size={14} />
                </b>
              </div>
            </div>
          )}

          {active === 3 && (
            <div className={s.proofCard}>
              <p className={s.rankHead}>
                Probability · comparable reassessment
              </p>
              <div className={s.proofRow}>
                <div>
                  <small>Before</small>
                  <strong>31%</strong>
                  <span className={s.rankBar}>
                    <i style={{ width: "31%" }} />
                  </span>
                </div>
                <ArrowRight size={22} />
                <div className={s.proofAfter}>
                  <small>After</small>
                  <strong>62%</strong>
                  <span className={s.rankBar}>
                    <i style={{ width: "62%" }} />
                  </span>
                </div>
              </div>
              <ul className={s.proofList}>
                <li>
                  <Check size={15} /> Stronger on simple probability
                </li>
                <li>
                  <ArrowRight size={15} /> Next focus: combined events
                </li>
              </ul>
              <p className={s.qNote}>
                Illustrative example, not a measured result.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
