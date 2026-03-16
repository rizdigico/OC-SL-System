"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ChevronRight, ChevronLeft,
    Zap, Shield, Brain, Eye, Activity, Crown, Skull,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Option  { label: string; score: number; desc: string; }
interface Question { key: string; text: string; options: Option[]; }

interface Phase {
    id:          string;
    phase:       string;
    title:       string;
    subtitle:    string;
    accent:      string; // hex
    dim:         string; // rgba bg
    questions:   Question[];
}

export interface PlayerResult {
    level:         number;
    rank:          string;
    jobClass:      string;
    storylineArc:  string;
    totalScore:    number;
    stats: {
        strength:     number;
        agility:      number;
        vitality:     number;
        intelligence: number;
        sense:        number;
    };
    statPoints: number;
}

// ── Question bank ─────────────────────────────────────────────────────────────

const PHASES: Phase[] = [
    {
        id:       "physical",
        phase:    "PHASE 01",
        title:    "Physical Vanguard",
        subtitle: "STR & VIT EVALUATION",
        accent:   "#ef4444",
        dim:      "rgba(239,68,68,0.12)",
        questions: [
            {
                key:  "workoutFreq",
                text: "Weekly Workout Frequency?",
                options: [
                    { label: "Never",                   score: 0,  desc: "Currently sedentary"         },
                    { label: "1–2× per Week",           score: 2,  desc: "Light activity"              },
                    { label: "3–4× per Week",           score: 5,  desc: "Regular training"            },
                    { label: "5–6× per Week",           score: 8,  desc: "Dedicated athlete"           },
                    { label: "Daily / Twice-Daily",     score: 10, desc: "Elite frequency"             },
                ],
            },
            {
                key:  "physBaseline",
                text: "Current Physical Baseline?",
                options: [
                    { label: "Sedentary",               score: 0,  desc: "Minimal movement"           },
                    { label: "Beginner",                score: 2,  desc: "Starting the journey"       },
                    { label: "Intermediate",            score: 5,  desc: "Solid foundation"           },
                    { label: "Advanced",                score: 8,  desc: "High-performance training"  },
                    { label: "Elite Athlete",           score: 10, desc: "Peak physical form"         },
                ],
            },
            {
                key:  "dietConsist",
                text: "Dietary Consistency?",
                options: [
                    { label: "No Discipline",           score: 0,  desc: "Eating at random"           },
                    { label: "Occasional Effort",       score: 2,  desc: "Sometimes healthy"          },
                    { label: "Generally Clean",         score: 5,  desc: "Mostly whole foods"         },
                    { label: "Strict Protocol",         score: 8,  desc: "Disciplined daily intake"   },
                    { label: "Precision Optimized",     score: 10, desc: "Tracked & calibrated"       },
                ],
            },
        ],
    },
    {
        id:       "wealth",
        phase:    "PHASE 02",
        title:    "Sovereign Wealth",
        subtitle: "INT & AGI EVALUATION",
        accent:   "#3b82f6",
        dim:      "rgba(59,130,246,0.12)",
        questions: [
            {
                key:  "monthlyRev",
                text: "Current Monthly Revenue / Income?",
                options: [
                    { label: "< $1,000",                score: 0,  desc: "Pre-revenue"               },
                    { label: "$1,000 – $3,000",         score: 2,  desc: "Survival income"           },
                    { label: "$3,000 – $10,000",        score: 5,  desc: "Sustaining level"          },
                    { label: "$10,000 – $50,000",       score: 8,  desc: "Growth trajectory"         },
                    { label: "$50,000+ / Month",        score: 10, desc: "Empire-level cashflow"     },
                ],
            },
            {
                key:  "careerStage",
                text: "Business / Career Stage?",
                options: [
                    { label: "Ideation",                score: 0,  desc: "Still planning"            },
                    { label: "Early Stage / Employee",  score: 2,  desc: "Just beginning"            },
                    { label: "Growing Business",        score: 5,  desc: "Revenue is flowing"        },
                    { label: "Established Enterprise",  score: 8,  desc: "Proven model, scaling"     },
                    { label: "Scaled Empire",           score: 10, desc: "Systematic leverage"       },
                ],
            },
            {
                key:  "deepWork",
                text: "Daily Deep Work Hours?",
                options: [
                    { label: "< 1 Hour",                score: 0,  desc: "Constantly distracted"     },
                    { label: "1–2 Hours",               score: 2,  desc: "Some focus sessions"       },
                    { label: "3–4 Hours",               score: 5,  desc: "Solid focus blocks"        },
                    { label: "5–6 Hours",               score: 8,  desc: "High-output mode"          },
                    { label: "7+ Hours",                score: 10, desc: "Monk-level discipline"     },
                ],
            },
        ],
    },
    {
        id:       "shadow",
        phase:    "PHASE 03",
        title:    "The Shadow Army",
        subtitle: "PER EVALUATION",
        accent:   "#a855f7",
        dim:      "rgba(168,85,247,0.12)",
        questions: [
            {
                key:  "techProf",
                text: "Tech & Automation Proficiency?",
                options: [
                    { label: "No Experience",           score: 0,  desc: "Manual everything"         },
                    { label: "No-Code Tools",           score: 2,  desc: "Zapier, Notion AI, etc."   },
                    { label: "Some Coding",             score: 5,  desc: "Scripts & basic APIs"      },
                    { label: "Developer / Engineer",    score: 8,  desc: "Full-stack capable"        },
                    { label: "Fullstack AI Architect",  score: 10, desc: "Building autonomous AI"    },
                ],
            },
            {
                key:  "agentCount",
                text: "Active Automated Systems / Agents Running?",
                options: [
                    { label: "None",                    score: 0,  desc: "Zero automation"           },
                    { label: "1–2 Basic Workflows",     score: 2,  desc: "Email, calendar, etc."     },
                    { label: "3–5 Systems",             score: 5,  desc: "Multi-channel operations"  },
                    { label: "6–10 Agents",             score: 8,  desc: "Coordinated fleet"         },
                    { label: "10+ Complex AI Systems",  score: 10, desc: "Full Shadow Army online"   },
                ],
            },
        ],
    },
];

