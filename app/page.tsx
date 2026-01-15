"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Trophy, AlertTriangle, Lock, Unlock, CheckCircle, RotateCcw, XCircle } from 'lucide-react';

// --- CONFIGURATION ---
const QUESTIONS_PER_ROUND = 5;

// --- MATHS GENERATOR ENGINE ---
// (Same logic as before, just ensuring we have the full engine)

type Question = {
  id: number;
  text: string;
  answer: string;
  steps: string;
};

// Helper to get random int
const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to pick random item
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateQuestion = (topicId: string, count: number): Question => {
  let q: Question = { id: count, text: "", answer: "", steps: "" };

  switch (topicId) {
    // --- ALGEBRA ---
    case 'expand_brackets':
      const eb_a = r(2, 9);
      const eb_b = r(1, 12);
      const eb_op = Math.random() > 0.5 ? '+' : '-';
      q.text = `Expand: ${eb_a}(x ${eb_op} ${eb_b})`;
      q.answer = eb_op === '+' ? `${eb_a}x+${eb_a*eb_b}` : `${eb_a}x-${eb_a*eb_b}`;
      q.steps = `Multiply ${eb_a} by x, then ${eb_a} by ${eb_op}${eb_b}.`;
      break;

    case 'factorise_linear':
      const fl_hcf = r(2, 12);
      const fl_x = r(1, 5);
      const fl_num = r(1, 9);
      const fl_term1 = fl_hcf * fl_x;
      const fl_term2 = fl_hcf * fl_num;
      const fl_xStr = fl_x === 1 ? 'x' : `${fl_x}x`;
      q.text = `Factorise: ${fl_term1}x + ${fl_term2}`;
      q.answer = `${fl_hcf}(${fl_xStr}+${fl_num})`;
      q.steps = `Highest Common Factor is ${fl_hcf}.`;
      break;

    case 'solve_quadratics':
      let sq_m = r(-9, 9);
      const sq_n = r(-9, 9);
      if (sq_m === 0) sq_m = 1;
      const sq_sum = sq_m + sq_n;
      const sq_prod = sq_m * sq_n;
      const sq_sumStr = sq_sum >= 0 ? `+ ${sq_sum}x` : `- ${Math.abs(sq_sum)}x`;
      const sq_prodStr = sq_prod >= 0 ? `+ ${sq_prod}` : `- ${Math.abs(sq_prod)}`;
      q.text = `Solve: x² ${sq_sumStr} ${sq_prodStr} = 0 (separate with comma, smallest first)`;
      const ansArr = [-sq_m, -sq_n].sort((a,b) => a - b);
      q.answer = `${ansArr[0]},${ansArr[1]}`; 
      q.steps = `Factorise to (x ${sq_m > 0 ? '+' : ''}${sq_m})(x ${sq_n > 0 ? '+' : ''}${sq_n}). Flip signs.`;
      break;

    case 'completing_square':
        const cs_a = r(1, 10);
        const cs_b = r(1, 50);
        const cs_coef = 2 * cs_a;
        q.text = `Write x² + ${cs_coef}x + ${cs_b} in the form (x+a)² + b`;
        const cs_remainder = cs_b - (cs_a * cs_a);
        q.answer = `(x+${cs_a})^2${cs_remainder >= 0 ? '+' : ''}${cs_remainder}`;
        q.steps = `Halve ${cs_coef} to get ${cs_a}. Square it (${cs_a*cs_a}). Subtract that from ${cs_b}.`;
        break;

    case 'equating_coefficients':
        const ec_A = r(2, 5);
        const ec_B = r(1, 10);
        q.text = `If ${ec_A}(x + p) ≡ ${ec_A}x + ${ec_A * ec_B}, find the value of p.`;
        q.answer = ec_B.toString();
        q.steps = `Expand the left side: ${ec_A}x + ${ec_A}p. Therefore ${ec_A}p = ${ec_A * ec_B}.`;
        break;

    case 'negative_indices':
        const ni_base = r(2, 5);
        const ni_pow = r(1, 3);
        q.text = `Evaluate ${ni_base} to the power of -${ni_pow} (write as fraction a/b)`;
        q.answer = `1/${Math.pow(ni_base, ni_pow)}`;
        q.steps = `Negative power means reciprocal. 1 over ${ni_base}^${ni_pow}.`;
        break;

    // --- GEOMETRY ---
    case 'pythagoras':
      const py_a = r(3, 12);
      const py_b = r(4, 15);
      q.text = `Right-angled triangle legs are ${py_a} and ${py_b}. Find Hypotenuse (round to 1 d.p.)`;
      q.answer = Math.hypot(py_a, py_b).toFixed(1);
      if (q.answer.endsWith('.0')) q.answer = q.answer.replace('.0', '');
      q.steps = `sqrt(${py_a}² + ${py_b}²)`;
      break;

    case 'trigonometry':
        const tr_hyp = r(10, 20);
        const tr_ang = r(20, 60);
        q.text = `Right triangle: Hypotenuse = ${tr_hyp}, Angle = ${tr_ang}°. Find Opposite side (1 d.p.)`;
        const tr_val = tr_hyp * Math.sin(tr_ang * (Math.PI / 180));
        q.answer = tr_val.toFixed(1);
        if (q.answer.endsWith('.0')) q.answer = q.answer.replace('.0', '');
        q.steps = `SOH: Opp = Hyp × sin(angle)`;
        break;

    case 'exact_trig':
        const et_opts = [
            { t: 'sin(30)', a: '0.5' }, { t: 'cos(60)', a: '0.5' },
            { t: 'tan(45)', a: '1' }, { t: 'sin(90)', a: '1' },
            { t: 'cos(0)', a: '1' }, { t: 'sin(0)', a: '0' }
        ];
        const et_q = pick(et_opts);
        q.text = `What is the exact value of ${et_q.t}?`;
        q.answer = et_q.a;
        q.steps = "Memorise the exact trig table or use triangles.";
        break;

    case '3d_pythagoras':
        const d_l = r(2, 6);
        const d_w = r(2, 6);
        const d_h = r(2, 6);
        q.text = `Cuboid dimensions: ${d_l}x${d_w}x${d_h}. Find length of internal diagonal (1 d.p.)`;
        q.answer = Math.sqrt(d_l*d_l + d_w*d_w + d_h*d_h).toFixed(1);
        q.steps = `sqrt(l² + w² + h²)`;
        break;
    
    case 'perp_gradients':
        const pg_m = r(2, 5);
        const pg_neg = Math.random() > 0.5 ? 1 : -1;
        const pg_val = pg_m * pg_neg;
        q.text = `Line A has gradient ${pg_val}. What is the gradient of a line perpendicular to A? (fraction like -1/2)`;
        if (pg_neg === -1) q.answer = `1/${pg_m}`;
        if (pg_neg === 1) q.answer = `-1/${pg_m}`;
        q.steps = `Negative reciprocal. Flip fraction and change sign.`;
        break;

    // --- NUMBER / PROPORTION ---
    case 'percentages':
      const pc_amt = r(2, 50) * 10;
      const pc_pct = pick([5, 10, 15, 20, 25, 50, 75]);
      q.text = `Find ${pc_pct}% of ${pc_amt}`;
      q.answer = ((pc_pct / 100) * pc_amt).toString();
      q.steps = `Convert ${pc_pct}% to decimal (${pc_pct/100}) and multiply.`;
      break;

    case 'profit':
        const pr_cost = r(5, 20) * 10;
        const pr_sell = Math.floor(pr_cost * (r(11, 15) / 10)); // 10-50% profit
        q.text = `Bought for £${pr_cost}, Sold for £${pr_sell}. What is the % profit?`;
        q.answer = (((pr_sell - pr_cost) / pr_cost) * 100).toString();
        q.steps = `(Difference / Original) × 100`;
        break;

    case 'speed_dist_time':
        const sdt_s = r(30, 70);
        const sdt_t = r(2, 5);
        q.text = `Car travels at ${sdt_s} mph for ${sdt_t} hours. Calculate distance.`;
        q.answer = (sdt_s * sdt_t).toString();
        q.steps = `Distance = Speed × Time`;
        break;

    case 'averages_mean':
        const am_vals = [r(2,9), r(2,9), r(2,9), r(2,9)];
        q.text = `Find mean of: ${am_vals.join(', ')}`;
        const am_sum = am_vals.reduce((a,b)=>a+b, 0);
        q.answer = (am_sum / 4).toString();
        q.steps = `Add all numbers (${am_sum}) divide by count (4).`;
        break;

    default:
      q.text = "Topic logic generated.";
      q.answer = "0";
      q.steps = "N/A";
  }
  return q;
};

