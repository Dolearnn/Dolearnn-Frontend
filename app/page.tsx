import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  ScanSearch,
  Swords,
  Target,
  UserRoundCheck,
} from "lucide-react";
import { PitchNav, PitchNewsletter } from "@/components/Home/PitchNav";
import s from "./pitch.module.css";

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

const topics = [
  { name: "Algebra", score: 84 },
  { name: "Trigonometry", score: 68 },
  { name: "Calculus", score: 43 },
  { name: "Probability", score: 31 },
];

const problems = [
  {
    title: "Weak diagnosis",
    text: "Scores rarely tell the learner which topics are causing the problem.",
  },
  {
    title: "Generic support",
    text: "Families often buy help before understanding the exact learning gap.",
  },
  {
    title: "No proof loop",
    text: "Most tutoring outcomes are never measured with a structured reassessment.",
  },
];

const steps = [
  { name: "Assess", text: "Exam or diagnostic", icon: ClipboardCheck },
  { name: "Diagnose", text: "Rank topic-level gaps", icon: ScanSearch },
  { name: "Practise", text: "AI-generated targeted missions", icon: Target },
  { name: "Compete", text: "Arena challenges + peer practice", icon: Swords },
  {
    name: "Get support",
    text: "AI Study Coach + human tutor",
    icon: UserRoundCheck,
  },
  {
    name: "Reassess",
    text: "Measure progress + update profile",
    icon: LineChart,
  },
];

const alternatives = [
  { name: "Free CBT apps", text: "Practice + scores" },
  { name: "Exam-prep sites", text: "Content + past questions" },
  { name: "Video lessons", text: "Lessons + practice" },
  { name: "Tutor marketplaces", text: "Find a tutor" },
  { name: "AI workspaces", text: "Quizzes, summaries & games" },
  { name: "1-on-1 tutoring", text: "Human help, no diagnosis" },
];

const advantages = [
  {
    title: "Diagnostic intelligence",
    text: "Assessment results become a ranked map of the learner’s weakest topics.",
  },
  {
    title: "Context-aware AI",
    text: "AI support uses the learner’s diagnosis, attempts and progress history.",
  },
  {
    title: "Human escalation",
    text: "A matched tutor receives context on where the learner is struggling.",
  },
  {
    title: "Reassessment + proof",
    text: "The learner is tested again so the intervention can be measured.",
  },
];

const audiences = [
  {
    id: "students",
    label: "For students",
    title: "Know exactly what to fix next.",
    text: "SS2 / SS3 students and recent school leavers preparing for WAEC and UTME. Start with Mathematics and selected high-demand subjects.",
    href: "/practice",
    cta: "Try a free warm-up",
  },
  {
    id: "parents",
    label: "For parents",
    title: "Understand before you pay for help.",
    text: "See where your child needs support, why a tutor is recommended and how topic results change. Pro plans include a parent progress report.",
    href: "/register",
    cta: "Start a family account",
  },
  {
    id: "schools",
    label: "For schools",
    title: "See where a whole class struggles.",
    text: "Class-wide diagnostics, progress dashboards, parent reporting and competition hosting for schools.",
    href: trial,
    cta: "Ask about a school pilot",
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
    role: "Founder and CEO",
    tag: "Software engineer, Accion Microfinance Bank",
    text: "400 Level Systems Engineering student at the University of Lagos. Brings production engineering, regulated finance exposure and compliance-aware thinking.",
  },
  {
    name: "Peter Opeyemi",
    role: "Co-Founder and CTO",
    tag: "Senior product engineer, EventPadi",
    text: "Scaled product engineering experience from a platform serving more than 100,000 ticket buyers and 4,000 events.",
  },
  {
    name: "Samuel Abdulkareem",
    role: "Head of Product",
    tag: "Qoray Mobility and Energies",
    text: "Leads product strategy and partnerships, with a sustainable-finance perspective on how the product grows.",
  },
  {
    name: "Israel Adedokun",
    role: "Finance and Strategy",
    tag: "Financial advisor, Andersen",
    text: "Manages budgets, pricing and unit economics.",
  },
  {
    name: "Dolapo Abraham",
    role: "Academic Director",
    tag: "Mechanical Engineering graduate, University of Lagos",
    text: "Top 10 of his class (2025/2026) with 4 years of teaching experience and strong academic quality control.",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

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
    a: "Tutoring is ₦10,000 per hour one-on-one, or ₦5,000 each for a shared hour, matched to your diagnosed gaps. Booking, payment and progress stay in the app.",
  },
];

