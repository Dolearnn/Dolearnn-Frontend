"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CornerDownRight,
  Menu,
  RotateCcw,
  Swords,
  X,
} from "lucide-react";
import { subscribeNewsletter } from "@/lib/api/public";
import s from "@/app/landing.module.css";

const navigation = [
  { href: "/practice", label: "Practice" },
  { href: "#learning-loop", label: "How it works" },
  { href: "#arena", label: "Arena" },
  { href: "#tutors", label: "Tutors" },
  { href: "#parents", label: "For parents" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className={s.header}>
      <div className={`${s.container} ${s.navBar}`}>
        <Link href="/" aria-label="DoLearnn home" className={s.wordmark}>
          do<span>learnn</span>
          <span className={s.brandPeriod}>.</span>
        </Link>
        <nav aria-label="Main navigation" className={s.desktopNav}>
          {navigation.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={s.navActions}>
          <Link href="/login" className={s.loginLink}>
            Log in
          </Link>
          <Link href="/practice" className={s.navCta}>
            Try practice <ArrowUpRight size={16} />
          </Link>
          <button
            ref={toggle}
            className={s.menuToggle}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={s.mobileNav}
        hidden={!open}
      >
        {navigation.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
            <ArrowUpRight size={16} />
          </a>
        ))}
        <Link href="/login" onClick={() => setOpen(false)}>
          Log in <ArrowUpRight size={16} />
        </Link>
      </nav>
    </header>
  );
}

const stages = [
  {
    name: "Assess",
    module: "DOLEARNN PRACTICE",
    title: "Find your starting point.",
    text: "Take an exam-style or diagnostic assessment. See how you’re doing topic by topic, so a single overall score doesn’t hide what needs attention.",
    next: "Your answers become a topic-level diagnosis.",
  },
  {
    name: "Diagnose",
    module: "DOLEARNN PRACTICE + AI",
    title: "Give the gap a name.",
    text: "Algebra is looking strong. Probability needs attention. Your results help identify the concepts to revisit and explain why they matter.",
    next: "A weak topic becomes a focused learning mission.",
  },
  {
    name: "Practise",
    module: "DOLEARNN PRACTICE + AI",
    title: "Work on what matters next.",
    text: "Follow a targeted mission with explanations when you get stuck. A personalised study plan gives your practice direction, one topic at a time.",
    next: "Take the topic you’ve practised into an Arena challenge.",
  },
  {
    name: "Compete",
    module: "DOLEARNN ARENA",
    title: "Bring a friend. Bring your focus.",
    text: "Use a 1v1 challenge to put your understanding to work. Each answer adds to the picture of what you know and where you still need support.",
    next: "Recurring mistakes can trigger an AI or tutor recommendation.",
  },
  {
    name: "Get support",
    module: "DOLEARNN AI + TUTORS",
    title: "Get help that has context.",
    text: "Start with an explanation. If the difficulty persists, connect with a qualified teacher who receives a useful summary of your learning needs.",
    next: "The lesson leads back to a comparable assessment.",
  },
  {
    name: "Reassess",
    module: "DOLEARNN PRACTICE",
    title: "Check what actually changed.",
    text: "Return to a comparable assessment. See which topics improved, which still need work and what your next learning mission should focus on.",
    next: "New evidence. A better-informed next move. The loop continues.",
  },
];

