'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Target,
  X,
} from 'lucide-react';
import { getAuthUser } from '@/lib/api/auth-storage';
import styles from '@/app/practice/practice.module.css';

type Question = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

const STORAGE_KEY = 'dolearn.guest-practice.v1';

const questions: Question[] = [
  {
    id: 'algebra-equation',
    topic: 'Algebra',
    prompt: 'Solve for x: 3x − 7 = 2x + 5.',
    options: ['2', '12', '−2', '5'],
    answer: 1,
    explanation: 'Subtract 2x from both sides: x − 7 = 5. Add 7, so x = 12.',
  },
  {
    id: 'number-standard-form',
    topic: 'Number & Numeration',
    prompt: 'Express 0.000345 in standard form.',
    options: ['3.45 × 10⁻³', '3.45 × 10⁻⁴', '3.45 × 10⁻⁵', '3.45 × 10⁴'],
    answer: 1,
    explanation: 'Move the decimal point four places to the right: 3.45 × 10⁻⁴.',
  },
  {
    id: 'geometry-hexagon',
    topic: 'Geometry',
    prompt: 'Each interior angle of a regular hexagon is:',
    options: ['60°', '108°', '120°', '135°'],
    answer: 2,
    explanation: 'For a regular polygon, each interior angle is (n − 2) × 180° ÷ n. For n = 6, the answer is 120°.',
  },
  {
    id: 'trigonometry-values',
    topic: 'Trigonometry',
    prompt: 'Evaluate sin 30° + cos 60°.',
    options: ['0.5', '1', '√3/2', '√3'],
    answer: 1,
    explanation: 'sin 30° = 0.5 and cos 60° = 0.5. Their sum is 1.',
  },
  {
    id: 'probability-die',
    topic: 'Probability',
    prompt: 'A fair die is thrown once. What is the probability of getting a prime number?',
    options: ['1/6', '1/3', '1/2', '2/3'],
    answer: 2,
    explanation: 'The prime numbers on a die are 2, 3 and 5. That is 3 favourable outcomes out of 6, or 1/2.',
  },
  {
    id: 'calculus-differentiate',
    topic: 'Calculus',
    prompt: 'Differentiate y = 3x² + 5x − 2 with respect to x.',
    options: ['6x + 5', '3x + 5', '6x² + 5', '6x − 2'],
    answer: 0,
    explanation: 'Differentiate each term: 3x² becomes 6x, 5x becomes 5, and the constant becomes 0.',
  },
];

type SavedPractice = {
  answers: Record<string, number>;
  index: number;
  submitted: boolean;
};

