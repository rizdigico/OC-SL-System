"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cpu, CheckCircle, XCircle, Clock, Plus, Trash2, Wifi, WifiOff } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Agent {
  _id: string;
  agentId: string;
  name: string;
  rank: "Scout" | "Knight" | "Commander" | "General" | "Marshal";
  status: "Idle" | "Executing" | "Success" | "Failed" | "Offline";
  currentTask: string;
  successRate: number;
  totalTasksCompleted: number;
  lastSeen: string;
}

interface Quest {
  _id: string;
  title: string;
  description?: string;
  difficulty?: string;
  objectives?: { description: string; progress: number; target: number; completed: boolean }[];
  rewards?: { exp?: number; gold?: number };
  completedAt?: string;
}

interface MissionControlProps {
  user: any;
  quests: Quest[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RANK_COLORS: Record<string, string> = {
  Scout:     "#7a9abf",
  Knight:    "#11d2ef",
  Commander: "#1e44ff",
  General:   "#b200ff",
  Marshal:   "#FFD700",
};

const STATUS_CONFIG: Record<string, { color: string; pulse: boolean; icon: React.ReactNode }> = {
  Executing: { color: "#11d2ef", pulse: true,  icon: <Activity className="w-3 h-3" /> },
  Idle:      { color: "#7a9abf", pulse: false, icon: <Clock    className="w-3 h-3" /> },
  Success:   { color: "#22c55e", pulse: false, icon: <CheckCircle className="w-3 h-3" /> },
  Failed:    { color: "#ef4444", pulse: false, icon: <XCircle  className="w-3 h-3" /> },
  Offline:   { color: "#333355", pulse: false, icon: <WifiOff  className="w-3 h-3" /> },
};

const DIFF_RANK_COLOR: Record<string, string> = {
  E: "#7a9abf", D: "#22c55e", C: "#facc15",
  B: "#f97316", A: "#ef4444", S: "#b200ff",
};

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)  return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AgentRow({ agent, onDelete }: { agent: Agent; onDelete: (id: string) => void }) {
  const cfg   = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.Offline;
  const rankC = RANK_COLORS[agent.rank] ?? "#7a9abf";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative p-3 border border-[rgba(30,68,200,0.2)] bg-[rgba(0,3,14,0.6)] hover:border-[rgba(30,68,200,0.4)] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        {/* Status dot + name */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.pulse ? "animate-pulse" : ""}`}
            style={{ background: cfg.color, boxShadow: cfg.pulse ? `0 0 6px ${cfg.color}` : "none" }}
          />
          <span className="text-xs font-black text-white uppercase tracking-wide truncate">
            {agent.name}
          </span>
        </div>

        {/* Rank badge + delete */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 border"
            style={{ color: rankC, borderColor: `${rankC}55`, background: `${rankC}11` }}
          >
            {agent.rank}
          </span>
          <button
            onClick={() => onDelete(agent.agentId)}
            className="text-[#333355] hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Current task */}
      <p className="text-[10px] text-[#7a9abf] mt-1.5 leading-snug truncate pl-4">
        {agent.currentTask || "— awaiting orders"}
      </p>

      {/* Footer stats */}
      <div className="flex items-center gap-3 mt-2 pl-4">
        <span className="flex items-center gap-1 text-[9px] font-bold" style={{ color: cfg.color }}>
          {cfg.icon}{agent.status}
        </span>
        <span className="text-[9px] text-[#555577]">
          {agent.successRate.toFixed(0)}% SR
        </span>
        <span className="text-[9px] text-[#555577]">
          {agent.totalTasksCompleted} tasks
        </span>
        <span className="text-[9px] text-[#333355] ml-auto">
          {timeSince(agent.lastSeen)}
        </span>
      </div>

      {/* Success rate bar */}
      <div className="mt-2 h-0.5 bg-[#0a0a1a] ml-4">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${agent.successRate}%`,
            background: `linear-gradient(90deg, ${cfg.color}66, ${cfg.color})`,
          }}
        />
      </div>
    </motion.div>
  );
}