// --- TOPIC DATA ---
const ALL_TOPICS = [
  // Algebra
  { id: 'expand_brackets', title: 'Expanding Brackets', category: 'Algebra' },
  { id: 'factorise_linear', title: 'Factorise Linear', category: 'Algebra' },
  { id: 'solve_quadratics', title: 'Solve Quadratics', category: 'Algebra' },
  { id: 'completing_square', title: 'Completing Square', category: 'Algebra' },
  { id: 'equating_coefficients', title: 'Equating Coeffs', category: 'Algebra' },
  // Geometry
  { id: 'pythagoras', title: "Pythagoras' Theorem", category: 'Geometry' },
  { id: 'trigonometry', title: 'Basic Trigonometry', category: 'Geometry' },
  { id: 'exact_trig', title: 'Exact Trig Values', category: 'Geometry' },
  { id: '3d_pythagoras', title: '3D Pythagoras', category: 'Geometry' },
  { id: 'perp_gradients', title: 'Perpendicular Grads', category: 'Geometry' },
  // Number
  { id: 'percentages', title: 'Percentages', category: 'Number' },
  { id: 'negative_indices', title: 'Negative Indices', category: 'Number' },
  { id: 'profit', title: 'Profit Calculations', category: 'Number' },
  { id: 'speed_dist_time', title: 'Speed Dist Time', category: 'Number' },
  { id: 'averages_mean', title: 'Mean Average', category: 'Number' },
];