export default function Home() {
  return (
    <div className={s.landing} id="top">
      <a href="#main-content" className={s.skipLink}>
        Skip to content
      </a>
      <PitchNav />
      <main id="main-content">
        <section
          className={`${s.container} ${s.hero}`}
          aria-labelledby="hero-title"
        >
          <div className={s.heroCopy}>
            <p className={s.badge}>FOR WAEC + UTME STUDENTS</p>
            <h1 id="hero-title">
              Diagnose the weakness.
              <br />
              Match the right support.
              <br />
              <span>Prove the improvement.</span>
            </h1>
            <p className={s.lead}>
              DoLearnn is a data-driven learning platform that combines
              diagnosis, targeted practice, AI and human support, and
              reassessment inside one measurable loop.
            </p>
            <div className={s.actions}>
              <Link className={s.primaryButton} href="/practice">
                Try free Mathematics practice <ArrowUpRight size={19} />
              </Link>
              <a className={s.textLink} href="#how">
                See how it works <ArrowDown size={16} />
              </a>
            </div>
            <div className={s.loopChips} aria-label="The DoLearnn loop">
              <span className={s.chipNavy}>ASSESS</span>
              <span className={s.chipBlue}>SUPPORT</span>
              <span className={s.chipGreen}>REASSESS</span>
              <em>Lagos first. Nigeria next.</em>
            </div>
          </div>

          <div className={s.heroVisual}>
            <div className={s.reportCard}>
              <div className={s.reportTop}>
                <span>
                  <b className={s.miniMark}>D</b> Diagnostic / Mathematics
                </span>
                <span className={s.example}>EXAMPLE</span>
              </div>
              <h2>More than a score.</h2>
              <div className={s.topicList}>
                {topics.map((topic) => (
                  <div
                    key={topic.name}
                    className={`${s.topicRow} ${topic.score < 40 ? s.weak : ""}`}
                  >
                    <div>
                      <span>{topic.name}</span>
                      <strong>{topic.score}%</strong>
                    </div>
                    <div className={s.track}>
                      <i style={{ width: `${topic.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className={s.nextMove}>
                <Target size={20} />
                <p>
                  <strong>Start with probability.</strong> Your weakest topic
                  becomes a focused practice mission.
                </p>
              </div>
            </div>
            <p className={s.note}>
              Illustrative example. Scores are not learner outcomes.
            </p>
          </div>
        </section>

        <section className={s.statBand} aria-label="Market context">
          <div className={`${s.container} ${s.statGrid}`}>
            <div>
              <strong>2,243,816</strong>
              <span>UTME registrations in 2026 (JAMB)</span>
            </div>
            <div>
              <strong>381,814</strong>
              <span>UTME registrations in Lagos, the largest single state</span>
            </div>
            <div>
              <strong>SS2 / SS3</strong>
              <span>Primary learners, plus recent school leavers</span>
            </div>
          </div>
        </section>

        <section
          id="problem"
          className={`${s.container} ${s.section}`}
          aria-labelledby="problem-title"
        >
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>THE PROBLEM</p>
            <h2 id="problem-title">
              Students practise, get a score and still don’t know what to fix
              next.
            </h2>
            <p>
              Exam preparation is a large market, but the experience is
              fragmented for students, parents and schools.
            </p>
          </div>
          <div className={s.problemGrid}>
            {problems.map((item, index) => (
              <article key={item.title} className={s.problemCard}>
                <span className={s.num}>{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className={s.pullQuote}>
            The opportunity is not more practice. It is better direction and
            measurable improvement.
          </p>
        </section>

        <section
          id="how"
          className={s.howSection}
          aria-labelledby="how-title"
        >
          <div className={s.container}>
            <div className={s.sectionHead}>
              <p className={s.eyebrow}>HOW IT WORKS</p>
              <h2 id="how-title">
                We turn assessment data into the right support, then prove it
                worked.
              </h2>
              <p>
                DoLearnn remembers your diagnosed gaps, interventions and
                outcomes, so the next recommendation is based on evidence, not
                a blank chat.
              </p>
            </div>
            <ol className={s.steps}>
              {steps.map((step, index) => (
                <li
                  key={step.name}
                  className={index === steps.length - 1 ? s.stepLast : ""}
                >
                  <span className={s.stepNum}>{index + 1}</span>
                  <step.icon size={26} strokeWidth={1.6} />
                  <strong>{step.name}</strong>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <p className={s.banner}>
              AI is part of the intervention, not the moat: every action starts
              with evidence and ends with reassessment.
            </p>
          </div>
        </section>

        <section
          id="advantage"
          className={`${s.container} ${s.section}`}
          aria-labelledby="advantage-title"
        >
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>WHY DOLEARNN</p>
            <h2 id="advantage-title">
              Others offer practice, content or AI. We close the loop to
              measured outcomes.
            </h2>
            <p>
              The difference isn’t “we also have AI.” It’s diagnosis-led
              support, human escalation when needed, and reassessment that
              shows whether learning improved.
            </p>
          </div>
          <ul className={s.altList} aria-label="Typical alternatives">
            {alternatives.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.text}</span>
              </li>
            ))}
            <li className={s.altUs}>
              <strong>DoLearnn</strong>
              <span>Diagnosis + AI/human support + proof</span>
            </li>
          </ul>
          <div className={s.advGrid}>
            {advantages.map((item, index) => (
              <article
                key={item.title}
                className={index === advantages.length - 1 ? s.advLast : ""}
              >
                <span className={s.num}>{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <p className={s.banner}>
            Our advantage is the outcome data linking weakness → intervention →
            measurable improvement.
          </p>
        </section>

        <section className={s.audienceSection} aria-label="Who DoLearnn is for">
          <div className={`${s.container} ${s.audienceGrid}`}>
            {audiences.map((item) => (
              <article key={item.id} id={item.id}>
                <p className={s.eyebrow}>{item.label.toUpperCase()}</p>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                {item.external ? (
                  <a
                    className={s.textLink}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.cta} <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <Link className={s.textLink} href={item.href}>
                    {item.cta} <ArrowUpRight size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className={`${s.container} ${s.section}`}
          aria-labelledby="pricing-title"
        >
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>PRICING</p>
            <h2 id="pricing-title">
              Free to start. Cheap to upgrade. Priced for students.
            </h2>
            <p>
              Every learner gets real value for free. Limits are reached at the
              moment of need, mid-topic or in exam week, which is when an
              upgrade helps most.
            </p>
          </div>
          <div className={s.planGrid}>
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`${s.plan} ${plan.popular ? s.planPopular : ""}`}
              >
                {plan.popular && <span className={s.popular}>MOST POPULAR</span>}
                <p className={s.planName}>{plan.name.toUpperCase()}</p>
                <p className={s.price}>
                  {plan.price} <small>{plan.unit}</small>
                </p>
                <p className={s.tagline}>{plan.tagline}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} /> {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className={s.extras}>
            <p>
              <strong>Exam Season Pass:</strong> ₦12,000 for 3 months of Pro,
              timed to WAEC and UTME windows.
            </p>
            <p>
              <strong>Targeted tutoring:</strong> ₦10,000/hour one-on-one, or
              ₦5,000 each for a shared hour, matched to your diagnosed gaps.
            </p>
            <p>
              <strong>School packages:</strong> ₦900,000/year for class-wide
              diagnostics, dashboards, parent reporting and competition hosting.
            </p>
          </div>
          <p className={s.banner}>
            Upgrades happen inside the learning loop: Free → Plus when limits
            bite, Plus → Pro near exams, Pro → tutor when AI is not enough.
          </p>
        </section>

        <section
          id="traction"
          className={s.tractionSection}
          aria-labelledby="traction-title"
        >
          <div className={`${s.container} ${s.tractionGrid}`}>
            <div>
              <p className={s.eyebrow}>TRACTION</p>
              <h2 id="traction-title">
                Early demand already exists, before scale.
              </h2>
              <p>
                A free pilot tested the diagnose → practise loop, students have
                been tutored, and schools want pilots.
              </p>
            </div>
            <div className={s.tractionStats}>
              <div>
                <strong>15</strong>
                <span>students in free pilot</span>
              </div>
              <div>
                <strong>4</strong>
                <span>students tutored</span>
              </div>
              <div>
                <strong>2</strong>
                <span>school conversations</span>
              </div>
            </div>
            <div className={s.schoolsBox}>
              <p className={s.eyebrow}>SCHOOLS THAT HAVE EXPRESSED INTEREST</p>
              <ul>
                <li>Temperance College</li>
                <li>Divine Grace Private School</li>
              </ul>
              <span>
                Interest in school-based diagnostics and learning-support
                pilots.
              </span>
            </div>
          </div>
        </section>

        <section
          id="team"
          className={`${s.container} ${s.section}`}
          aria-labelledby="team-title"
        >
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>THE TEAM</p>
            <h2 id="team-title">
              An operator team across engineering, product, learning and
              finance.
            </h2>
            <p>
              Production engineering, product execution, academic quality and
              financial discipline in one team.
            </p>
          </div>
          <div className={s.teamGrid}>
            {team.map((member) => (
              <article key={member.name} className={s.member}>
                <span className={s.avatar} aria-hidden="true">
                  {initials(member.name)}
                </span>
                <div>
                  <h3>{member.name}</h3>
                  <p className={s.role}>{member.role}</p>
                  <p className={s.tag}>{member.tag}</p>
                  <p>{member.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={s.impactSection} aria-labelledby="impact-title">
          <div className={s.container}>
            <div className={s.sectionHead}>
              <p className={s.eyebrow}>OUR IMPACT GOALS</p>
              <h2 id="impact-title">
                Free diagnosis for every learner. Real income for tutors.
              </h2>
              <p>
                We measure impact the way we measure learning: assess,
                intervene, reassess and report. These are Year 1 goals, not
                results to date.
              </p>
            </div>
            <div className={s.impactGrid}>
              <article>
                <GraduationCap size={26} strokeWidth={1.6} />
                <strong>5,000+</strong>
                <h3>learners with free topic diagnosis</h3>
                <p>
                  The free tier means no student is priced out of knowing their
                  gaps, and progress is proven by reassessment, not assumed.
                </p>
              </article>
              <article>
                <UserRoundCheck size={26} strokeWidth={1.6} />
                <strong>50</strong>
                <h3>planned jobs and income opportunities</h3>
                <p>
                  Full-time hires, 25 part-time tutors who keep 80% of every
                  hour booked, and 20 paid student ambassadors across Lagos.
                </p>
              </article>
              <article>
                <LineChart size={26} strokeWidth={1.6} />
                <strong>Class-level</strong>
                <h3>insight into where students struggle</h3>
                <p>
                  Teachers see which topics a whole class is failing, and
                  parents get clear progress reports.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section
          id="questions"
          className={`${s.container} ${s.faqSection}`}
          aria-labelledby="questions-title"
        >
          <div>
            <p className={s.eyebrow}>QUESTIONS</p>
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

        <section className={s.finalCta}>
          <div className={s.container}>
            <p className={s.eyebrow}>DIAGNOSE · SUPPORT · PROVE</p>
            <h2>You don’t have to guess what to work on next.</h2>
            <div className={s.actions}>
              <Link href="/practice" className={s.mintButton}>
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