export default function GuestPractice() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [restored, setRestored] = useState(false);
  const [practicePath, setPracticePath] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    setPracticePath(user ? (user.role === 'STUDENT' ? '/student/practice' : '/family/quiz') : null);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedPractice;
        setAnswers(parsed.answers ?? {});
        setIndex(Math.max(0, Math.min(questions.length - 1, parsed.index ?? 0)));
        setSubmitted(Boolean(parsed.submitted));
      }
    } catch {
      // The warm-up still works when browser storage is unavailable.
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, index, submitted } satisfies SavedPractice),
      );
    } catch {
      // Ignore unavailable browser storage.
    }
  }, [answers, index, restored, submitted]);

  const correctCount = useMemo(
    () => questions.filter((question) => answers[question.id] === question.answer).length,
    [answers],
  );
  const answeredCount = Object.keys(answers).length;
  const question = questions[index];

  const reset = () => {
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    const topicsToReview = questions.filter(
      (item) => answers[item.id] !== item.answer,
    );

    return (
      <div className={styles.shell}>
        <section className={styles.resultsIntro}>
          <p className={styles.eyebrow}>MATHEMATICS WARM-UP / COMPLETE</p>
          <div className={styles.scoreLine}>
            <div>
              <span>Your starting score</span>
              <strong>{correctCount}<small> / {questions.length}</small></strong>
            </div>
            <p>
              {correctCount >= 5
                ? 'Strong start. A fuller diagnostic can show where to stretch next.'
                : correctCount >= 3
                  ? 'You have a useful base. Now focus your next practice session.'
                  : 'This gives you a starting point. Work topic by topic and check again.'}
            </p>
          </div>
          <p className={styles.resultCaveat}>
            This six-question warm-up is a starting signal, not a complete diagnosis.
          </p>
        </section>

        <section className={styles.topicResults} aria-labelledby="topic-results-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>WHAT YOUR ANSWERS SUGGEST</p>
              <h1 id="topic-results-title">Your next move is clearer.</h1>
            </div>
            <button type="button" onClick={reset} className={styles.secondaryButton}>
              <RotateCcw size={16} /> Try again
            </button>
          </div>
          <div className={styles.topicGrid}>
            {questions.map((item) => {
              const correct = answers[item.id] === item.answer;
              return (
                <article key={item.id} className={styles.topicResult}>
                  <span className={correct ? styles.correctIcon : styles.reviewIcon}>
                    {correct ? <Check size={16} /> : <Target size={16} />}
                  </span>
                  <div>
                    <h2>{item.topic}</h2>
                    <p>{correct ? 'Good signal from this question.' : 'Put this topic in your next mission.'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.nextMove}>
          <div>
            <p className={styles.eyebrow}>CONTINUE WITH DOLEARNN PRACTICE</p>
            <h2>{topicsToReview.length ? `Build a mission around ${topicsToReview[0].topic}.` : 'Take a fuller diagnostic next.'}</h2>
            <p>
              {practicePath
                ? 'Continue in your practice hub to use the full question bank and track results over time.'
                : 'Create a free account to use the full question bank, receive targeted missions and measure future progress.'}
            </p>
          </div>
          <div className={styles.nextActions}>
            <Link
              href={practicePath ?? '/register?from=practice'}
              className={styles.primaryButton}
            >
              {practicePath ? 'Continue to practice' : 'Create account and continue'} <ArrowRight size={18} />
            </Link>
            {!practicePath && (
              <Link href="/login?next=practice" className={styles.textLink}>
                Already have an account? Log in
              </Link>
            )}
          </div>
        </section>

        <section className={styles.reviewSection} aria-labelledby="review-title">
          <p className={styles.eyebrow}>REVIEW THE REASONING</p>
          <h2 id="review-title">Learn from every answer.</h2>
          <div className={styles.reviewList}>
            {questions.map((item, itemIndex) => {
              const selected = answers[item.id];
              const correct = selected === item.answer;
              return (
                <details key={item.id}>
                  <summary>
                    <span>{String(itemIndex + 1).padStart(2, '0')}</span>
                    <strong>{item.topic}</strong>
                    {correct ? <CheckCircle2 size={18} /> : <X size={18} />}
                  </summary>
                  <div>
                    <p>{item.prompt}</p>
                    <p>
                      <strong>Correct answer:</strong> {item.options[item.answer]}
                    </p>
                    <p>{item.explanation}</p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.practiceIntro}>
        <div>
          <p className={styles.eyebrow}>FREE MATHEMATICS WARM-UP</p>
          <h1>Start with a question.<br /><span>Leave with a direction.</span></h1>
          <p>
            Six external-examination-style questions across key Mathematics topics. No account required.
          </p>
        </div>
        <dl>
          <div><dt>QUESTIONS</dt><dd>06</dd></div>
          <div><dt>TIME</dt><dd>About 6 min</dd></div>
          <div><dt>RESULT</dt><dd>Topic signals</dd></div>
        </dl>
      </section>

      <section className={styles.quizCard} aria-labelledby="question-title">
        <div className={styles.quizMeta}>
          <span>MATHEMATICS / {question.topic.toUpperCase()}</span>
          <span>{String(index + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <h2 id="question-title">{question.prompt}</h2>
        <div className={styles.options} role="radiogroup" aria-label="Answer options">
          {question.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={answers[question.id] === optionIndex}
              className={answers[question.id] === optionIndex ? styles.selectedOption : ''}
              onClick={() => setAnswers(current => ({ ...current, [question.id]: optionIndex }))}
            >
              <span>{String.fromCharCode(65 + optionIndex)}</span>
              {option}
              {answers[question.id] === optionIndex && <Check size={17} />}
            </button>
          ))}
        </div>
        <div className={styles.quizFooter}>
          <button
            type="button"
            className={styles.previousButton}
            onClick={() => setIndex(current => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            <ArrowLeft size={17} /> Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIndex(current => current + 1)}
              disabled={answers[question.id] === undefined}
            >
              Next question <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setSubmitted(true)}
              disabled={answeredCount < questions.length}
            >
              See my topic signals <ArrowRight size={17} />
            </button>
          )}
        </div>
      </section>
      <p className={styles.practiceNote}>
        Your answers stay on this device during the warm-up. We’ll show the reasoning after you finish.
      </p>
    </div>
  );
}