const EXPLAINERS: Record<string, { title: string, content: string }> = {
  'expand_brackets': { title: "The Claw", content: "Multiply the outside term by EVERYTHING inside.\n2(x+3) -> 2x + 6" },
  'factorise_linear': { title: "Reverse Expand", content: "Find the biggest number that divides both terms.\nDivide terms by it, put it outside." },
  'solve_quadratics': { title: "Find the Roots", content: "Make it equal zero.\nFactorise into (brackets).\nOne bracket must be zero." },
  'trigonometry': { title: "SOH CAH TOA", content: "Label sides: Hypotenuse, Adjacent, Opposite.\nPick the right formula." },
};

// --- MAIN COMPONENT ---

export default function HelixApp() {
  const [view, setView] = useState<'menu' | 'explainer' | 'practice' | 'level_complete'>('menu');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  
  // Progression
  const [unlockedIndex, setUnlockedIndex] = useState(0); 

  // Practice State
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [history, setHistory] = useState<Record<number, string>>({});
  
  // Level State
  const [roundCount, setRoundCount] = useState(0);
  const [xp, setXp] = useState(0);

  // Bookwork Check State
  const [isBookworkCheck, setIsBookworkCheck] = useState(false);
  const [bookworkTarget, setBookworkTarget] = useState<number | null>(null);
  const [bookworkState, setBookworkState] = useState<'input' | 'failed'>('input');
  const [failedCorrectAns, setFailedCorrectAns] = useState<string>("");
  const [failedUserAns, setFailedUserAns] = useState<string>("");

  // --- ACTIONS ---

  const startTopic = (id: string) => {
    setActiveTopicId(id);
    setView('explainer');
  };

  const startPractice = () => {
    setRoundCount(1);
    setHistory({});
    nextQuestion(1);
    setView('practice');
  };

  const nextQuestion = (idNum: number) => {
    if (!activeTopicId) return;
    
    // Anti-dupe logic
    let q = generateQuestion(activeTopicId, idNum);
    let attempts = 0;
    while (attempts < 5 && question && q.answer === question.answer) {
        q = generateQuestion(activeTopicId, idNum);
        attempts++;
    }

    setQuestion(q);
    setInput("");
    setFeedback('idle');
  };

  const handleLevelComplete = () => {
    const currentTopicIndex = ALL_TOPICS.findIndex(t => t.id === activeTopicId);
    if (currentTopicIndex === unlockedIndex && unlockedIndex < ALL_TOPICS.length - 1) {
        setUnlockedIndex(prev => prev + 1);
    }
    setView('level_complete');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    const cleanInput = input.replace(/\s/g, '').toLowerCase();
    const cleanAns = question.answer.replace(/\s/g, '').toLowerCase();
    const isCorrect = cleanInput === cleanAns || cleanInput === `x=${cleanAns}`;

    if (isCorrect) {
      setFeedback('correct');
      setXp(prev => prev + 100);
      setHistory(prev => ({...prev, [question.id]: input})); // Save raw input

      setTimeout(() => {
        // Bookwork check random trigger (approx 30% chance after Q1)
        if (question.id > 1 && Math.random() > 0.7) {
           triggerBookworkCheck();
        } else {
           advance();
        }
      }, 1000);
    } else {
      setFeedback('wrong');
    }
  };

  const advance = () => {
      if (roundCount >= QUESTIONS_PER_ROUND) {
          handleLevelComplete();
      } else {
          setRoundCount(prev => prev + 1);
          if (question) nextQuestion(question.id + 1);
      }
  };

  // --- BOOKWORK LOGIC ---

  const triggerBookworkCheck = () => {
    const pastIds = Object.keys(history).map(Number);
    const targetId = pastIds[Math.floor(Math.random() * pastIds.length)];
    setBookworkTarget(targetId);
    setBookworkState('input');
    setInput("");
    setIsBookworkCheck(true);
  };

  const handleBookworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookworkTarget === null) return;
    
    // Verify against history
    const pastAns = history[bookworkTarget];
    const cleanIn = input.replace(/\s/g, '').toLowerCase();
    const cleanPast = pastAns.replace(/\s/g, '').toLowerCase();

    if (cleanIn === cleanPast) {
      // Success
      setIsBookworkCheck(false);
      setBookworkTarget(null);
      advance();
    } else {
      // Fail - Show UI modal, NO ALERT
      setFailedCorrectAns(pastAns);
      setFailedUserAns(input);
      setBookworkState('failed');
    }
  };

  const handleBookworkFailConfirm = () => {
      setIsBookworkCheck(false);
      setInput("");
      // Reset current question input and feedback, force them to redo it
      setFeedback('idle');
  };

  // --- RENDERERS ---

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-indigo-700 mb-2">HELIX</h1>
          <p className="text-slate-500 font-medium">Master the pattern. Unlock the universe.</p>
        </header>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ALL_TOPICS.map((t, index) => {
            const isLocked = index > unlockedIndex;
            return (
              <button
                key={t.id}
                disabled={isLocked}
                onClick={() => startTopic(t.id)}
                className={`group relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden
                  ${isLocked 
                    ? 'border-slate-200 bg-slate-100 opacity-70 cursor-not-allowed grayscale' 
                    : 'border-white bg-white shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.category}</span>
                    {isLocked ? <Lock size={16} className="text-slate-400"/> : <Unlock size={16} className="text-green-500"/>}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {t.title}
                </h3>
                
                {!isLocked && (
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-0 group-hover:w-full transition-all duration-300"/>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'explainer') {
    const data = EXPLAINERS[activeTopicId || ""] || { title: "Instructions", content: "Solve the questions given.\nBe precise." };
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-xl w-full text-center relative overflow-hidden"
        >
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
            <Brain size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-6">{data.title}</h2>
          <div className="text-lg text-slate-600 mb-10 whitespace-pre-line leading-relaxed font-medium bg-slate-50 p-6 rounded-xl border border-slate-100">
            {data.content}
          </div>
          <button 
            onClick={startPractice}
            className="w-full bg-slate-900 text-white text-xl font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-1"
          >
            Start Round <ChevronRight />
          </button>
        </motion.div>
      </div>
    );
  }

  if (view === 'level_complete') {
      return (
        <div className="min-h-screen bg-green-500 flex items-center justify-center p-4">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center"
            >
                <Trophy size={64} className="mx-auto text-yellow-400 mb-6 drop-shadow-md" />
                <h2 className="text-4xl font-black text-slate-800 mb-2">Round Complete!</h2>
                <p className="text-slate-500 mb-8 text-lg">Knowledge secured.</p>
                
                <div className="bg-slate-100 rounded-xl p-4 mb-8">
                    <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Total XP</div>
                    <div className="text-4xl font-mono font-bold text-indigo-600">{xp}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => startPractice()}
                        className="bg-indigo-100 text-indigo-700 font-bold py-4 rounded-xl hover:bg-indigo-200 transition flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={20} /> Replay
                    </button>
                    <button 
                        onClick={() => setView('menu')}
                        className="bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition"
                    >
                        Menu
                    </button>
                </div>
            </motion.div>
        </div>
      );
  }

  // --- PRACTICE VIEW ---

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* HUD */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => setView('menu')} className="text-slate-400 hover:text-red-500 font-bold text-sm tracking-wide transition-colors">
            EXIT
        </button>
        <div className="flex gap-1">
            {Array.from({length: QUESTIONS_PER_ROUND}).map((_, i) => (
                <div key={i} className={`h-2 w-8 rounded-full transition-colors ${i < roundCount ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            ))}
        </div>
        <div className="font-mono font-bold text-indigo-600 flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full">
            <Trophy size={16} /> {xp}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative overflow-y-auto">
        <div className="max-w-2xl w-full py-10">
            {/* Question Card */}
            <motion.div
                key={question?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100"
            >
                <div className="mb-6 flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <span>Question {roundCount} / {QUESTIONS_PER_ROUND}</span>
                    <span>{activeTopicId}</span>
                </div>

                <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-12 text-center leading-snug">
                    {question?.text}
                </h1>

                <form onSubmit={handleSubmit} className="max-w-md mx-auto relative group">
                    {/* RESTORED INPUT STYLE */}
                    <input 
                        autoFocus
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Answer..."
                        disabled={feedback === 'correct'}
                        className={`w-full text-center text-3xl font-bold p-4 rounded-xl border-2 outline-none transition-all 
                            bg-white text-slate-900 placeholder:text-slate-300
                            ${feedback === 'wrong' ? 'border-red-500 bg-red-50' : 'border-slate-300 focus:border-indigo-500'}
                            ${feedback === 'correct' ? 'border-green-500 bg-green-50' : ''}
                        `}
                    />
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         {feedback === 'correct' && <CheckCircle className="text-green-500" size={32} />}
                    </div>

                    {feedback === 'idle' && (
                         <div className="text-center mt-4">
                            <button className="bg-indigo-600 text-white font-bold py-2 px-8 rounded-full hover:bg-indigo-700 transition">
                                Check
                            </button>
                         </div>
                    )}
                </form>

                <AnimatePresence>
                    {feedback === 'wrong' && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-6 text-center">
                                <p className="font-bold text-red-800 text-lg mb-2">Keep trying!</p>
                                <p className="text-red-600 mb-4">{question?.steps}</p>
                                <button 
                                    onClick={() => { setInput(""); setFeedback('idle'); }}
                                    className="text-sm font-bold text-red-400 hover:text-red-700 underline decoration-2 underline-offset-4"
                                >
                                    Clear & Retry
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
      </div>

      {/* BOOKWORK OVERLAY */}
      <AnimatePresence>
        {isBookworkCheck && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className={`rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 transition-colors duration-300
                ${bookworkState === 'failed' ? 'bg-red-50 border-red-500' : 'bg-white border-orange-500'}
            `}>
              {bookworkState === 'input' ? (
                <>
                    <div className="flex justify-center mb-6 text-orange-500 bg-orange-50 w-20 h-20 rounded-full items-center mx-auto">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-4">Bookwork Check</h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        Enter your exact answer for <strong>Question {bookworkTarget}</strong>.
                    </p>
                    
                    <form onSubmit={handleBookworkSubmit}>
                        <input 
                        autoFocus
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full text-center text-2xl font-bold p-4 bg-white border-2 border-slate-300 rounded-xl mb-6 focus:border-orange-500 outline-none text-slate-900"
                        placeholder="..."
                        />
                        <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800">
                        Verify
                        </button>
                    </form>
                </>
              ) : (
                <>
                    <div className="flex justify-center mb-6 text-red-500 bg-red-100 w-20 h-20 rounded-full items-center mx-auto">
                        <XCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-red-900 mb-4">Check Failed</h2>
                    <p className="text-red-800 mb-2 font-medium">
                        That doesn't match your previous answer.
                    </p>
                    <div className="bg-white/50 p-4 rounded-xl mb-6 text-sm text-left border border-red-200">
                        <div className="mb-2"><strong>Q{bookworkTarget} Answer:</strong> {failedCorrectAns}</div>
                        <div><strong>You Wrote:</strong> {failedUserAns}</div>
                    </div>
                    
                    <button 
                        onClick={handleBookworkFailConfirm}
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700"
                    >
                        Restart Question
                    </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}