function GateCard({ quest }: { quest: Quest }) {
  const rankColor = DIFF_RANK_COLOR[quest.difficulty ?? "E"] ?? "#7a9abf";
  const totalObj  = quest.objectives?.length ?? 0;
  const doneObj   = quest.objectives?.filter(o => o.completed).length ?? 0;
  const pct       = totalObj > 0 ? Math.round((doneObj / totalObj) * 100) : 0;

  return (
    <div className="p-3 border border-[rgba(30,68,200,0.2)] bg-[rgba(0,3,14,0.5)] hover:border-[rgba(30,68,200,0.4)] transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[70%]">
          {quest.title}
        </span>
        <span
          className="text-[9px] font-black tracking-widest px-1.5 py-0.5 border flex-shrink-0"
          style={{ color: rankColor, borderColor: `${rankColor}55`, background: `${rankColor}11` }}
        >
          RANK {quest.difficulty ?? "E"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#0a0a1a] border border-[rgba(30,68,200,0.15)] mb-2">
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${rankColor}66, ${rankColor})`,
            boxShadow: pct > 0 ? `0 0 6px ${rankColor}55` : "none",
          }}
        />
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {quest.objectives?.slice(0, 3).map((obj, i) => (
          <div key={i} className="flex items-center justify-between text-[9px]">
            <span className={obj.completed ? "text-[#22c55e] line-through" : "text-[#7a9abf]"}>
              {obj.description}
            </span>
            <span className={obj.completed ? "text-[#22c55e]" : "text-[#555577]"}>
              {obj.progress}/{obj.target}
            </span>
          </div>
        ))}
      </div>

      {/* Rewards */}
      {quest.rewards && (
        <div className="flex gap-3 mt-2 pt-2 border-t border-[rgba(30,68,200,0.1)]">
          {quest.rewards.exp   && <span className="text-[9px] text-[#1e44ff] font-bold">{quest.rewards.exp} EXP</span>}
          {quest.rewards.gold  && <span className="text-[9px] text-[#FFD700] font-bold">{quest.rewards.gold} G</span>}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function MissionControl({ user, quests }: MissionControlProps) {
  const [agents, setAgents]         = useState<Agent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [newAgentId, setNewAgentId] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRank, setNewAgentRank] = useState("Scout");
  const [adding, setAdding]         = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stats    = user?.stats ?? {};
  const hpMax    = 100 + (stats.vitality   ?? 0) * 20;
  const mpMax    = 50  + (stats.intelligence ?? 0) * 10;

  const fetchAgents = useCallback(async () => {
    const token = localStorage.getItem("system_token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/agents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setAgents(await res.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAgents();
    pollRef.current = setInterval(fetchAgents, 5_000); // 5 s live polling
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchAgents]);

  const handleAddAgent = async () => {
    if (!newAgentId.trim() || !newAgentName.trim()) return;
    setAdding(true);
    const token = localStorage.getItem("system_token");
    try {
      const res = await fetch("http://localhost:5000/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ agentId: newAgentId.trim(), name: newAgentName.trim(), rank: newAgentRank }),
      });
      if (res.ok) {
        const agent = await res.json();
        setAgents(prev => [agent, ...prev.filter(a => a.agentId !== agent.agentId)]);
        setNewAgentId(""); setNewAgentName(""); setShowAddForm(false);
      }
    } catch (_) {}
    finally { setAdding(false); }
  };

  const handleDeleteAgent = async (agentId: string) => {
    const token = localStorage.getItem("system_token");
    try {
      await fetch(`http://localhost:5000/api/agents/${agentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgents(prev => prev.filter(a => a.agentId !== agentId));
    } catch (_) {}
  };

  const online   = agents.filter(a => a.status !== "Offline").length;
  const execCnt  = agents.filter(a => a.status === "Executing").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-4 w-full">

      {/* ── LEFT: The Sovereign ──────────────────────────────────────────────── */}
      <div className="sl-panel h-fit">
        <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
        <span className="sl-corner-bl"/><span className="sl-corner-br"/>

        <div className="sl-panel-header">
          <span className="sl-notif-icon">!</span>
          <span>THE SOVEREIGN</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar + identity */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 border-2 border-[#1e44ff] shadow-[0_0_12px_rgba(30,68,255,0.5)] bg-[#00030e] flex items-center justify-center flex-shrink-0">
              <span className="font-caros font-black text-2xl text-[#11D2EF] uppercase">
                {user?.displayName?.[0] ?? "S"}
              </span>
            </div>
            <div>
              <p className="font-caros font-black text-white text-sm tracking-wide">
                {user?.displayName ?? "SOVEREIGN"}
              </p>
              <p className="text-[10px] text-[#11d2ef] tracking-widest uppercase">
                [{user?.title ?? "Awakened"}]
              </p>
              <span className="sl-rank-badge text-[9px]">RANK {user?.rank ?? "E"}</span>
            </div>
          </div>

          {/* Level */}
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#1e44ff] font-bold tracking-widest">LEVEL {stats.level ?? 1}</span>
              <span className="text-[#7a9abf]">{stats.exp ?? 0} EXP</span>
            </div>
            <div className="sl-bar-track">
              <div
                className="sl-bar-fill-exp"
                style={{ width: `${Math.min(100, ((stats.exp ?? 0) / Math.max(1, Math.floor(100 * Math.pow(stats.level ?? 1, 1.5)))) * 100)}%` }}
              />
            </div>
          </div>

          {/* HP / MP */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-6 text-[#5599ff] font-bold">HP</span>
              <div className="sl-bar-track flex-1"><div className="sl-bar-fill-hp" style={{ width: "100%" }} /></div>
              <span className="text-[#7a9abf] w-16 text-right tabular-nums">{hpMax}/{hpMax}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-6 text-[#33bbff] font-bold">MP</span>
              <div className="sl-bar-track flex-1">
                <div className="sl-bar-fill-mp" style={{ width: `${Math.min(100, ((stats.mana ?? 0) / Math.max(1, mpMax)) * 100)}%` }} />
              </div>
              <span className="text-[#7a9abf] w-16 text-right tabular-nums">{stats.mana ?? 0}/{mpMax}</span>
            </div>
          </div>

          {/* Core stats grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-[rgba(30,68,200,0.2)] pt-3">
            {[
              ["STR", stats.strength],
              ["AGI", stats.agility],
              ["VIT", stats.vitality],
              ["INT", stats.intelligence],
              ["SEN", stats.sense],
              ["PTS", stats.statPoints],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between text-[10px]">
                <span className="text-[#7a9abf] font-bold tracking-wider">{k}</span>
                <span className="text-white font-black">{v ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Mission metrics */}
          <div className="border-t border-[rgba(30,68,200,0.2)] pt-3 space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7a9abf] uppercase tracking-wider">Active Agents</span>
              <span className="text-[#11d2ef] font-black">{online}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7a9abf] uppercase tracking-wider">Executing Now</span>
              <span className={`font-black ${execCnt > 0 ? "text-[#11d2ef] animate-pulse" : "text-[#555577]"}`}>{execCnt}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7a9abf] uppercase tracking-wider">Open Gates</span>
              <span className="text-white font-black">{quests.length}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#7a9abf] uppercase tracking-wider">Gold Reserve</span>
              <span className="text-[#FFD700] font-black">{stats.gold ?? 0} G</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Active Gates ─────────────────────────────────────────────── */}
      <div className="sl-panel h-fit">
        <span className="sl-corner-tl"/><span className="sl-corner-tr"/>
        <span className="sl-corner-bl"/><span className="sl-corner-br"/>

        <div className="sl-panel-header">
          <span className="sl-notif-icon">!</span>
          <span>ACTIVE GATES</span>
          <span className="ml-2 text-xs sl-text-dim normal-case font-normal">
            [{quests.length} open]
          </span>
        </div>

        <div className="p-3">
          {quests.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#555577] text-xs uppercase tracking-widest font-bold">
                All Gates Cleared
              </p>
              <p className="text-[#333355] text-[10px] mt-1">No active objectives.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              <AnimatePresence>
                {quests.map((q, i) => (
                  <motion.div
                    key={q._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <GateCard quest={q} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Shadow Army ───────────────────────────────────────────────── */}
      <div className="sl-panel h-fit"
           style={{ borderColor: "rgba(178,0,255,0.35)" }}>
        <span className="sl-corner-tl" style={{ borderColor: "rgba(178,0,255,0.7)" }}/>
        <span className="sl-corner-tr" style={{ borderColor: "rgba(178,0,255,0.7)" }}/>
        <span className="sl-corner-bl" style={{ borderColor: "rgba(178,0,255,0.7)" }}/>
        <span className="sl-corner-br" style={{ borderColor: "rgba(178,0,255,0.7)" }}/>

        <div className="sl-panel-header" style={{ borderColor: "rgba(178,0,255,0.3)" }}>
          <span className="sl-notif-icon" style={{ borderColor: "rgba(178,0,255,0.8)" }}>!</span>
          <span style={{ color: "#b200ff" }}>SHADOW ARMY</span>
          <div className="ml-auto flex items-center gap-1.5">
            {/* Live indicator */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#b200ff] animate-pulse" />
            <span className="text-[9px] text-[#b200ff] font-bold tracking-widest">LIVE</span>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Add agent button */}
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="w-full sl-btn flex items-center justify-center gap-2 text-xs"
            style={{ borderColor: "rgba(178,0,255,0.5)", color: "#b200ff" }}
          >
            <Plus className="w-3 h-3" />
            BIND NEW AGENT
          </button>

          {/* Add agent form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-1 pb-2 border border-[rgba(178,0,255,0.2)] p-2">
                  <input
                    className="w-full bg-black/60 border border-[rgba(178,0,255,0.3)] text-white text-xs px-2 py-1.5 placeholder:text-[#333355] focus:outline-none focus:border-[#b200ff]"
                    placeholder="Agent ID (e.g. my-python-bot)"
                    value={newAgentId}
                    onChange={e => setNewAgentId(e.target.value)}
                  />
                  <input
                    className="w-full bg-black/60 border border-[rgba(178,0,255,0.3)] text-white text-xs px-2 py-1.5 placeholder:text-[#333355] focus:outline-none focus:border-[#b200ff]"
                    placeholder="Display name"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                  />
                  <select
                    className="w-full bg-black/60 border border-[rgba(178,0,255,0.3)] text-white text-xs px-2 py-1.5 focus:outline-none"
                    value={newAgentRank}
                    onChange={e => setNewAgentRank(e.target.value)}
                  >
                    {["Scout","Knight","Commander","General","Marshal"].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAgent}
                    disabled={adding || !newAgentId.trim() || !newAgentName.trim()}
                    className="w-full sl-btn text-xs disabled:opacity-40"
                    style={{ borderColor: "rgba(178,0,255,0.5)", color: "#b200ff" }}
                  >
                    {adding ? "BINDING…" : "CONFIRM BINDING"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agents list */}
          {loading ? (
            <div className="py-8 text-center">
              <p className="text-[#555577] text-[10px] uppercase tracking-widest animate-pulse">
                Scanning for agents…
              </p>
            </div>
          ) : agents.length === 0 ? (
            <div className="py-8 text-center">
              <WifiOff className="w-6 h-6 text-[#333355] mx-auto mb-2" />
              <p className="text-[#555577] text-[10px] uppercase tracking-widest">
                No agents bound
              </p>
              <p className="text-[#333355] text-[9px] mt-1">
                POST to /api/agents/webhook to connect
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              <AnimatePresence>
                {agents.map(agent => (
                  <AgentRow key={agent._id} agent={agent} onDelete={handleDeleteAgent} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Webhook reference */}
          <div className="border-t border-[rgba(178,0,255,0.15)] pt-2">
            <p className="text-[9px] text-[#333355] font-mono break-all leading-relaxed">
              POST /api/agents/webhook<br/>
              Authorization: Bearer $AGENT_WEBHOOK_SECRET
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
