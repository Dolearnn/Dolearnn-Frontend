import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import { ArrowDown, ArrowUpRight, Check, Minus } from "lucide-react";
import { PitchNav, PitchNewsletter } from "@/components/Home/PitchNav";
import { CountUp, Reveal } from "@/components/Home/Motion";
import s from "./pitch.module.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--f-display",
  display: "swap",
});
const hand = Caveat({
  subsets: ["latin"],
  variable: "--f-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoLearnn — Diagnose the weakness. Prove the improvement.",
  description:
    "DoLearnn is a data-driven learning platform for WAEC and UTME students. It combines diagnosis, targeted practice, AI and human support, and reassessment in one measurable loop.",
  openGraph: {
    title: "DoLearnn — Diagnose the weakness. Prove the improvement.",
    description:
      "Find the topics holding you back, get the right support, and prove the improvement with reassessment.",
    images: ["/logo.png"],
  },
};

const whatsapp = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2349057638887").replace(/\D/g, "")}?text=${encodeURIComponent("Hi DoLearnn! I would like to know more about learning and tutor support.")}`;
const trial =
  process.env.NEXT_PUBLIC_TRIAL_FORM_URL ??
  "https://forms.gle/SYjkRgS1Y5JoD43v7";

const ticker = [
  "WAEC",
  "UTME",
  "Mathematics",
  "English",
  "Diagnose",
  "Support",
  "Prove",
  "Lagos first",
];

const script = [
  { q: "1", topic: "Algebra", score: 84, ok: true },
  { q: "2", topic: "Trigonometry", score: 68, ok: true },
  { q: "3", topic: "Calculus", score: 43, ok: false },
  { q: "4", topic: "Probability", score: 31, ok: false },
];

const problems = [
  {
    title: "You get a score, not a diagnosis.",
    text: "58% doesn’t say which topics are costing you marks.",
  },
  {
    title: "Help gets bought blind.",
    text: "Families pay for lessons before anyone knows the exact gap.",
  },
  {
    title: "Nobody checks it worked.",
    text: "Tutoring outcomes are rarely measured with a structured reassessment.",
  },
];

const steps = [
  ["Assess", "Take an exam-style or diagnostic test."],
  ["Diagnose", "Rank your weak topics, worst first."],
  ["Practise", "AI builds a targeted mission for the gap."],
  ["Compete", "Take it into the Arena against a friend."],
  ["Get support", "AI Study Coach, then a human tutor if needed."],
  ["Reassess", "Test again. Measure it. Update your profile."],
];

const compareCols = [
  "Score-only apps",
  "Video & content",
  "Tutor marketplaces",
  "DoLearnn",
];
const compareRows: { label: string; values: (boolean | "some")[] }[] = [
  { label: "Ranks your weakest topics", values: [false, false, false, true] },
  { label: "Targeted practice for the gap", values: ["some", "some", false, true] },
  { label: "AI that knows your history", values: [false, false, false, true] },
  { label: "Human tutor who sees your data", values: [false, false, "some", true] },
  { label: "Reassessment to prove progress", values: [false, false, false, true] },
];

const audiences = [
  {
    id: "students",
    tone: "audBlue",
    label: "Students",
    title: "Know exactly what to fix next.",
    text: "Built for SS2 / SS3 students and recent school leavers preparing for WAEC and UTME. Mathematics first, with selected high-demand subjects alongside.",
    href: "/practice",
    cta: "Try a free warm-up",
  },
  {
    id: "parents",
    tone: "audMint",
    label: "Parents",
    title: "Understand before you pay for help.",
    text: "See where your child needs support, why a tutor is recommended and how their topic results change. Pro plans include a parent progress report.",
    href: "/register",
    cta: "Start a family account",
  },
  {
    id: "schools",
    tone: "audNavy",
    label: "Schools",
    title: "See where the whole class struggles.",
    text: "Class-wide diagnostics, progress dashboards, parent reporting and competition hosting, at ₦900,000 a year.",
    href: trial,
    cta: "Ask about a pilot",
    external: true,
  },
];

const plans = [
  {
    name: "Free",
    price: "₦0",
    unit: "forever",
    tagline: "Learn the loop",
    features: [
      "1 full diagnostic per month",
      "3 practice missions per day",
      "15 AI Study Coach messages per day",
      "Basic progress view",
    ],
  },
  {
    name: "Plus",
    price: "₦2,500",
    unit: "/ month",
    tagline: "For daily exam prep",
    popular: true,
    features: [
      "Unlimited diagnostics and practice",
      "150 AI Coach messages per day",
      "Full topic-gap report",
      "Weekly reassessment",
    ],
  },
  {
    name: "Pro",
    price: "₦4,500",
    unit: "/ month",
    tagline: "For the final push",
    features: [
      "Everything in Plus",
      "Unlimited AI Coach (fair use)",
      "Timed WAEC / UTME mock exams",
      "Parent progress report",
      "10% off tutoring + priority booking",
    ],
  },
];

const team = [
  {
    name: "Adeola Olude",
    role: "Founder & CEO",
    bg: "Software engineer, Accion Microfinance Bank. 400 Level Systems Engineering, University of Lagos.",
  },
  {
    name: "Peter Opeyemi",
    role: "Co-Founder & CTO",
    bg: "Senior product engineer, EventPadi. A platform serving 100,000+ ticket buyers and 4,000 events.",
  },
  {
    name: "Samuel Abdulkareem",
    role: "Head of Product",
    bg: "Qoray Mobility and Energies. Leads product strategy and partnerships.",
  },
  {
    name: "Israel Adedokun",
    role: "Finance & Strategy",
    bg: "Financial advisor, Andersen. Budgets, pricing and unit economics.",
  },
  {
    name: "Dolapo Abraham",
    role: "Academic Director",
    bg: "Mechanical Engineering graduate, University of Lagos (top 10, 2025/26). 4 years teaching.",
  },
];

const faqs = [
  {
    q: "Who is DoLearnn built for?",
    a: "SS2 and SS3 students and recent school leavers preparing for WAEC and UTME, starting in Lagos. We begin with Mathematics and selected high-demand subjects. Parents and schools can use DoLearnn to follow progress.",
  },
  {
    q: "How is this different from a quiz app?",
    a: "A quiz gives you a score. DoLearnn ranks your weak topics, builds targeted practice, brings in AI or a human tutor when needed, then tests you again so the improvement can be measured.",
  },
  {
    q: "Does AI replace the tutor?",
    a: "No. AI is part of the intervention, not the whole of it. When AI is not enough, a matched tutor receives your diagnosis and progress history so the lesson starts from evidence.",
  },
  {
    q: "Is it really free to start?",
    a: "Yes. Every learner gets a monthly diagnostic, daily practice missions and a capped AI Study Coach at no cost. Paid plans lift the limits when you need more.",
  },
  {
    q: "How does tutoring work?",
    a: "₦10,000 per hour one-on-one, or ₦5,000 each for a shared hour, matched to your diagnosed gaps. Booking, payment and progress stay in the app.",
  },
];

function Circle() {
  return (
    <svg
      className={s.circle}
      viewBox="0 0 220 70"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M14 38 C 8 14, 90 4, 160 10 C 214 15, 222 46, 150 58 C 84 68, 6 60, 12 30 C 14 20, 40 12, 62 9"
        pathLength="1"
      />
    </svg>
  );
}

function Underline({ className }: { className?: string }) {
  return (
    <svg
      className={`${s.underline} ${className ?? ""}`}
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M3 9 C 60 2, 110 12, 165 6 S 250 4, 297 8" pathLength="1" />
    </svg>
  );
}

export default function Home() {
  const marquee = [...ticker, ...ticker];
  return (
    <div
      className={`${s.landing} ${display.variable} ${hand.variable}`}
      id="top"
    >
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a href="#main-content" className={s.skipLink}>
        Skip to content
      </a>
      <PitchNav />
      <main id="main-content">
        {/* ---------------- HERO ---------------- */}
        <section
          className={`${s.container} ${s.hero}`}
          aria-labelledby="hero-title"
        >
          <div className={s.heroCopy}>
            <p className={s.kicker}>
              <span /> For WAEC + UTME students · Lagos first
            </p>
            <h1 id="hero-title">
              Diagnose the{" "}
              <span className={s.marked}>
                weakness.
                <Circle />
              </span>
              <br />
              Match the right support.
              <br />
              <span className={s.proved}>
                Prove the improvement.
                <Underline />
              </span>
            </h1>
            <p className={s.lead}>
              DoLearnn finds the exact topics costing you marks, matches the
              right practice, AI and tutor support, then tests you again to
              prove it worked.
            </p>
            <div className={s.actions}>
              <Link className={s.primaryButton} href="/practice">
                Try free Mathematics practice <ArrowUpRight size={19} />
              </Link>
              <a className={s.textLink} href="#how">
                See the loop <ArrowDown size={16} />
              </a>
            </div>
          </div>

          <div className={s.heroVisual} aria-label="Example marked exam script">
            <div className={s.sheet}>
              <div className={s.sheetHead}>
                <span>WAEC Mathematics · Mock 3</span>
                <span>Example</span>
              </div>
              <ol className={s.sheetRows}>
                {script.map((row) => (
                  <li
                    key={row.q}
                    className={row.topic === "Probability" ? s.sheetWeak : ""}
                  >
                    <span className={s.qNum}>{row.q}.</span>
                    <span className={s.qTopic}>{row.topic}</span>
                    <span className={s.qScore}>{row.score}%</span>
                    <span
                      className={row.ok ? s.tick : s.cross}
                      aria-label={row.ok ? "Correct" : "Needs work"}
                    >
                      {row.ok ? "✓" : "✗"}
                    </span>
                  </li>
                ))}
              </ol>
              <p className={s.penScore}>
                58<small>/100</small>
              </p>
              <p className={s.penNote}>
                Probability is the gap.
                <br />
                Start here ↑
              </p>
            </div>
            <div className={s.sticky}>
              <b>Your next move</b>
              <span>Probability mission</span>
              <small>8 questions · 15 min</small>
            </div>
          </div>
        </section>

        <div className={s.ticker} aria-hidden="true">
          <div>
            {marquee.map((word, index) => (
              <span key={`${word}-${index}`}>
                {word} <i>✦</i>
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- PROBLEM ---------------- */}
        <section
          id="problem"
          className={`${s.container} ${s.problem}`}
          aria-labelledby="problem-title"
        >
          <div className={s.problemLead}>
            <p className={s.label}>The problem</p>
            <h2 id="problem-title">
              You practise. You get a score.{" "}
              <em>Then you still don’t know what to fix.</em>
            </h2>
            <div className={s.bigStat}>
              <strong>
                <CountUp to={2243816} duration={1800} />
              </strong>
              <span>
                UTME registrations in 2026 (JAMB). <b>381,814</b> of them in
                Lagos, the largest single state.
              </span>
            </div>
          </div>
          <ol className={s.problemList}>
            {problems.map((item, index) => (
              <Reveal as="li" key={item.title} delay={index * 120} variant="left">
                <span className={s.bigNum}>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            ))}
            <Reveal as="li" className={s.problemTail} delay={360}>
              <p>
                The opportunity isn’t more practice.
                <br />
                It’s better direction and measurable improvement.
              </p>
            </Reveal>
          </ol>
        </section>

        {/* ---------------- HOW ---------------- */}
        <section id="how" className={s.how} aria-labelledby="how-title">
          <div className={s.container}>
            <Reveal className={s.howHead}>
              <p className={s.labelLight}>How it works</p>
              <h2 id="how-title">
                One loop. Every action starts with evidence and ends with a
                re-test.
              </h2>
            </Reveal>
            <ol className={s.stepGrid}>
              {steps.map(([name, text], index) => (
                <Reveal
                  as="li"
                  key={name}
                  delay={index * 90}
                  className={index === steps.length - 1 ? s.stepLast : ""}
                >
                  <span className={s.stepNum}>{index + 1}</span>
                  <h3>{name}</h3>
                  <p>{text}</p>
                </Reveal>
              ))}
            </ol>
            <p className={s.loopBack}>
              ↺ &nbsp;Then the new result feeds the next diagnosis. AI is part
              of the intervention, not the moat.
            </p>
          </div>
        </section>

        {/* ---------------- COMPARE ---------------- */}
        <section
          id="advantage"
          className={`${s.container} ${s.compare}`}
          aria-labelledby="compare-title"
        >
          <Reveal className={s.compareHead}>
            <p className={s.label}>Why DoLearnn</p>
            <h2 id="compare-title">
              Others offer practice, content or AI.{" "}
              <em>We close the loop to measured outcomes.</em>
            </h2>
          </Reveal>
          <Reveal className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">
                    <span className={s.srOnly}>Capability</span>
                  </th>
                  {compareCols.map((col, index) => (
                    <th
                      key={col}
                      scope="col"
                      className={index === 3 ? s.usCol : ""}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {row.values.map((value, index) => (
                      <td key={index} className={index === 3 ? s.usCol : ""}>
                        {value === true ? (
                          <Check
                            size={20}
                            strokeWidth={3}
                            aria-label="Yes"
                          />
                        ) : value === "some" ? (
                          <span className={s.some}>Partly</span>
                        ) : (
                          <Minus size={18} aria-label="No" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </section>

        {/* ---------------- AUDIENCES ---------------- */}
        <section className={s.audiences} aria-label="Who DoLearnn is for">
          {audiences.map((item, index) => (
            <Reveal
              as="article"
              key={item.id}
              id={item.id}
              delay={index * 130}
              className={`${s.aud} ${s[item.tone as "audBlue"]}`}
            >
              <p className={s.audLabel}>{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              {item.external ? (
                <a
                  className={s.audLink}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.cta} <ArrowUpRight size={18} />
                </a>
              ) : (
                <Link className={s.audLink} href={item.href}>
                  {item.cta} <ArrowUpRight size={18} />
                </Link>
              )}
            </Reveal>
          ))}
        </section>

        {/* ---------------- PRICING ---------------- */}
        <section
          id="pricing"
          className={`${s.container} ${s.pricing}`}
          aria-labelledby="pricing-title"
        >
          <Reveal className={s.compareHead}>
            <p className={s.label}>Pricing</p>
            <h2 id="pricing-title">
              Free to start. Cheap to upgrade.{" "}
              <em>Priced for students.</em>
            </h2>
          </Reveal>
          <div className={s.planGrid}>
            {plans.map((plan, index) => (
              <Reveal
                as="article"
                key={plan.name}
                delay={index * 130}
                className={`${s.plan} ${plan.popular ? s.planPopular : ""}`}
              >
                {plan.popular && (
                  <span className={s.popular}>Most popular</span>
                )}
                <h3>{plan.name}</h3>
                <p className={s.price}>
                  {plan.price}
                  <small> {plan.unit}</small>
                </p>
                <p className={s.tagline}>{plan.tagline}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} strokeWidth={3} /> {feature}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <Reveal as="dl" className={s.extras}>
            <div>
              <dt>Exam Season Pass</dt>
              <dd>₦12,000 for 3 months of Pro, timed to WAEC and UTME.</dd>
            </div>
            <div>
              <dt>Targeted tutoring</dt>
              <dd>
                ₦10,000/hour 1-on-1, or ₦5,000 each for a shared hour. Booking
                and payment stay in-app.
              </dd>
            </div>
            <div>
              <dt>School packages</dt>
              <dd>
                ₦900,000/year: class diagnostics, dashboards, parent reports.
              </dd>
            </div>
          </Reveal>
        </section>

        {/* ---------------- TRACTION ---------------- */}
        <section
          id="traction"
          className={s.traction}
          aria-labelledby="traction-title"
        >
          <div className={`${s.container} ${s.tractionInner}`}>
            <div>
              <p className={s.label}>Traction</p>
              <h2 id="traction-title">
                Early demand exists <em>before</em> we’ve scaled.
              </h2>
            </div>
            <ul className={s.stamps}>
              <Reveal as="li" variant="pop">
                <strong>
                  <CountUp to={15} />
                </strong>
                <span>students in the free pilot</span>
              </Reveal>
              <Reveal as="li" variant="pop" delay={160}>
                <strong>
                  <CountUp to={4} />
                </strong>
                <span>students tutored</span>
              </Reveal>
              <Reveal as="li" variant="pop" delay={320}>
                <strong>
                  <CountUp to={2} />
                </strong>
                <span>schools in conversation</span>
              </Reveal>
            </ul>
            <p className={s.schoolNote}>
              Interest in school pilots from{" "}
              <b>Temperance College</b> and <b>Divine Grace Private School</b>.
            </p>
          </div>
        </section>

        {/* ---------------- TEAM ---------------- */}
        <section
          id="team"
          className={`${s.container} ${s.team}`}
          aria-labelledby="team-title"
        >
          <Reveal className={s.teamHead}>
            <p className={s.label}>The team</p>
            <h2 id="team-title">
              Engineering, product, teaching and finance <em>in one team.</em>
            </h2>
          </Reveal>
          <ul className={s.teamList}>
            {team.map((member, index) => (
              <Reveal as="li" key={member.name} delay={index * 70}>
                <h3>{member.name}</h3>
                <span>{member.role}</span>
                <p>{member.bg}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------------- IMPACT ---------------- */}
        <section className={s.impact} aria-labelledby="impact-title">
          <div className={s.container}>
            <p className={s.labelLight}>Year 1 goals</p>
            <h2 id="impact-title">
              Free diagnosis for every learner. Real income for tutors.
            </h2>
            <ul className={s.impactList}>
              <Reveal as="li">
                <strong>
                  <CountUp to={5000} suffix="+" />
                </strong>
                <span>learners get a free topic diagnosis</span>
              </Reveal>
              <Reveal as="li" delay={140}>
                <strong>
                  <CountUp to={50} />
                </strong>
                <span>
                  planned jobs and income opportunities. Tutors keep 80% of
                  every hour booked.
                </span>
              </Reveal>
              <Reveal as="li" delay={280}>
                <strong>1 class</strong>
                <span>
                  at a time: teachers see which topics a whole class is failing
                </span>
              </Reveal>
            </ul>
            <p className={s.fine}>
              Goals, not results to date.
            </p>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section
          id="questions"
          className={`${s.container} ${s.faq}`}
          aria-labelledby="questions-title"
        >
          <div>
            <p className={s.label}>Questions</p>
            <h2 id="questions-title">Before you make a move.</h2>
          </div>
          <div className={s.faqList}>
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className={s.finalCta}>
          <div className={s.container}>
            <h2>
              Stop guessing what to study next.
            </h2>
            <div className={s.actions}>
              <Link href="/practice" className={s.ctaButton}>
                Start with free practice <ArrowUpRight size={20} />
              </Link>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={s.ctaLink}
              >
                Talk to the DoLearnn team <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerTop}>
            <div>
              <a href="#top" className={s.wordmark}>
                Do<span>Learnn</span>
              </a>
              <p>Powered by learning, driven by success.</p>
              <p className={s.location}>Lagos, Nigeria</p>
            </div>
            <nav aria-label="Footer learning links">
              <strong>Explore</strong>
              <Link href="/practice">Try practice</Link>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#parents">For parents</a>
              <a href="#schools">For schools</a>
            </nav>
            <nav aria-label="Footer support links">
              <strong>Stay connected</strong>
              <a href={whatsapp} target="_blank" rel="noreferrer">
                WhatsApp us <ArrowUpRight size={13} />
              </a>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "dolearnnn@gmail.com"}`}
              >
                Contact the team
              </a>
              <Link href="/login">Student & teacher login</Link>
              <a
                href={
                  process.env.NEXT_PUBLIC_INSTAGRAM_URL ??
                  "https://instagram.com/dolearnn"
                }
                target="_blank"
                rel="noreferrer"
              >
                Instagram <ArrowUpRight size={13} />
              </a>
              <a
                href={
                  process.env.NEXT_PUBLIC_LINKEDIN_URL ??
                  "https://linkedin.com/company/dolearnn"
                }
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn <ArrowUpRight size={13} />
              </a>
            </nav>
            <PitchNewsletter />
          </div>
          <div className={s.footerBottom}>
            <span>
              © {new Date().getFullYear()} DoLearnn. All rights reserved.
            </span>
            <span>
              Diagnose the weakness. Match the right support. Prove the
              improvement.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
