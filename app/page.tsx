"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, X, Brain, ChevronRight, Calculator, Trophy, AlertTriangle } from 'lucide-react';

// --- MATHS GENERATOR ENGINE ---
// This handles the logic for creating infinite questions

type Question = {
  id: number;
  text: string;
  answer: string;
  steps: string; // The "Explanation"
};

const generateQuestion = (topicId: string, count: number): Question => {
  const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  let q: Question = { id: count, text: "", answer: "", steps: "" };

  switch (topicId) {
    case 'expand_brackets':
      const a = r(2, 9);
      const b = r(1, 12);
      q.text = `Expand: ${a}(x + ${b})`;
      q.answer = `${a}x+${a*b}`;
      q.steps = `Multiply ${a} by x, then ${a} by ${b}.`;
      break;

    case 'factorise_linear':
      const f1 = r(2, 8);
      const f2 = r(2, 9);
      const total = f1 * f2;
      q.text = `Factorise: ${f1}x + ${total}`;
      q.answer = `${f1}(x+${f2})`;
      q.steps = `Highest Common Factor is ${f1}. Divide both terms by ${f1}.`;
      break;

    case 'solve_quadratics':
      // Generates (x+m)(x+n)=0 style
      const m = r(1, 6);
      const n = r(1, 6);
      const sum = m + n;
      const prod = m * n;
      q.text = `Solve for x: x² + ${sum}x + ${prod} = 0 (separate answers with comma)`;
      q.answer = `-${m},-${n}`; // simple format for checking
      q.steps = `Factorise into (x+${m})(x+${n})=0. Then x = -${m}, x = -${n}.`;
      break;

    case 'pythagoras':
      const s1 = r(3, 8) * 3; // ensure nice numbers sometimes
      const s2 = r(4, 10) * 4;
      q.text = `Right-angled triangle. Sides are ${s1}cm and ${s2}cm. Find the Hypotenuse (round to nearest whole).`;
      q.answer = Math.round(Math.sqrt(s1*s1 + s2*s2)).toString();
      q.steps = `a² + b² = c². ${s1}² + ${s2}² = ${s1*s1 + s2*s2}. Square root of that is ~${q.answer}.`;
      break;

    case 'percentages':
      const base = r(2, 20) * 10;
      const perc = [10, 20, 25, 50, 75][r(0, 4)];
      q.text = `Find ${perc}% of ${base}`;
      q.answer = (base * (perc/100)).toString();
      q.steps = `${perc}% is same as ${perc/100}. Multiply ${base} by ${perc/100}.`;
      break;

    default:
      q.text = "Topic logic coming soon.";
      q.answer = "0";
      q.steps = "N/A";
  }
  return q;
};

// --- DATA STRUCTURES ---

const TOPICS = [
  { id: 'expand_brackets', title: 'Expanding Brackets', category: 'Algebra', locked: false },
  { id: 'factorise_linear', title: 'Factorise Linear', category: 'Algebra', locked: false },
  { id: 'solve_quadratics', title: 'Solve Quadratics', category: 'Algebra', locked: true }, // Locked for demo
  { id: 'applied_quadratics', title: 'Applied Quadratics', category: 'Algebra', locked: true },
  { id: 'completing_square', title: 'Completing the Square', category: 'Algebra', locked: true },
  { id: 'pythagoras', title: "Pythagoras' Theorem", category: 'Geometry', locked: false },
  { id: 'trigonometry', title: 'Trigonometry', category: 'Geometry', locked: true },
  { id: 'percentages', title: 'Percentages', category: 'Number', locked: false },
  { id: 'neg_indices', title: 'Negative Indices', category: 'Number', locked: true },
];

const EXPLAINERS: Record<string, { title: string, content: string }> = {
  'expand_brackets': { title: "The Claw Method", content: "To expand a bracket, you must multiply the term on the outside by EVERYTHING on the inside.\n\nThink of it as a claw grabbing each term." },
  'factorise_linear': { title: "Finding the HCF", content: "Factorising is the reverse of expanding. Look for the biggest number that divides into both terms." },
  'pythagoras': { title: "The Hypotenuse", content: "The longest side is always opposite the right angle.\n\nFormula: a² + b² = c²" },
  'percentages': { title: "Multipliers", content: "Percent means 'out of 100'.\n50% = 0.5\n10% = 0.1" },
};

// --- MAIN COMPONENT ---