// ── Evaluation typewriter lines ───────────────────────────────────────────────

const EVAL_LINES = [
    "SCANNING SOVEREIGN POTENTIAL...",
    "CROSS-REFERENCING COMBAT PARAMETERS...",
    "CALIBRATING STAT MATRIX...",
    "VALIDATING SHADOW ARMY INTEGRATION...",
    "ASSIGNING STORYLINE COORDINATES...",
    "PLAYER PROFILE GENERATED.",
];

// ── Colour lookups ────────────────────────────────────────────────────────────

const RANK_COLOR: Record<string, string> = {
    E: "#64748b", D: "#22c55e", C: "#eab308",
    B: "#f97316", A: "#ef4444", S: "#a855f7",
};

const STAT_COLOR: Record<string, string> = {
    strength:     "#ef4444",
    agility:      "#22c55e",
    vitality:     "#3b82f6",
    intelligence: "#a855f7",
    sense:        "#f97316",
};

const STAT_LABEL: Record<string, string> = {
    strength: "STR", agility: "AGI", vitality: "VIT",
    intelligence: "INT", sense: "PER",
};

const STAT_ICON: Record<string, React.ReactNode> = {
    strength:     <Shield     className="w-3.5 h-3.5" />,
    agility:      <Activity   className="w-3.5 h-3.5" />,
    vitality:     <Zap        className="w-3.5 h-3.5" />,
    intelligence: <Brain      className="w-3.5 h-3.5" />,
    sense:        <Eye        className="w-3.5 h-3.5" />,
};

// ── Scoring algorithm ─────────────────────────────────────────────────────────

