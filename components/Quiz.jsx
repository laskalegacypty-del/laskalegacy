'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QUESTIONS, BONUS_TIEBREAKERS } from '@/lib/quizData';
import * as db from '@/lib/supabase';

const BRAND = {
  teal: '#0097b2', purple: '#5e17eb', black: '#000000', white: '#ffffff',
  offWhite: '#f7f8fa', tealDark: '#007a91', tealLight: '#e6f6f9',
  purpleLight: '#f0e8fd', grey: '#6b7280', greyLight: '#e5e7eb',
  red: '#dc2626', green: '#16a34a',
};

const ROUND_SECONDS = 10;

const RESULT_COPY = {
  0: { title: 'Better Luck Next Round', tone: BRAND.grey },
  1: { title: 'Level 1 — Getting Started', tone: BRAND.teal },
  2: { title: 'Level 2 — Pony Club Ready', tone: BRAND.teal },
  3: { title: 'Level 3 — Solid Competitor', tone: BRAND.purple },
  4: { title: 'Level 4 — Show Regular', tone: BRAND.purple },
  5: { title: 'Level 5 — SAWMGA Legend', tone: BRAND.red },
};

function pickQuestion(level, usedRef, questionsByLevel) {
  const pool = questionsByLevel[level];
  const used = usedRef.current[level] || new Set();
  let available = pool.map((_, i) => i).filter((i) => !used.has(i));
  if (available.length === 0) {
    used.clear();
    available = pool.map((_, i) => i);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  used.add(idx);
  usedRef.current[level] = used;
  return { level, ...pool[idx] };
}

export default function Quiz() {
  const [screen, setScreen] = useState('start'); // start | playing | result
  const [mode, setMode] = useState('adults'); // kids (1-3) | adults (1-5)
  const [roundQuestions, setRoundQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionState, setQuestionState] = useState('asking'); // asking | revealed
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [reachedLevel, setReachedLevel] = useState(0);
  const [completedAll, setCompletedAll] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusQ, setBonusQ] = useState(null);
  const [questionsByLevel, setQuestionsByLevel] = useState(QUESTIONS);

  const usedRef = useRef({});
  const bonusUsedRef = useRef(new Set());
  const timerRef = useRef(null);

  const maxLevel = mode === 'kids' ? 3 : 5;

  useEffect(() => {
    if (!db.isSupabaseConfigured()) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const rows = await db.loadQuizQuestions();
        if (cancelled || !rows || rows.length === 0) return;
        const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
        rows.forEach((r) => {
          if (grouped[r.level]) grouped[r.level].push({ q: r.question, a: r.answer, stumper: r.stumper });
        });
        const merged = {};
        for (let l = 1; l <= 5; l++) merged[l] = grouped[l].length > 0 ? grouped[l] : QUESTIONS[l];
        setQuestionsByLevel(merged);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (screen !== 'playing' || questionState !== 'asking') return undefined;
    if (timeLeft <= 0) {
      setQuestionState('revealed');
      return undefined;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [screen, questionState, timeLeft]);

  function startRound() {
    const levels = [];
    for (let l = 1; l <= maxLevel; l++) levels.push(l);
    const qs = levels.map((l) => pickQuestion(l, usedRef, questionsByLevel));
    setRoundQuestions(qs);
    setCurrentIndex(0);
    setQuestionState('asking');
    setTimeLeft(ROUND_SECONDS);
    setReachedLevel(0);
    setCompletedAll(false);
    setShowBonus(false);
    setBonusQ(null);
    setScreen('playing');
  }

  function revealNow() {
    clearTimeout(timerRef.current);
    setQuestionState('revealed');
  }

  function markCorrect() {
    const current = roundQuestions[currentIndex];
    setReachedLevel(current.level);
    if (currentIndex === roundQuestions.length - 1) {
      setCompletedAll(true);
      setScreen('result');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setQuestionState('asking');
    setTimeLeft(ROUND_SECONDS);
  }

  function markIncorrect() {
    setScreen('result');
  }

  function pickBonus() {
    const used = bonusUsedRef.current;
    let available = BONUS_TIEBREAKERS.map((_, i) => i).filter((i) => !used.has(i));
    if (available.length === 0) {
      used.clear();
      available = BONUS_TIEBREAKERS.map((_, i) => i);
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    used.add(idx);
    setBonusQ(BONUS_TIEBREAKERS[idx]);
    setShowBonus(true);
  }

  const current = roundQuestions[currentIndex];
  const resultCopy = RESULT_COPY[reachedLevel] || RESULT_COPY[0];
  const timerPct = (timeLeft / ROUND_SECONDS) * 100;

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${BRAND.black} 0%, #0a1620 55%, ${BRAND.tealDark} 100%)`, fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes quizFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes quizPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .quiz-in { animation: quizFadeUp 0.35s ease both; }
        .quiz-pulse { animation: quizPulse 1s ease-in-out infinite; }
        .quiz-btn { transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease; }
        .quiz-btn:active { transform: scale(0.97); }
        .quiz-btn:hover { opacity: 0.92; }
      `}</style>

      <div style={{ textAlign: 'center', padding: '28px 20px 8px' }}>
        <img src="/logo-white.png" alt="Laska Legacy" style={{ height: 38, marginBottom: 10 }} />
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: BRAND.teal, fontWeight: 700 }}>WMG Quiz</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px 40px' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          {screen === 'start' && (
            <div className="quiz-in" style={{ background: BRAND.white, borderRadius: 20, padding: '32px 26px', boxShadow: '0 24px 48px rgba(0,0,0,0.35)', textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 24, fontWeight: 800, color: BRAND.black, margin: '0 0 8px' }}>SAWMGA Trivia Ladder</h1>
              <p style={{ fontSize: 13.5, color: BRAND.grey, margin: '0 0 24px', lineHeight: 1.5 }}>
                One question per level. Ten seconds on the clock. Get it right, climb the ladder — get it wrong, and the round ends where you stand.
              </p>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 22 }}>
                <button
                  className="quiz-btn"
                  onClick={() => setMode('kids')}
                  style={{ padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: mode === 'kids' ? 'none' : `1px solid ${BRAND.greyLight}`, background: mode === 'kids' ? BRAND.purple : BRAND.white, color: mode === 'kids' ? BRAND.white : BRAND.black }}
                >
                  Kids (Levels 1–3)
                </button>
                <button
                  className="quiz-btn"
                  onClick={() => setMode('adults')}
                  style={{ padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: mode === 'adults' ? 'none' : `1px solid ${BRAND.greyLight}`, background: mode === 'adults' ? BRAND.teal : BRAND.white, color: mode === 'adults' ? BRAND.white : BRAND.black }}
                >
                  Adults (Levels 1–5)
                </button>
              </div>

              <button
                className="quiz-btn"
                onClick={startRound}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 100, fontSize: 16, fontWeight: 800, cursor: 'pointer', border: 'none', background: BRAND.black, color: BRAND.white, boxShadow: '0 10px 22px rgba(0,0,0,0.25)' }}
              >
                Start Round
              </button>
            </div>
          )}

          {screen === 'playing' && current && (
            <div key={currentIndex} className="quiz-in">
              {/* Level ladder */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {Array.from({ length: maxLevel }, (_, i) => i + 1).map((l) => (
                  <div
                    key={l}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, fontFamily: "'Montserrat', sans-serif",
                      background: l < current.level ? BRAND.green : l === current.level ? BRAND.teal : 'rgba(255,255,255,0.12)',
                      color: l <= current.level ? BRAND.white : 'rgba(255,255,255,0.5)',
                      border: l === current.level ? `2px solid ${BRAND.white}` : 'none',
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>

              <div style={{ background: BRAND.white, borderRadius: 20, padding: '28px 24px', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, color: BRAND.purple }}>
                    Level {current.level}{current.stumper ? ' · ♦ Stumper' : ''}
                  </span>
                  {questionState === 'asking' && (
                    <div
                      className={timeLeft <= 3 ? 'quiz-pulse' : ''}
                      style={{
                        width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 15, color: BRAND.white,
                        background: timeLeft <= 3 ? BRAND.red : BRAND.black,
                      }}
                    >
                      {timeLeft}
                    </div>
                  )}
                </div>

                {questionState === 'asking' && (
                  <div style={{ height: 5, borderRadius: 3, background: BRAND.greyLight, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ height: '100%', width: `${timerPct}%`, background: timeLeft <= 3 ? BRAND.red : BRAND.teal, transition: 'width 1s linear' }} />
                  </div>
                )}

                <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 19, fontWeight: 700, color: BRAND.black, lineHeight: 1.4, margin: questionState === 'asking' ? '0 0 26px' : '0 0 16px' }}>
                  {current.q}
                </p>

                {questionState === 'revealed' && (
                  <div className="quiz-in" style={{ background: BRAND.tealLight, borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 800, color: BRAND.tealDark, marginBottom: 4 }}>Answer</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: BRAND.black, lineHeight: 1.5 }}>{current.a}</div>
                  </div>
                )}

                {questionState === 'asking' ? (
                  <button
                    className="quiz-btn"
                    onClick={revealNow}
                    style={{ width: '100%', padding: '13px 20px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: `1px solid ${BRAND.greyLight}`, background: BRAND.white, color: BRAND.black }}
                  >
                    Reveal Answer
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="quiz-btn"
                      onClick={markIncorrect}
                      style={{ flex: 1, padding: '15px 16px', borderRadius: 100, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', border: 'none', background: BRAND.red, color: BRAND.white }}
                    >
                      Incorrect
                    </button>
                    <button
                      className="quiz-btn"
                      onClick={markCorrect}
                      style={{ flex: 1, padding: '15px 16px', borderRadius: 100, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', border: 'none', background: BRAND.green, color: BRAND.white }}
                    >
                      Correct
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setScreen('start')}
                style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12.5, cursor: 'pointer' }}
              >
                End round early
              </button>
            </div>
          )}

          {screen === 'result' && (
            <div className="quiz-in" style={{ background: BRAND.white, borderRadius: 20, padding: '34px 26px', boxShadow: '0 24px 48px rgba(0,0,0,0.35)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: BRAND.grey, marginBottom: 10 }}>Round Result</div>
              <div style={{ fontSize: 56, fontWeight: 900, fontFamily: "'Montserrat', sans-serif", color: resultCopy.tone, lineHeight: 1 }}>
                {reachedLevel}
              </div>
              <div style={{ fontSize: 13, color: BRAND.grey, marginBottom: 6 }}>out of {maxLevel}</div>
              <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 20, fontWeight: 800, color: BRAND.black, margin: '10px 0 8px' }}>{resultCopy.title}</h2>
              <p style={{ fontSize: 13.5, color: BRAND.grey, margin: '0 0 26px', lineHeight: 1.5 }}>
                {completedAll
                  ? 'Every level, right to the top of the ladder. That deserves a tiebreaker.'
                  : reachedLevel === 0
                  ? 'The round ended on the very first question — reset and try again.'
                  : `The round ended on Level ${reachedLevel + 1}. Reached and held Level ${reachedLevel}.`}
              </p>

              {completedAll && !showBonus && (
                <button
                  className="quiz-btn"
                  onClick={pickBonus}
                  style={{ width: '100%', padding: '13px 20px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: BRAND.purple, color: BRAND.white, marginBottom: 12 }}
                >
                  Draw a Tiebreaker
                </button>
              )}

              {showBonus && bonusQ && (
                <div className="quiz-in" style={{ textAlign: 'left', background: BRAND.purpleLight, borderRadius: 12, padding: '14px 16px', marginBottom: 22 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 800, color: BRAND.purple, marginBottom: 6 }}>Tiebreaker</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.black, marginBottom: 8, lineHeight: 1.4 }}>{bonusQ.q}</div>
                  <div style={{ fontSize: 13.5, color: BRAND.grey, lineHeight: 1.5 }}>{bonusQ.a}</div>
                </div>
              )}

              <button
                className="quiz-btn"
                onClick={startRound}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 100, fontSize: 16, fontWeight: 800, cursor: 'pointer', border: 'none', background: BRAND.black, color: BRAND.white, boxShadow: '0 10px 22px rgba(0,0,0,0.25)' }}
              >
                Next Round
              </button>
              <button
                onClick={() => setScreen('start')}
                style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: BRAND.grey, fontSize: 12.5, cursor: 'pointer' }}
              >
                Back to setup
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
