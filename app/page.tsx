import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { ArrowDown, ArrowUpRight, Check, Swords } from "lucide-react";
import { StudioNav, StudioNewsletter } from "@/components/Home/StudioNav";
import { LoopDemo } from "@/components/Home/LoopDemo";
import { CountUp, Reveal } from "@/components/Home/Motion";
import s from "./studio.module.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--f-serif",
  display: "swap",
  style: ["normal", "italic"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
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

const problems = [
  ["Weak diagnosis", "Scores rarely tell you which topics are the problem."],
  [
    "Generic support",
    "Families buy help before they understand the exact gap.",
  ],
  [
    "No proof loop",
    "Tutoring outcomes are rarely measured with a structured re-test.",
  ],
];

const stages = ["Score", "Diagnosis", "Support", "Proof"];
const ladder = [
  { name: "Free CBT apps", note: "Practice + scores", from: 1, to: 1 },
  {
    name: "Video & content platforms",
    note: "Lessons + practice",
    from: 1,
    to: 1,
  },
  {
    name: "Tutor marketplaces",
    note: "Help, without the data",
    from: 3,
    to: 3,
  },
  { name: "DoLearnn", note: "The whole loop", from: 1, to: 4, us: true },
];

const advantages = [
  [
    "Diagnostic intelligence",
    "Results become a ranked map of your weakest topics.",
  ],
  [
    "Context-aware AI",
    "Support uses your diagnosis, attempts and progress history.",
  ],
  ["Human escalation", "A matched tutor sees where you are struggling."],
  [
    "Reassessment + proof",
    "You are tested again, so the change can be measured.",
  ],
];

const classGrid = [
  [3, 2, 1, 3, 2],
  [2, 1, 1, 3, 3],
  [3, 3, 1, 2, 2],
  [2, 1, 2, 3, 3],
  [3, 2, 1, 2, 3],
  [3, 3, 2, 3, 2],
];

const audiences = [
  {
    id: "students",
    label: "Students",
    title: "Know exactly what to fix next.",
    text: "SS2 / SS3 students and recent school leavers preparing for WAEC and UTME. Mathematics first, with selected high-demand subjects alongside.",
    href: "/practice",
    cta: "Try a free warm-up",
  },
  {
    id: "parents",
    label: "Parents",
    title: "Understand before you pay for help.",
    text: "See where your child needs support, why a tutor is recommended and how their topic results change. Pro plans include a parent progress report.",
    href: "/register",
    cta: "Start a family account",
  },
  {
    id: "schools",
    label: "Schools",
    title: "See where the whole class struggles.",
    text: "Class-wide diagnostics, progress dashboards, parent reporting and competition hosting: ₦900,000 a year.",
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
    unit: "per month",
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
    unit: "per month",
    tagline: "For the final push",
    dark: true,
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
    name: "Adeola David",
    role: "Founder & CEO",
    bg: "Software engineer at Accion Microfinance Bank. 400 Level Systems Engineering, University of Lagos.",
    image: "/team/david.jpg",
  },
  {
    name: "Peter Opeyemi",
    role: "Co-Founder & CTO",
    bg: "Senior product engineer at EventPadi, a platform serving 100,000+ ticket buyers and 4,000 events.",
    image: "/team/peter.jpg",
  },
  // {
  //   name: "Samuel Abdulkareem",
  //   role: "Head of Product",
  //   bg: "Qoray Mobility and Energies. Leads product strategy and partnerships.",
  // },
  // {
  //   name: "Israel Adedokun",
  //   role: "Finance & Strategy",
  //   bg: "Financial advisor at Andersen. Budgets, pricing and unit economics.",
  // },
  // {
  //   name: "Dolapo Abraham",
  //   role: "Academic Director",
  //   bg: "Mechanical Engineering graduate, University of Lagos (top 10, 2025/26). Four years of teaching.",
  // },
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

export default function Home() {
  return (
    <div
      className={`${s.landing} ${serif.variable} ${mono.variable}`}
      id="top"
    >
      <noscript>
        <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a href="#main-content" className={s.skipLink}>
        Skip to content
      </a>
      <StudioNav />
      <main id="main-content">
        {/* ---------- HERO ---------- */}
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={`${s.container} ${s.heroText}`}>
            <p className={s.kicker}>For WAEC + UTME students · Lagos first</p>
            <h1 id="hero-title">
              Diagnose the weakness.
              <br />
              Match the right support.
              <br />
              <em>Prove the improvement.</em>
            </h1>
            <p className={s.lead}>
              DoLearnn finds the exact topics costing you marks, matches the
              right practice, AI and tutor support, then tests you again to
              prove it worked.
            </p>
            <div className={s.actions}>
              <Link className={s.primaryButton} href="/practice">
                Try free Mathematics practice <ArrowUpRight size={18} />
              </Link>
              <a className={s.textLink} href="#loop">
                Watch the loop <ArrowDown size={15} />
              </a>
            </div>
          </div>
          <div id="loop" className={`${s.container} ${s.heroDemo}`}>
            <LoopDemo />
          </div>
        </section>

        {/* ---------- MARKET STRIP ---------- */}
        <section className={s.container} aria-label="Market context">
          <dl className={s.strip}>
            <div>
              <dt>UTME registrations, 2026 (JAMB)</dt>
              <dd>
                <CountUp to={2243816} duration={1800} />
              </dd>
            </div>
            <div>
              <dt>UTME registrations in Lagos, the largest state</dt>
              <dd>
                <CountUp to={381814} duration={1600} />
              </dd>
            </div>
            <div>
              <dt>Where we start</dt>
              <dd>SS2 / SS3</dd>
            </div>
          </dl>
        </section>

        {/* ---------- PROBLEM ---------- */}
        <section
          id="problem"
          className={`${s.container} ${s.problem}`}
          aria-labelledby="problem-title"
        >
          <Reveal>
            <p className={s.label}>The problem</p>
            <h2 id="problem-title" className={s.manifesto}>
              Students practise, get a score, and{" "}
              <em>still don’t know what to fix next.</em> The opportunity isn’t
              more practice. It’s better direction and{" "}
              <mark>measurable improvement.</mark>
            </h2>
          </Reveal>
          <ol className={s.problemRow}>
            {problems.map(([title, text], index) => (
              <Reveal as="li" key={title} delay={index * 110}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------- MODULES (BENTO) ---------- */}
        <section
          id="modules"
          className={`${s.container} ${s.modules}`}
          aria-labelledby="modules-title"
        >
          <Reveal className={s.sectionHead}>
            <p className={s.label}>Inside the product</p>
            <h2 id="modules-title">
              Every part is built around <em>your data.</em>
            </h2>
            <p>
              DoLearnn remembers your diagnosed gaps, interventions and
              outcomes, so the next recommendation is based on evidence, not a
              blank chat.
            </p>
          </Reveal>
          <div className={s.bento}>
            <Reveal className={`${s.tile} ${s.t2}`}>
              <p className={s.tileLabel}>Practise</p>
              <h3>Missions built around your gap</h3>
              <div className={s.mission}>
                <b>Probability mission</b>
                <span>8 questions · 15 minutes</span>
                <div className={s.dots} aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <i key={n} className={n < 3 ? s.dotOn : ""} />
                  ))}
                </div>
                <small>3 of 8 done</small>
              </div>
            </Reveal>

            <Reveal className={`${s.tile} ${s.t2}`} delay={100}>
              <p className={s.tileLabel}>Compete</p>
              <h3>Arena: turn practice into a rivalry</h3>
              <div className={s.arena}>
                <div>
                  <span>Ada</span>
                  <strong>7</strong>
                </div>
                <Swords size={22} />
                <div>
                  <strong>5</strong>
                  <span>Tobi</span>
                </div>
              </div>
              <small className={s.tileFoot}>
                1v1 battle · question 12 of 15
              </small>
            </Reveal>

            <Reveal className={`${s.tile} ${s.t2}`} delay={200}>
              <p className={s.tileLabel}>AI Study Coach</p>
              <h3>Free to try. More when you need it.</h3>
              <ul className={s.meter}>
                <li>
                  <span>Free</span>
                  <i style={{ width: "10%" }} />
                  <em>15 / day</em>
                </li>
                <li>
                  <span>Plus</span>
                  <i style={{ width: "55%" }} />
                  <em>150 / day</em>
                </li>
                <li>
                  <span>Pro</span>
                  <i style={{ width: "100%" }} />
                  <em>Unlimited*</em>
                </li>
              </ul>
              <small className={s.tileFoot}>*Fair use applies</small>
            </Reveal>

            <Reveal className={`${s.tile} ${s.t3} ${s.tileDark}`}>
              <p className={s.tileLabel}>Human support</p>
              <h3>A tutor who starts with your data</h3>
              <dl className={s.brief}>
                <div>
                  <dt>Focus topic</dt>
                  <dd>Probability</dd>
                </div>
                <div>
                  <dt>Needs attention</dt>
                  <dd>Counting all possible outcomes</dd>
                </div>
                <div>
                  <dt>Suggested goal</dt>
                  <dd>Build a sample space, then solve alone</dd>
                </div>
              </dl>
              <small className={s.tileFoot}>
                ₦10,000/hr 1-on-1 · ₦5,000 shared · tutors keep 80%
              </small>
            </Reveal>

            <Reveal className={`${s.tile} ${s.t3}`} delay={120}>
              <p className={s.tileLabel}>For schools</p>
              <h3>See which topics the whole class is failing</h3>
              <div className={s.heat} aria-hidden="true">
                {classGrid.flat().map((level, index) => (
                  <i key={index} data-level={level} />
                ))}
              </div>
              <small className={s.tileFoot}>
                Class diagnostics · illustrative data
              </small>
            </Reveal>
          </div>
        </section>

        {/* ---------- ADVANTAGE ---------- */}
        <section
          id="advantage"
          className={`${s.container} ${s.advantage}`}
          aria-labelledby="adv-title"
        >
          <Reveal className={s.sectionHead}>
            <p className={s.label}>Why DoLearnn</p>
            <h2 id="adv-title">
              Others stop at the score. <em>We close the loop.</em>
            </h2>
          </Reveal>
          <Reveal className={s.ladder}>
            <div className={s.ladderHead} aria-hidden="true">
              <span />
              {stages.map((stage) => (
                <b key={stage}>{stage}</b>
              ))}
            </div>
            {ladder.map((row) => (
              <div
                key={row.name}
                className={`${s.ladderRow} ${row.us ? s.ladderUs : ""}`}
              >
                <div className={s.ladderName}>
                  <strong>{row.name}</strong>
                  <small>{row.note}</small>
                </div>
                <div className={s.ladderTrack}>
                  <i
                    style={{
                      gridColumn: `${row.from} / ${row.to + 1}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </Reveal>
          <ul className={s.advList}>
            {advantages.map(([title, text], index) => (
              <Reveal as="li" key={title} delay={index * 90}>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------- AUDIENCES ---------- */}
        <section className={s.audiences} aria-label="Who DoLearnn is for">
          <div className={`${s.container} ${s.audGrid}`}>
            {audiences.map((item, index) => (
              <Reveal
                as="article"
                key={item.id}
                id={item.id}
                delay={index * 110}
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
                    {item.cta} <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <Link className={s.audLink} href={item.href}>
                    {item.cta} <ArrowUpRight size={16} />
                  </Link>
                )}
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- PRICING ---------- */}
        <section
          id="pricing"
          className={`${s.container} ${s.pricing}`}
          aria-labelledby="pricing-title"
        >
          <Reveal className={s.sectionHead}>
            <p className={s.label}>Pricing</p>
            <h2 id="pricing-title">
              Free to start. Cheap to upgrade. <em>Priced for students.</em>
            </h2>
            <p>
              Limits are reached at the moment of need, mid-topic or in exam
              week, which is when an upgrade helps most.
            </p>
          </Reveal>
          <div className={s.planGrid}>
            {plans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 110}>
                <article
                  className={`${s.plan} ${plan.dark ? s.planDark : ""} ${plan.popular ? s.planPopular : ""}`}
                >
                  {plan.popular && (
                    <span className={s.popular}>Most popular</span>
                  )}
                  <h3>{plan.name}</h3>
                  <p className={s.price}>
                    {plan.price} <small>{plan.unit}</small>
                  </p>
                  <p className={s.tagline}>{plan.tagline}</p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} strokeWidth={2.5} /> {feature}
                      </li>
                    ))}
                  </ul>
                </article>
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
              <dd>₦10,000/hour 1-on-1, or ₦5,000 each for a shared hour.</dd>
            </div>
            <div>
              <dt>School packages</dt>
              <dd>₦900,000/year: diagnostics, dashboards, parent reports.</dd>
            </div>
          </Reveal>
        </section>

        {/* ---------- PROOF ---------- */}
        <section
          id="proof"
          className={`${s.container} ${s.proof}`}
          aria-labelledby="proof-title"
        >
          <Reveal className={s.sectionHead}>
            <p className={s.label}>Traction</p>
            <h2 id="proof-title">
              Early demand exists <em>before</em> we’ve scaled.
            </h2>
          </Reveal>
          <ul className={s.bigNumbers}>
            <Reveal as="li">
              <strong>
                <CountUp to={15} />
              </strong>
              <span>students in the free pilot</span>
            </Reveal>
            <Reveal as="li" delay={120}>
              <strong>
                <CountUp to={4} />
              </strong>
              <span>students tutored</span>
            </Reveal>
            <Reveal as="li" delay={240}>
              <strong>
                <CountUp to={2} />
              </strong>
              <span>
                schools in conversation: Temperance College and Divine Grace
                Private School
              </span>
            </Reveal>
          </ul>
        </section>

        {/* ---------- TEAM ---------- */}
        <section
          id="team"
          className={`${s.container} ${s.team}`}
          aria-labelledby="team-title"
        >
          <Reveal className={s.sectionHead}>
            <p className={s.label}>The team</p>
            <h2 id="team-title">
              Engineering, product, teaching and finance, <em>in one team.</em>
            </h2>
          </Reveal>
          <ul className={s.teamGrid}>
            {team.map((member, index) => (
              <Reveal as="li" key={member.name} delay={index * 80}>
                <Image
                  className={s.teamPhoto}
                  src={member.image}
                  alt={member.name}
                  width={144}
                  height={144}
                  sizes="144px"
                />
                <h3>{member.name}</h3>
                <small>{member.role}</small>
                {/* <p>{member.bg}</p> */}
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---------- GOALS ---------- */}
        <section className={s.goals} aria-labelledby="goals-title">
          <div className={s.container}>
            <Reveal className={s.sectionHead}>
              <p className={s.labelLight}>Year 1 goals</p>
              <h2 id="goals-title">
                Free diagnosis for every learner.{" "}
                <em>Real income for tutors.</em>
              </h2>
            </Reveal>
            <ul className={s.goalList}>
              <Reveal as="li">
                <strong>
                  <CountUp to={5000} suffix="+" />
                </strong>
                <span>learners get a free topic diagnosis</span>
              </Reveal>
              <Reveal as="li" delay={120}>
                <strong>
                  <CountUp to={50} />
                </strong>
                <span>planned jobs and income opportunities</span>
              </Reveal>
              <Reveal as="li" delay={240}>
                <strong>Class-level</strong>
                <span>insight into where students struggle</span>
              </Reveal>
            </ul>
            <p className={s.fine}>These are goals, not results to date.</p>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
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

        {/* ---------- CTA ---------- */}
        <section className={s.finalCta}>
          <div className={s.container}>
            <h2>
              Stop guessing what to study <em>next.</em>
            </h2>
            <div className={s.actions}>
              <Link href="/practice" className={s.ctaButton}>
                Start with free practice <ArrowUpRight size={19} />
              </Link>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={s.ctaLink}
              >
                Talk to the DoLearnn team <ArrowUpRight size={16} />
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
              <a href="#loop">The loop</a>
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
            <StudioNewsletter />
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