function computeResult(answers: Record<string, number>): PlayerResult {
    const a = (key: string) => answers[key] ?? 0;

    // Total out of 80 (8 questions × max 10)
    const totalScore =
        a("workoutFreq") + a("physBaseline") + a("dietConsist") +
        a("monthlyRev")  + a("careerStage")  + a("deepWork")    +
        a("techProf")    + a("agentCount");

    const level = Math.max(1, Math.min(60, Math.floor((totalScore / 80) * 59) + 1));

    const clamp = (v: number) => Math.min(99, Math.max(1, Math.round(v)));

    // Stat formulas — each pulls from 2 relevant question scores (0-10 each → 0-1 scaled)
    const strength     = clamp(10 + (a("workoutFreq")  / 10) * 35 + (a("physBaseline") / 10) * 35);
    const vitality     = clamp(10 + (a("physBaseline") / 10) * 30 + (a("dietConsist")  / 10) * 30);
    const intelligence = clamp(10 + (a("monthlyRev")   / 10) * 25 + (a("careerStage")  / 10) * 35);
    const agility      = clamp(10 + (a("deepWork")     / 10) * 30 + (a("workoutFreq")  / 10) * 20);
    const sense        = clamp(10 + (a("techProf")     / 10) * 40 + (a("agentCount")   / 10) * 30);

    const rank =
        level <= 10 ? "E" :
        level <= 20 ? "D" :
        level <= 30 ? "C" :
        level <= 40 ? "B" :
        level <= 50 ? "A" : "S";

    const storylineArc =
        rank === "E" ? "Double Dungeon Awakening" :
        rank === "D" ? "E-Rank Gate Clearing"     :
        rank === "C" ? "The Hunters Guild"        :
        rank === "B" ? "The Red Gate"             :
        rank === "A" ? "The Demon Castle"         :
                       "The Monarchs War";

    const statMap: Record<string, number> = { strength, agility, vitality, intelligence, sense };
    const topStat = Object.entries(statMap).sort((x, y) => y[1] - x[1])[0][0];

    const jobClass =
        topStat === "strength"     ? "Fighter"         :
        topStat === "vitality"     ? "Iron-Body"       :
        topStat === "intelligence" ? "Mage"            :
        topStat === "agility"      ? "Assassin"        :
                                     "Shadow Monarch";

    const statPoints =
        level <= 10 ? 5  :
        level <= 20 ? 8  :
        level <= 30 ? 12 :
        level <= 40 ? 16 :
        level <= 50 ? 20 : 25;

    return {
        level, rank, jobClass, storylineArc, totalScore,
        stats: { strength, agility, vitality, intelligence, sense },
        statPoints,
    };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepTrack({ current, total, accent }: { current: number; total: number; accent: string }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className="flex-1 h-px rounded-full transition-all duration-500"
                    style={{
                        background: i < current ? accent : "rgba(255,255,255,0.08)",
                        boxShadow:  i < current ? `0 0 5px ${accent}` : "none",
                    }}
                />
            ))}
        </div>
    );
}

function OptionCard({
    option, selected, onClick, accent,
}: {
    option: Option; selected: boolean; onClick: () => void; accent: string;
}) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200"
            style={{
                background:  selected ? `${accent}15` : "rgba(9,11,17,0.55)",
                borderColor: selected ? `${accent}70` : "rgba(255,255,255,0.07)",
                boxShadow:   selected ? `0 0 14px ${accent}20` : "none",
            }}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <span
                        className="text-[11px] font-black uppercase tracking-wider block"
                        style={{ color: selected ? accent : "rgba(255,255,255,0.75)" }}
                    >
                        {option.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-0.5 block leading-tight">
                        {option.desc}
                    </span>
                </div>
                <div
                    className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: selected ? accent : "rgba(255,255,255,0.15)" }}
                >
                    {selected && (
                        <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
                    )}
                </div>
            </div>
        </button>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