export default function HelixApp() {
  const [view, setView] = useState<'menu' | 'explainer' | 'practice'>('menu');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  // Practice State
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [history, setHistory] = useState<Record<number, string>>({});
  const [qCount, setQCount] = useState(0);
  const [xp, setXp] = useState(0);

  // Bookwork State
  const [isBookworkCheck, setIsBookworkCheck] = useState(false);
  const [bookworkTarget, setBookworkTarget] = useState<number | null>(null);

  const startTopic = (id: string) => {
    setActiveTopic(id);
    setView('explainer');
  };

  const startPractice = () => {
    setQCount(0);
    setHistory({});
    setXp(0);
    nextQuestion(1);
    setView('practice');
  };

  const nextQuestion = (num: number) => {
    if (!activeTopic) return;
    const q = generateQuestion(activeTopic, num);
    setQuestion(q);
    setInput("");
    setFeedback('idle');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    // Normalise answer (remove spaces)
    const cleanInput = input.replace(/\s/g, '').toLowerCase();
    const cleanAns = question.answer.replace(/\s/g, '').toLowerCase();

    if (cleanInput === cleanAns) {
      setFeedback('correct');
      setXp(prev => prev + 100);
      
      // Save to history for Bookwork Check
      setHistory(prev => ({...prev, [question.id]: input}));

      setTimeout(() => {
        // Trigger Bookwork Check roughly every 3 questions
        if (question.id > 1 && Math.random() > 0.6) {
           triggerBookworkCheck();
        } else {
           nextQuestion(question.id + 1);
        }
      }, 1200);
    } else {
      setFeedback('wrong');
    }
  };

  const triggerBookworkCheck = () => {
    // Pick a random previous question
    const pastIds = Object.keys(history).map(Number);
    const targetId = pastIds[Math.floor(Math.random() * pastIds.length)];
    setBookworkTarget(targetId);
    setInput("");
    setIsBookworkCheck(true);
  };

  const handleBookworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookworkTarget === null) return;
    
    // Strict string matching for bookwork
    const pastAns = history[bookworkTarget];
    if (input.replace(/\s/g, '').toLowerCase() === pastAns.replace(/\s/g, '').toLowerCase()) {
      setIsBookworkCheck(false);
      setBookworkTarget(null);
      // Resume
      if (question) nextQuestion(question.id + 1);
    } else {
      alert(`BOOKWORK CHECK FAILED. The answer you wrote was: ${pastAns}. Restarting question.`);
      setIsBookworkCheck(false);
      setInput("");
      // Force them to redo the current question
    }
  };

  // --- VIEWS ---

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-indigo-600 mb-2">HELIX MATHS</h1>
          <p className="text-slate-500">Master the pattern.</p>
        </header>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              disabled={t.locked}
              onClick={() => startTopic(t.id)}
              className={`p-6 rounded-xl border-2 text-left transition-all relative overflow-hidden group
                ${t.locked 
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'border-indigo-100 bg-white hover:border-indigo-500 hover:shadow-lg'
                }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-60">{t.category}</div>
              <div className="font-bold text-lg flex items-center justify-between">
                {t.title}
                {t.locked ? <div className="h-2 w-2 rounded-full bg-slate-300"/> : <div className="h-2 w-2 rounded-full bg-green-400"/>}
              </div>
              {!t.locked && (
                 <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform"/>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'explainer') {
    const data = EXPLAINERS[activeTopic || ""] || { title: "Topic", content: "Ready to practice?" };
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center"
        >
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Brain size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-6">{data.title}</h2>
          <div className="text-xl text-slate-600 mb-12 whitespace-pre-line leading-relaxed">
            {data.content}
          </div>
          <button 
            onClick={startPractice}
            className="bg-slate-900 text-white text-lg font-bold py-4 px-12 rounded-full hover:bg-slate-800 transition-colors flex items-center mx-auto gap-2"
          >
            Start Practice <ChevronRight />
          </button>
        </motion.div>
      </div>
    );
  }

  // --- PRACTICE & BOOKWORK VIEW ---

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center">
        <button onClick={() => setView('menu')} className="text-slate-500 hover:text-slate-800 font-bold text-sm">EXIT</button>
        <div className="font-mono font-bold text-indigo-600 flex items-center gap-2">
            <Trophy size={16} /> {xp} XP
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
        
        {/* The Question Card */}
        <div className="max-w-2xl w-full">
            <div className="mb-4 flex justify-between text-slate-400 text-sm font-bold uppercase tracking-widest">
                <span>Q{question?.id}</span>
                <span>Code: {activeTopic?.substring(0,3).toUpperCase()}{question?.id}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-12 text-center leading-tight">
                {question?.text}
            </h1>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto relative">
                <input 
                    autoFocus
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Answer..."
                    disabled={feedback === 'correct'}
                    className={`w-full text-center text-2xl p-4 rounded-xl border-2 outline-none transition-all
                        ${feedback === 'wrong' ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 focus:border-indigo-500'}
                        ${feedback === 'correct' ? 'border-green-500 bg-green-50 text-green-900' : ''}
                    `}
                />
                
                {feedback === 'wrong' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg text-center"
                    >
                        <p className="font-bold">Not quite.</p>
                        <p className="text-sm mt-1">{question?.steps}</p>
                        <button 
                            type="button" 
                            onClick={() => { setInput(""); setFeedback('idle'); }}
                            className="mt-2 text-sm underline hover:text-red-950"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}

                {feedback === 'idle' && (
                    <button 
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-bold"
                    >
                        Check
                    </button>
                )}
            </form>
        </div>
      </div>

      {/* BOOKWORK OVERLAY */}
      <AnimatePresence>
        {isBookworkCheck && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-orange-600 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
              <div className="flex justify-center mb-4 text-orange-600">
                <AlertTriangle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Bookwork Check!</h2>
              <p className="text-slate-500 mb-6">
                To prove you aren't guessing, enter your exact answer for <strong>Question {bookworkTarget}</strong>.
              </p>
              
              <form onSubmit={handleBookworkSubmit}>
                <input 
                  autoFocus
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full text-center text-xl p-3 border-2 border-slate-300 rounded-lg mb-4 focus:border-orange-500 outline-none"
                  placeholder="Type your previous answer..."
                />
                <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800">
                  Verify
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}