function StageExample({ stage }: { stage: number }) {
  if (stage === 0)
    return (
      <>
        <p className={s.smallLabel}>MATHEMATICS / TOPIC MASTERY</p>
        <div className={s.loopScores}>
          {[
            ["Algebra", 84],
            ["Trigonometry", 68],
            ["Calculus", 43],
            ["Probability", 31],
          ].map(([name, value]) => (
            <div key={name}>
              <span>{name}</span>
              <div>
                <i style={{ width: `${value}%` }} />
              </div>
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
        <p className={s.previewFootnote}>
          A topic breakdown reveals what a total score can miss.
        </p>
      </>
    );
  if (stage === 1)
    return (
      <>
        <p className={s.smallLabel}>YOUR NEXT FOCUS</p>
        <div className={s.focusNumber}>
          31<small>%</small>
          <span>Probability</span>
        </div>
        <div className={s.previewCallout}>
          <CornerDownRight size={19} />
          <p>
            <strong>Begin with possible outcomes.</strong> Practise building a
            sample space before combining events.
          </p>
        </div>
      </>
    );
  if (stage === 2)
    return (
      <>
        <p className={s.smallLabel}>YOUR PERSONALISED MISSION</p>
        <h4>Probability, one step at a time.</h4>
        <div className={s.missionMeta}>
          <span>8 questions</span>
          <span>15 minutes</span>
        </div>
        <ul className={s.missionChecklist}>
          <li>
            <Check size={16} /> Count possible outcomes
          </li>
          <li>
            <span className={s.emptyCheck} /> Calculate simple probability
          </li>
          <li>
            <span className={s.emptyCheck} /> Explain your reasoning
          </li>
        </ul>
        <p className={s.previewFootnote}>
          Understand a mistake before moving to the next question.
        </p>
      </>
    );
  if (stage === 3)
    return (
      <>
        <p className={s.smallLabel}>PROBABILITY BATTLE / 1V1</p>
        <div className={s.matchup}>
          <span>YOU</span>
          <Swords size={30} />
          <span>A FRIEND</span>
        </div>
        <h4>
          A familiar topic.
          <br />A fresh challenge.
        </h4>
        <p className={s.previewFootnote}>
          Your answers inform the next recommendation, whatever the match
          result.
        </p>
      </>
    );
  if (stage === 4)
    return (
      <>
        <p className={s.smallLabel}>STILL FINDING THIS DIFFICULT?</p>
        <h4>
          You don’t have to
          <br />
          work it out alone.
        </h4>
        <div className={s.supportOption}>
          <span>01</span>
          <div>
            <strong>AI explanation</strong>
            <p>Work through the reasoning.</p>
          </div>
        </div>
        <div className={s.supportOption}>
          <span>02</span>
          <div>
            <strong>Targeted tutor support</strong>
            <p>A teacher receives your topic history.</p>
          </div>
        </div>
      </>
    );
  return (
    <>
      <p className={s.smallLabel}>PROBABILITY / EXAMPLE REASSESSMENT</p>
      <div className={s.reassessNumbers}>
        <span>
          31<small>%</small>
        </span>
        <ArrowRight size={28} />
        <strong>
          62<small>%</small>
        </strong>
      </div>
      <div className={s.previewCallout}>
        <RotateCcw size={19} />
        <p>
          <strong>The next focus is clearer.</strong> Keep building on simple
          probability. Revisit combined events.
        </p>
      </div>
      <p className={s.previewFootnote}>
        Illustrative scores, not a promised result.
      </p>
    </>
  );
}

export function LearningLoop() {
  const [active, setActive] = useState(0);
  const stage = stages[active];
  return (
    <div>
      <div
        className={s.loopSteps}
        role="group"
        aria-label="Explore the six steps of the learning loop"
      >
        {stages.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={active === index}
            aria-controls="learning-step"
            onClick={() => setActive(index)}
            className={active === index ? s.activeStep : ""}
          >
            <span>0{index + 1}</span>
            <strong>{item.name}</strong>
            {index === 5 ? <RotateCcw size={15} /> : <ArrowRight size={15} />}
          </button>
        ))}
      </div>
      <div
        id="learning-step"
        className={s.loopDetail}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className={s.loopCopy}>
          <p className={s.eyebrow}>{stage.module}</p>
          <h3>{stage.title}</h3>
          <p>{stage.text}</p>
          <div className={s.nextConnection}>
            <CornerDownRight size={20} />
            <p>{stage.next}</p>
          </div>
          <button
            type="button"
            className={s.textLink}
            onClick={() => setActive((active + 1) % stages.length)}
          >
            {active === 5
              ? "Back to assessment"
              : `Next: ${stages[active + 1].name.toLowerCase()}`}{" "}
            <ArrowRight size={17} />
          </button>
        </div>
        <div className={s.loopPreview}>
          <div className={s.previewTop}>
            <span>THE SAME LEARNER. THE NEXT STEP.</span>
            <span>EXAMPLE / 0{active + 1}</span>
          </div>
          <StageExample stage={active} />
        </div>
      </div>
    </div>
  );
}

export function ArenaPreview() {
  const [answer, setAnswer] = useState<number | null>(null);
  const options = ["1/2", "1/3", "2/3", "1/6"];
  return (
    <div className={s.battleBoard}>
      <div className={s.battleTop}>
        <span>
          <Swords size={19} /> ARENA
        </span>
        <span>INTERACTIVE EXAMPLE</span>
      </div>
      <div className={s.battlePlayers}>
        <div>
          <span className={s.playerAvatar}>Y</span>
          <span>You</span>
        </div>
        <strong>
          1 <span>vs</span> 1
        </strong>
        <div>
          <span>A friend</span>
          <span className={s.playerAvatar}>F</span>
        </div>
      </div>
      <div className={s.battleQuestion}>
        <div className={s.questionMeta}>
          <span>MATHEMATICS / PROBABILITY</span>
          <span>07 / 10</span>
        </div>
        <h3>
          A fair die is rolled once. What is the probability of an even number?
        </h3>
        <fieldset className={s.answerOptions}>
          <legend className={s.srOnly}>
            Choose an answer to the example probability question
          </legend>
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              aria-pressed={answer === index}
              disabled={answer !== null}
              onClick={() => setAnswer(index)}
              className={
                answer !== null && index === 0
                  ? s.correctAnswer
                  : answer === index
                    ? s.incorrectAnswer
                    : ""
              }
            >
              <span>{String.fromCharCode(65 + index)}</span>
              {option}
              {answer !== null && index === 0 && <Check size={17} />}
            </button>
          ))}
        </fieldset>
        <div className={s.battleFeedback} aria-live="polite">
          {answer === null ? (
            <p>Try a question. See where the answer takes you.</p>
          ) : (
            <>
              <strong>
                {answer === 0
                  ? "Correct. Now keep building."
                  : "Not quite. Here’s your next learning signal."}
              </strong>
              <p>
                The even outcomes are 2, 4 and 6. That’s 3 out of 6, or 1/2.{" "}
                {answer !== 0 && "Next focus: counting favourable outcomes."}
              </p>
              <button className={s.textLink} onClick={() => setAnswer(null)}>
                Try again <RotateCcw size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={s.battleSignal}>
        <CornerDownRight size={18} />
        <p>ANSWER → LEARNING SIGNAL → NEXT STEP</p>
      </div>
    </div>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  return (
    <div className={s.newsletter}>
      <strong>A little learning in your inbox.</strong>
      <p>Study tips and DoLearnn product updates.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (status === "pending" || !email.trim()) return;
          setStatus("pending");
          try {
            await subscribeNewsletter({ email: email.trim() });
            setEmail("");
            setStatus("success");
          } catch {
            setStatus("error");
          }
        }}
      >
        <label htmlFor="newsletter-email" className={s.srOnly}>
          Email address for learning updates
        </label>
        <div className={s.newsletterField}>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={status === "pending"}
          />
          <button
            type="submit"
            disabled={status === "pending"}
            aria-label={
              status === "pending" ? "Subscribing" : "Subscribe to updates"
            }
          >
            {status === "pending" ? "…" : <ArrowRight size={20} />}
          </button>
        </div>
        <p className={s.formStatus} role="status">
          {status === "success"
            ? "You’re subscribed. Thanks for joining us."
            : status === "error"
              ? "We couldn’t subscribe you. Please try again."
              : status === "pending"
                ? "Subscribing…"
                : ""}
        </p>
      </form>
    </div>
  );
}