// step: 0=intro | 1-3=phases | 4=evaluating | 5=results
export default function DetailedAssessment() {
    const router = useRouter();

    const [step,       setStep]       = useState(0);
    const [answers,    setAnswers]    = useState<Record<string, number>>({});
    // Evaluation typewriter state
    const [evalLine,   setEvalLine]   = useState(0);
    const [evalChar,   setEvalChar]   = useState(0);
    const [result,     setResult]     = useState<PlayerResult | null>(null);

    const phaseIdx    = step - 1; // 0-2 when on a phase step
    const phase       = PHASES[phaseIdx] ?? null;
    const phaseReady  = phase
        ? phase.questions.every(q => answers[q.key] !== undefined)
        : true;

    // ── Typewriter engine ─────────────────────────────────────────────────────
    useEffect(() => {
        if (step !== 4) return;

        if (evalLine >= EVAL_LINES.length) {
            const t = setTimeout(() => {
                setResult(computeResult(answers));
                setStep(5);
            }, 700);
            return () => clearTimeout(t);
        }

        const line = EVAL_LINES[evalLine];
        if (evalChar < line.length) {
            const t = setTimeout(() => setEvalChar(c => c + 1), 32);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => { setEvalLine(l => l + 1); setEvalChar(0); }, 480);
            return () => clearTimeout(t);
        }
    }, [step, evalLine, evalChar, answers]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const pick = (key: string, score: number) =>
        setAnswers(prev => ({ ...prev, [key]: score }));

    const goNext = () => {
        if (step < 3) { setStep(s => s + 1); return; }
        // step === 3 → kick off evaluation
        setEvalLine(0); setEvalChar(0); setStep(4);
    };

    const goBack = () => { if (step > 1) setStep(s => s - 1); };

    const saveAndEnter = () => {
        if (!result) return;
        try { localStorage.setItem("assessment_result", JSON.stringify(result)); } catch (_) {}
        router.push("/dashboard");
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#02040f] overflow-hidden relative p-4 md:p-8">

            {/* Ambient background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-blue-600/5 blur-[200px] rounded-full" />
                <div
                    className="absolute inset-0 opacity-[0.018]"
                    style={{
                        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(59,130,246,0.9) 3px, rgba(59,130,246,0.9) 4px)",
                        backgroundSize:  "100% 5px",
                    }}
                />
            </div>

            <AnimatePresence mode="wait">

                {/* ══ INTRO ══════════════════════════════════════════════════════ */}
                {step === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -28 }}
                        transition={{ duration: 0.55 }}
                        className="flex flex-col items-center text-center max-w-sm w-full"
                    >
                        <motion.div
                            animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.15)", "0 0 40px rgba(59,130,246,0.35)", "0 0 20px rgba(59,130,246,0.15)"] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                            className="mb-7 w-20 h-20 rounded-2xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center"
                        >
                            <Crown className="w-10 h-10 text-blue-400" />
                        </motion.div>

                        <p className="text-[9px] tracking-[0.5em] text-blue-500/60 font-black uppercase mb-3">
                            System Evaluation Protocol
                        </p>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
                            Double Dungeon
                        </h1>
                        <h2 className="text-2xl font-black text-blue-400 uppercase tracking-widest mb-6">
                            Assessment
                        </h2>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-10 max-w-xs">
                            The System will evaluate your physical, financial, and cognitive
                            parameters to assign your starting Rank, Class, and Storyline Arc.
                        </p>

                        {/* Phase preview pills */}
                        <div className="flex gap-3 mb-10">
                            {PHASES.map(p => (
                                <div
                                    key={p.id}
                                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg border"
                                    style={{ borderColor: `${p.accent}30`, background: `${p.accent}08` }}
                                >
                                    <span className="text-[8px] font-black tracking-[0.3em] uppercase" style={{ color: p.accent }}>
                                        {p.phase}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 font-bold">{p.title}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-3 px-8 py-4 rounded-xl font-black text-xs tracking-[0.25em] uppercase border border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/60 transition-all"
                            style={{ boxShadow: "0 0 24px rgba(59,130,246,0.12)" }}
                        >
                            Begin Evaluation
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* ══ PHASE STEPS 1–3 ═══════════════════════════════════════════ */}
                {step >= 1 && step <= 3 && phase && (
                    <motion.div
                        key={`phase-${step}`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.38 }}
                        className="w-full max-w-xl"
                    >
                        <StepTrack current={step} total={3} accent={phase.accent} />

                        {/* Phase header */}
                        <div className="mb-7">
                            <p
                                className="text-[9px] font-black tracking-[0.4em] uppercase mb-1"
                                style={{ color: phase.accent }}
                            >
                                {phase.phase} — {phase.subtitle}
                            </p>
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                                {phase.title}
                            </h2>
                        </div>

                        {/* Questions */}
                        <div className="space-y-7">
                            {phase.questions.map((q, qi) => (
                                <div key={q.key}>
                                    <p className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                                        <span
                                            className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black flex-shrink-0"
                                            style={{ background: phase.dim, color: phase.accent }}
                                        >
                                            {qi + 1}
                                        </span>
                                        {q.text}
                                    </p>
                                    <div className="space-y-2">
                                        {q.options.map(opt => (
                                            <OptionCard
                                                key={opt.score}
                                                option={opt}
                                                selected={answers[q.key] === opt.score}
                                                onClick={() => pick(q.key, opt.score)}
                                                accent={phase.accent}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Nav */}
                        <div className="flex items-center justify-between mt-9 gap-4">
                            {step > 1 ? (
                                <button
                                    onClick={goBack}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-all text-[11px] font-bold tracking-wider uppercase"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />Back
                                </button>
                            ) : <div />}

                            <button
                                onClick={goNext}
                                disabled={!phaseReady}
                                className="flex items-center gap-2 px-7 py-2.5 rounded-lg font-black text-[11px] tracking-[0.2em] uppercase border transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                                style={phaseReady ? {
                                    borderColor: `${phase.accent}70`,
                                    background:  `${phase.accent}15`,
                                    color:       phase.accent,
                                    boxShadow:   `0 0 18px ${phase.accent}18`,
                                } : {
                                    borderColor: "rgba(255,255,255,0.1)",
                                    color:       "rgba(255,255,255,0.3)",
                                }}
                            >
                                {step === 3 ? "Submit & Evaluate" : "Next Phase"}
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ══ EVALUATION ════════════════════════════════════════════════ */}
                {step === 4 && (
                    <motion.div
                        key="eval"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center w-full max-w-md"
                    >
                        <motion.div
                            animate={{ boxShadow: ["0 0 20px rgba(59,130,246,0.2)", "0 0 50px rgba(59,130,246,0.5)", "0 0 20px rgba(59,130,246,0.2)"] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                            className="mb-8 w-16 h-16 rounded-2xl border border-blue-500/40 bg-blue-500/10 flex items-center justify-center"
                        >
                            <Skull className="w-8 h-8 text-blue-400" />
                        </motion.div>

                        <div className="w-full font-mono bg-black/70 border border-blue-500/20 rounded-2xl p-6 space-y-2.5 min-h-[200px]">
                            {EVAL_LINES.slice(0, evalLine).map((line, i) => (
                                <p key={i} className="text-[11px] text-blue-300/50 tracking-widest flex items-center gap-2">
                                    <span className="text-blue-700">›</span>{line}
                                </p>
                            ))}
                            {evalLine < EVAL_LINES.length && (
                                <p className="text-[11px] text-blue-300 tracking-widest flex items-center gap-2">
                                    <span className="text-blue-400">›</span>
                                    {EVAL_LINES[evalLine].slice(0, evalChar)}
                                    <span className="animate-pulse text-blue-400">▋</span>
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ══ RESULTS ═══════════════════════════════════════════════════ */}
                {step === 5 && result && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.96, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full max-w-lg"
                    >
                        {/* Title */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center mb-6"
                        >
                            <p className="text-[9px] tracking-[0.5em] text-zinc-600 uppercase font-bold mb-2">
                                Evaluation Complete
                            </p>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">
                                Player Card Generated
                            </h2>
                        </motion.div>

                        {/* Player card */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl overflow-hidden border"
                            style={{
                                background:  "rgba(6,8,18,0.92)",
                                borderColor: `${RANK_COLOR[result.rank]}50`,
                                boxShadow:   `0 0 50px ${RANK_COLOR[result.rank]}15, inset 0 1px 0 ${RANK_COLOR[result.rank]}20`,
                            }}
                        >
                            {/* Card header */}
                            <div
                                className="px-6 py-5 border-b flex items-center justify-between"
                                style={{
                                    borderColor: `${RANK_COLOR[result.rank]}22`,
                                    background:  `${RANK_COLOR[result.rank]}08`,
                                }}
                            >
                                <div>
                                    <span
                                        className="text-[9px] font-black tracking-[0.35em] uppercase"
                                        style={{ color: RANK_COLOR[result.rank] }}
                                    >
                                        {result.rank}-Rank Sovereign
                                    </span>
                                    <p className="text-2xl font-black text-white uppercase tracking-widest mt-0.5">
                                        {result.jobClass}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div
                                        className="text-5xl font-black leading-none tabular-nums"
                                        style={{
                                            color:      RANK_COLOR[result.rank],
                                            textShadow: `0 0 24px ${RANK_COLOR[result.rank]}`,
                                        }}
                                    >
                                        {result.level}
                                    </div>
                                    <div className="text-[9px] tracking-[0.35em] text-zinc-600 uppercase">Level</div>
                                </div>
                            </div>

                            {/* Stat matrix */}
                            <div className="px-6 py-5 space-y-3.5">
                                <p className="text-[9px] font-black tracking-[0.35em] text-zinc-700 uppercase mb-4">
                                    Stat Matrix
                                </p>
                                {(Object.entries(result.stats) as [string, number][]).map(([stat, value], idx) => (
                                    <motion.div
                                        key={stat}
                                        initial={{ opacity: 0, x: -14 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.45 + idx * 0.07 }}
                                        className="flex items-center gap-3"
                                    >
                                        <span style={{ color: STAT_COLOR[stat] }}>{STAT_ICON[stat]}</span>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider w-8">
                                            {STAT_LABEL[stat]}
                                        </span>
                                        <div className="flex-1 h-1.5 rounded-full bg-zinc-900/80 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(value / 99) * 100}%` }}
                                                transition={{ duration: 1.1, delay: 0.5 + idx * 0.07, ease: "easeOut" }}
                                                className="h-full rounded-full"
                                                style={{
                                                    background: `linear-gradient(90deg, ${STAT_COLOR[stat]}50, ${STAT_COLOR[stat]})`,
                                                    boxShadow:  `0 0 8px ${STAT_COLOR[stat]}70`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-black text-white w-6 text-right tabular-nums">
                                            {value}
                                        </span>
                                    </motion.div>
                                ))}

                                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-2">
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
                                        Available Stat Points
                                    </span>
                                    <span
                                        className="text-base font-black text-blue-400"
                                        style={{ textShadow: "0 0 8px rgba(96,165,250,0.6)" }}
                                    >
                                        {result.statPoints}
                                    </span>
                                </div>
                            </div>

                            {/* Storyline arc */}
                            <div
                                className="px-6 py-4 border-t"
                                style={{
                                    borderColor: `${RANK_COLOR[result.rank]}18`,
                                    background:  `${RANK_COLOR[result.rank]}06`,
                                }}
                            >
                                <p className="text-[9px] font-black tracking-[0.35em] text-zinc-700 uppercase mb-1.5">
                                    Starting Storyline Arc
                                </p>
                                <p
                                    className="text-sm font-black uppercase tracking-widest"
                                    style={{ color: RANK_COLOR[result.rank] }}
                                >
                                    {result.storylineArc}
                                </p>
                                <p className="text-[10px] text-zinc-700 mt-1 tabular-nums">
                                    System Score: {result.totalScore} / 80 &nbsp;·&nbsp;
                                    Level {result.level} {result.rank}-Rank
                                </p>
                            </div>
                        </motion.div>

                        {/* CTA button */}
                        <motion.button
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 }}
                            onClick={saveAndEnter}
                            className="mt-5 w-full py-4 rounded-xl font-black text-sm tracking-[0.2em] uppercase border transition-all hover:scale-[1.015] active:scale-[0.99]"
                            style={{
                                borderColor: `${RANK_COLOR[result.rank]}55`,
                                background:  `${RANK_COLOR[result.rank]}12`,
                                color:       RANK_COLOR[result.rank],
                                boxShadow:   `0 0 28px ${RANK_COLOR[result.rank]}18`,
                            }}
                        >
                            Save to System &amp; Enter Dashboard →
                        </motion.button>
                    </motion.div>
                )}

            </AnimatePresence>
        </main>
    );
}
