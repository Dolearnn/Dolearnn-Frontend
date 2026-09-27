import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CornerDownRight,
  Target,
} from "lucide-react";
import {
  ArenaPreview,
  LearningLoop,
  LandingNav,
  Newsletter,
} from "@/components/Home/LearningExperience";
import s from "./landing.module.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--landing-display",
  display: "swap",
});
const body = Manrope({
  subsets: ["latin"],
  variable: "--landing-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoLearnn — Know your gaps. Make your next move.",
  description:
    "One connected learning system for Nigerian students preparing for external examinations. Find your gaps, practise with purpose, compete, get teacher support and track your progress.",
  openGraph: {
    title: "DoLearnn — Know your gaps. Make your next move.",
    description:
      "Assessment, AI-guided practice, Arena and qualified tutors. Connected around your progress.",
    images: ["/logo.png"],
  },
};

const topics = [
  { name: "Algebra", score: 84 },
  { name: "Trigonometry", score: 68 },
  { name: "Calculus", score: 43 },
  { name: "Probability", score: 31 },
];
const whatsapp = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2349057638887").replace(/\D/g, "")}?text=${encodeURIComponent("Hi DoLearnn! I would like to know more about learning and tutor support.")}`;
const trial =
  process.env.NEXT_PUBLIC_TRIAL_FORM_URL ??
  "https://forms.gle/SYjkRgS1Y5JoD43v7";

export default function Home() {
  return (
    <div
      className={`${s.landing} ${display.variable} ${body.variable}`}
      id="top"
    >
      <a href="#main-content" className={s.skipLink}>
        Skip to content
      </a>
      <LandingNav />
      <main id="main-content">
        <section
          className={`${s.container} ${s.hero}`}
          aria-labelledby="hero-title"
        >
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>
              <span className={s.statusDot} /> YOUR NEXT CHAPTER STARTS HERE
            </p>
            <h1 id="hero-title">
              Know your gaps.
              <br />
              Make your <br />
              <span>next move.</span>
            </h1>
            <p className={s.heroDescription}>
              Find what needs work. Practise with a plan. Challenge a friend.
              Get a teacher when you need one.
            </p>
            <p className={s.heroDefinition}>
              DoLearnn connects assessment, AI-guided practice, competition and
              tutoring — so you can see what’s improving.
            </p>
            <div className={s.actions}>
              <Link className={s.primaryButton} href="/practice">
                Try free Mathematics practice <ArrowUpRight size={19} />
              </Link>
              <a className={s.textLink} href="#learning-loop">
                See how it connects <ArrowDown size={16} />
              </a>
            </div>
            <p className={s.heroAudience}>
              For Nigerian SS2 / SS3 students & recent school leavers.
              <br />
              Built around your external examination goals.
            </p>
          </div>
          <div className={s.heroVisual}>
            <div className={s.visualHeading}>
              <span>YOUR LEARNING, CONNECTED</span>
              <span>01 → 06</span>
            </div>
            <div className={s.resultSheet}>
              <div className={s.sheetTop}>
                <span>
                  <span className={s.miniMark}>d.</span> DoLearnn Practice
                </span>
                <span className={s.exampleLabel}>EXAMPLE</span>
              </div>
              <div className={s.sheetTitle}>
                <div>
                  <p className={s.smallLabel}>DIAGNOSTIC / MATHEMATICS</p>
                  <h2>More than a score.</h2>
                </div>
                <Target size={29} strokeWidth={1.4} />
              </div>
              <div className={s.topicList}>
                {topics.map((topic) => (
                  <div
                    key={topic.name}
                    className={`${s.topicRow} ${topic.name === "Probability" ? s.weakTopic : ""}`}
                  >
                    <div>
                      <span>{topic.name}</span>
                      <strong>
                        {topic.score}
                        <small>%</small>
                      </strong>
                    </div>
                    <div className={s.barTrack}>
                      <span style={{ width: `${topic.score}%` }} />
                    </div>
                    {topic.name === "Probability" && (
                      <p>
                        <CornerDownRight size={13} /> Your next focus
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className={s.diagnosis}>
                <span className={s.diagnosisIcon}>
                  <Target size={18} />
                </span>
                <p>
                  <strong>Start with probability.</strong>
                  <br />
                  Work on counting possible outcomes before moving to combined
                  events.
                </p>
              </div>
            </div>
            <div className={s.missionConnector}>
              <ArrowDown size={18} />
              <span>INSIGHT BECOMES ACTION</span>
            </div>
            <a className={s.missionStrip} href="#learning-loop">
              <div>
                <p className={s.smallLabel}>
                  YOUR NEXT MOVE / PERSONALISED MISSION
                </p>
                <h3>Let’s work on probability.</h3>
                <p>
                  8 questions <span>·</span> 15 minutes <span>·</span> One clear
                  focus
                </p>
              </div>
              <ArrowUpRight size={26} />
            </a>
            <p className={s.exampleNote}>
              Illustrative learning journey. Scores are examples, not learner
              outcomes.
            </p>
          </div>
        </section>
        <div className={s.focusStrip}>
          <div className={s.container}>
            <span>FOCUSED FROM DAY ONE</span>
            <strong>EXAM-ALIGNED</strong>
            <span className={s.stripDivider} />
            <p>
              Mathematics first. Selected high-demand subjects alongside it.
            </p>
          </div>
        </div>
        <section
          id="learning-loop"
          className={`${s.container} ${s.section}`}
          aria-labelledby="loop-title"
        >
          <div className={s.sectionIntro}>
            <div>
              <p className={s.eyebrow}>01 / THE DOLEARNN WAY</p>
              <h2 id="loop-title">
                A score is a starting point.
                <br />
                <span>Not the end of the story.</span>
              </h2>
            </div>
            <p>
              Finishing a quiz shouldn’t leave you wondering what to do next.
              Each part of DoLearnn helps you take the next useful step.
            </p>
          </div>
          <LearningLoop />
          <div className={s.connectedModules}>
            <p>
              FOUR PARTS.
              <br />
              <strong>ONE LEARNING SYSTEM.</strong>
            </p>
            <span>
              Practice <ArrowRight size={15} />
            </span>
            <span>
              AI <ArrowRight size={15} />
            </span>
            <span>
              Arena <ArrowRight size={15} />
            </span>
            <span>
              Tutors <span aria-hidden="true">↺</span>
            </span>
          </div>
        </section>
        <section
          id="practice"
          className={s.practiceSection}
          aria-labelledby="practice-title"
        >
          <div className={`${s.container} ${s.practiceGrid}`}>
            <div>
              <p className={s.eyebrow}>02 / PRACTICE + AI</p>
              <h2 id="practice-title">
                Less “try again.”
                <br />
                More “here’s why.”
              </h2>
              <p className={s.sectionBody}>
                Your mistakes should help you learn. DoLearnn AI uses your
                results to explain gaps, guide practice and recommend a focused
                study plan.
              </p>
              <p className={s.sectionBody}>
                A mission gives you a manageable next step. An explanation helps
                you understand it. Your next attempt tells us what support you
                need.
              </p>
              <a href="#arena" className={s.textLink}>
                Put your practice to the test <ArrowRight size={17} />
              </a>
            </div>
            <div className={s.workedExample}>
              <div className={s.exampleHeader}>
                <span>INSIDE A PROBABILITY MISSION</span>
                <span>EXAMPLE</span>
              </div>
              <p className={s.question}>
                A bag holds 3 green counters and 2 white counters. What is the
                probability of picking green?
              </p>
              <div className={s.answerReview}>
                <span>
                  Your answer <s>3/2</s>
                </span>
                <span>
                  Let’s work through it <CornerDownRight size={17} />
                </span>
              </div>
              <div className={s.coachExplanation}>
                <span className={s.smallLabel}>
                  DOLEARNN AI / EXPLAIN THE MISTAKE
                </span>
                <p>
                  You counted the green counters correctly. The denominator
                  needs <strong>all possible outcomes</strong>, including the
                  green ones.
                </p>
                <div className={s.equation}>
                  <span>3 green</span>
                  <span>÷</span>
                  <span>5 total</span>
                  <span>=</span>
                  <strong>3/5</strong>
                </div>
                <p className={s.coachPrompt}>
                  Next, practise identifying the total number of outcomes.
                </p>
              </div>
            </div>
            <div className={s.aiRule}>
              <p>
                <strong>AI recommends.</strong> The platform verifies. Teachers
                decide.
              </p>
              <span>
                Explanations and suggestions support learning. Teachers use
                their judgement to shape the lesson.
              </span>
            </div>
          </div>
        </section>
        <section
          id="arena"
          className={s.arenaSection}
          aria-labelledby="arena-title"
        >
          <div className={`${s.container} ${s.arenaGrid}`}>
            <div className={s.arenaCopy}>
              <p className={s.eyebrow}>03 / DOLEARNN ARENA</p>
              <h2 id="arena-title">
                A little rivalry.
                <br />
                <span>A lot of practice.</span>
              </h2>
              <p>
                Take what you’ve been working on into a 1v1 battle. Challenge a
                friend, test your understanding and give yourself a reason to
                come back.
              </p>
              <div className={s.arenaPrinciple}>
                <span>01</span>
                <p>
                  <strong>Every answer is a learning signal.</strong>Missed a
                  topic? That result can guide your next mission, AI explanation
                  or tutor recommendation.
                </p>
              </div>
              <Link href="/family/arena" className={s.mintButton}>
                Enter the Arena <ArrowUpRight size={18} />
              </Link>
              <p className={s.signInNote}>
                Sign in to create or join a battle.
              </p>
              <div className={s.arenaRoadmap}>
                <span>
                  <strong>START HERE</strong>1v1 battles
                </span>
                <ArrowRight size={17} />
                <span>
                  <strong>PLANNED</strong>Teams & tournaments
                </span>
              </div>
            </div>
            <ArenaPreview />
          </div>
        </section>
        <section
          id="tutors"
          className={`${s.container} ${s.section} ${s.tutorSection}`}
          aria-labelledby="tutor-title"
        >
          <div className={s.tutorBrief}>
            <div className={s.briefTop}>
              <span className={s.smallLabel}>DOLEARNN TUTORS</span>
              <span className={s.exampleLabel}>EXAMPLE BRIEF</span>
            </div>
            <h3>
              A useful starting point.
              <br />
              Before the lesson starts.
            </h3>
            <dl>
              <div>
                <dt>Focus topic</dt>
                <dd>Probability</dd>
              </div>
              <div>
                <dt>Learning signals</dt>
                <dd>Assessment + Arena answers</dd>
              </div>
              <div>
                <dt>Needs attention</dt>
                <dd>Counting outcomes in combined events</dd>
              </div>
              <div>
                <dt>Suggested lesson goal</dt>
                <dd>Build a sample space, then solve independently</dd>
              </div>
            </dl>
            <div className={s.teacherNote}>
              <span className={s.miniMark}>AI</span>
              <p>
                AI-assisted learning summary.
                <br />
                <strong>The teacher sets the lesson direction.</strong>
              </p>
            </div>
            <div className={s.briefFooter}>
              <Check size={17} /> Next: a comparable reassessment
            </div>
          </div>
          <div>
            <p className={s.eyebrow}>04 / THE HUMAN PART</p>
            <h2 id="tutor-title">
              When it still <br />
              doesn’t click,
              <br />
              <span>bring in a teacher.</span>
            </h2>
            <p className={s.sectionBody}>
              Sometimes another set of questions isn’t the answer. When a topic
              keeps causing difficulty, get targeted help from a qualified
              teacher.
            </p>
            <p className={s.sectionBody}>
              Your learning history gives the teacher context. The lesson
              tackles the gap. A later assessment helps show what changed.
            </p>
            <ol className={s.tutorFlow}>
              <li>Identify the gap</li>
              <li>Match a tutor</li>
              <li>Learn together</li>
              <li>Reassess</li>
            </ol>
            <a
              href={trial}
              target="_blank"
              rel="noreferrer"
              className={s.textLink}
            >
              Talk to us about tutor support <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
        <section
          id="progress"
          className={s.progressSection}
          aria-labelledby="progress-title"
        >
          <div className={s.container}>
            <div className={s.sectionIntro}>
              <div>
                <p className={s.eyebrow}>05 / CLOSE THE LOOP</p>
                <h2 id="progress-title">
                  Put your progress
                  <br />
                  <span>where you can see it.</span>
                </h2>
              </div>
              <p>
                More questions answered is one thing. Better understanding is
                another. Revisit the same topic with a comparable assessment to
                see what’s changed — and what still needs work.
              </p>
            </div>
            <div className={s.progressReport}>
              <div className={s.reportHeading}>
                <div>
                  <p className={s.smallLabel}>TOPIC PROGRESS / MATHEMATICS</p>
                  <h3>Probability</h3>
                </div>
                <span className={s.exampleLabel}>ILLUSTRATIVE REPORT</span>
              </div>
              <div className={s.progressComparison}>
                <div>
                  <span>FIRST ASSESSMENT</span>
                  <strong>
                    31<small>%</small>
                  </strong>
                  <div className={s.progressTrack}>
                    <i style={{ width: "31%" }} />
                  </div>
                </div>
                <div className={s.progressIntervention}>
                  <span>Targeted practice</span>
                  <span>AI explanations</span>
                  <span>Teacher support</span>
                  <ArrowRight size={24} />
                </div>
                <div>
                  <span>COMPARABLE REASSESSMENT</span>
                  <strong>
                    62<small>%</small>
                    <ArrowUpRight size={30} />
                  </strong>
                  <div className={s.progressTrack}>
                    <i style={{ width: "62%" }} />
                  </div>
                </div>
              </div>
              <div className={s.reportConclusion}>
                <p>
                  <Check size={17} /> Stronger on simple probability.
                </p>
                <p>
                  <CornerDownRight size={17} /> Next focus: combined events.
                </p>
              </div>
              <p className={s.exampleNote}>
                Example only, not a measured DoLearnn result or a promise of
                improvement.
              </p>
            </div>
            <div className={s.audienceGrid}>
              <div id="students">
                <p className={s.eyebrow}>FOR STUDENTS</p>
                <h3>Own your next move.</h3>
                <p>
                  Know today’s focus, work through a mission and challenge a
                  friend. Build XP, levels and milestones around meaningful
                  learning — with progress beyond a leaderboard.
                </p>
                <Link href="/practice" className={s.textLink}>
                  Try a Mathematics warm-up <ArrowUpRight size={16} />
                </Link>
              </div>
              <div id="parents">
                <p className={s.eyebrow}>FOR PARENTS</p>
                <h3>See more than study time.</h3>
                <p>
                  Understand where your child needs help, why a tutor is
                  recommended and how their topic results change. Learning
                  history and teacher feedback make the next conversation more
                  useful.
                </p>
                <Link href="/register" className={s.textLink}>
                  Start a family account <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section
          id="questions"
          className={`${s.container} ${s.faqSection}`}
          aria-labelledby="questions-title"
        >
          <div>
            <p className={s.eyebrow}>A FEW USEFUL ANSWERS</p>
            <h2 id="questions-title">
              Before you <br />
              make a move.
            </h2>
          </div>
          <div className={s.faqList}>
            <details>
              <summary>
                Who is DoLearnn built for?<span>+</span>
              </summary>
              <p>
                Our first focus is Nigerian SS2 and SS3 students and recent
                school leavers preparing for external examinations including WAEC, NECO and JAMB. We’re starting with
                Mathematics and selected high-demand subjects. Parents can use a
                family account to support their child’s learning.
              </p>
            </details>
            <details>
              <summary>
                How is this different from a quiz app?<span>+</span>
              </summary>
              <p>
                The score starts a connected journey: identify topic gaps,
                practise with AI guidance, compete in Arena, get a teacher’s
                help when needed, then reassess. Your results inform what you do
                next.
              </p>
            </details>
            <details>
              <summary>
                Does AI replace the teacher?<span>+</span>
              </summary>
              <p>
                No. AI helps explain mistakes, recommend practice and summarise
                learning needs. The platform verifies results and teachers
                decide how to teach. Official competitions use reviewed
                questions, rather than unreviewed questions generated live by
                AI.
              </p>
            </details>
            <details>
              <summary>
                Can I start with tutoring?<span>+</span>
              </summary>
              <p>
                Yes. You can{" "}
                <a href={trial} target="_blank" rel="noreferrer">
                  request tutor support
                </a>
                . Tutoring is part of the learning system: identify what needs
                attention, work with a qualified teacher, then check
                understanding again.
              </p>
            </details>
            <details>
              <summary>
                Are teams and tournaments available?<span>+</span>
              </summary>
              <p>
                Arena starts with 1v1 battles. Team battles and tournaments are
                planned for later, with school and sponsor-supported
                competitions part of the longer-term direction.
              </p>
            </details>
          </div>
        </section>
        <section className={s.finalCta}>
          <div className={s.container}>
            <p className={s.eyebrow}>YOUR GOAL. YOUR NEXT MOVE.</p>
            <h2>
              You don’t have to guess <br />
              what to work on next.
            </h2>
            <div className={s.actions}>
              <Link href="/practice" className={s.primaryButton}>
                Start with free practice <ArrowUpRight size={20} />
              </Link>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className={s.textLink}
              >
                Talk to the DoLearnn team <ArrowUpRight size={17} />
              </a>
            </div>
            <p>Find the gap. Get the right support. See what changes.</p>
          </div>
        </section>
      </main>
      <footer className={s.footer}>
        <div className={s.container}>
          <div className={s.footerTop}>
            <div>
              <a href="#top" className={s.wordmark}>
                do<span>learnn</span>
                <span className={s.brandPeriod}>.</span>
              </a>
              <p>
                A clearer next step.
                <br />A learning journey that connects.
              </p>
            </div>
              <nav aria-label="Footer learning links">
                <strong>Explore</strong>
                <Link href="/practice">Try practice</Link>
                <a href="#learning-loop">The learning loop</a>
              <a href="#arena">Arena</a>
              <a href="#tutors">Tutor support</a>
              <a href="#parents">For parents</a>
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
            <Newsletter />
          </div>
          <div className={s.footerBottom}>
            <span>
              © {new Date().getFullYear()} DoLearnn. All rights reserved.
            </span>
            <span>Built around learning. Measured by progress.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
