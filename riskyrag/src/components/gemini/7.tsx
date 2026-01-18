import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Terminal,
  Database,
  ShieldAlert,
  Cpu,
  Clock,
  Search,
  ChevronRight,
  Play,
  Pause,
  Filter,
  CheckCircle,
  Lock,
} from "lucide-react";

// --- TypeScript Interfaces ---

interface Agent {
  id: string;
  name: string;
  model: string;
  status: string;
  color: string;
  winProb: number;
  tokens: number;
  avatar: string;
}

interface LogItem {
  id: number;
  timestamp: string;
  agent: string;
  type: string;
  content: string;
}

interface QueuedLogItem {
  type: string;
  content: string;
  delay: number;
}

interface CircularGaugeProps {
  value: number;
  color: string;
  label: string;
}

interface AgentCardProps {
  agent: Agent;
  active: boolean;
}

interface LogEntryProps {
  log: LogItem;
}

interface ChainOfThoughtStepProps {
  step: {
    id: number;
    title: string;
    description: string;
    status: "done" | "active" | "pending";
  };
  isLast: boolean;
}

// --- MOCK DATA & CONFIG ---

const AGENTS: Agent[] = [
  {
    id: "ottoman",
    name: "Ottoman Empire",
    model: "GPT-4-Turbo",
    status: "EXECUTING",
    color: "#B91C1C", // Ottoman Red
    winProb: 65,
    tokens: 12450,
    avatar:
      "https://api.dicebear.com/7.x/initials/svg?seed=OE&backgroundColor=B91C1C",
  },
  {
    id: "byzantine",
    name: "Byzantine Empire",
    model: "Claude-3-Opus",
    status: "DEFENDING",
    color: "#7E22CE", // Byzantine Purple
    winProb: 35,
    tokens: 9820,
    avatar:
      "https://api.dicebear.com/7.x/initials/svg?seed=BE&backgroundColor=7E22CE",
  },
];

const INITIAL_LOGS: LogItem[] = [
  {
    id: 1,
    timestamp: "14:32:01",
    agent: "ottoman",
    type: "info",
    content: "Turn started. Analyzing strategic position.",
  },
  {
    id: 2,
    timestamp: "14:32:02",
    agent: "ottoman",
    type: "tool",
    content: 'get_territory_status("Anatolia")',
  },
  {
    id: 3,
    timestamp: "14:32:02",
    agent: "system",
    type: "response",
    content:
      '{ troops: 32, morale: "HIGH", adjacent: ["Constantinople", "Aegean"] }',
  },
  {
    id: 4,
    timestamp: "14:32:04",
    agent: "ottoman",
    type: "rag",
    content:
      'query_history("Byzantine wall weaknesses", max_date="1453-04-01")',
  },
  {
    id: 5,
    timestamp: "14:32:05",
    agent: "system",
    type: "rag-filter",
    content: "TEMPORAL FILTER ACTIVE: Limit 1453-04-01",
  },
];

const QUEUED_LOGS: QueuedLogItem[] = [
  {
    type: "rag-success",
    content: "Retrieved 3 records (1422 siege, 1204 crusade, 1452 repairs)",
    delay: 1000,
  },
  {
    type: "rag-blocked",
    content: "BLOCKED: Record from 1453-05-29 (Future Event - The Fall)",
    delay: 2000,
  },
  {
    type: "thought",
    content:
      'Thinking: "The walls were breached previously by crusaders. Current intel suggests structural weakness near the Gate of St. Romanus."',
    delay: 3500,
  },
  {
    type: "tool",
    content:
      'move_troops(source="Anatolia", target="Constantinople_Front", amount=20)',
    delay: 5000,
  },
  { type: "system", content: "Movement executing...", delay: 6000 },
  { type: "info", content: "Siege engines deploying.", delay: 7000 },
  {
    type: "thought",
    content: 'Thinking: "I need to block their supply lines from the sea."',
    delay: 9000,
  },
  {
    type: "rag",
    content:
      'query_history("Golden Horn defense chain", max_date="1453-04-01")',
    delay: 10000,
  },
  {
    type: "rag-filter",
    content: "TEMPORAL FILTER ACTIVE: Limit 1453-04-01",
    delay: 10500,
  },
  {
    type: "rag-success",
    content: "Retrieved 2 records (Chain mechanism details)",
    delay: 11500,
  },
];

// --- COMPONENTS ---

const CircularGauge = ({ value, color, label }: CircularGaugeProps) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-20 h-20">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#1E293B"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono font-bold text-slate-200">
            {value}%
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 font-mono mt-1 uppercase">
        {label}
      </span>
    </div>
  );
};

const AgentCard = ({ agent, active }: AgentCardProps) => (
  <div
    className={`p-4 rounded-lg border transition-all duration-300 ${
      active
        ? "bg-slate-800/80 border-[#00FFA3] shadow-[0_0_15px_rgba(0,255,163,0.2)]"
        : "bg-slate-800/40 border-slate-700 opacity-70"
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-slate-900 ${
            agent.id === "ottoman" ? "border-[#B91C1C]" : "border-[#7E22CE]"
          }`}
        >
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200 font-cinzel tracking-wide">
            {agent.name}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {agent.model}
          </span>
        </div>
      </div>
      {active && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFA3]"></span>
        </span>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2 mb-2">
      <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
        <div className="text-[10px] text-slate-500 uppercase font-mono">
          Status
        </div>
        <div className="text-xs text-[#00FFA3] font-mono font-bold animate-pulse">
          {agent.status}
        </div>
      </div>
      <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
        <div className="text-[10px] text-slate-500 uppercase font-mono">
          Tokens
        </div>
        <div className="text-xs text-slate-300 font-mono">
          {agent.tokens.toLocaleString()}
        </div>
      </div>
    </div>

    <CircularGauge
      value={agent.winProb}
      color={agent.color}
      label="Win Probability"
    />
  </div>
);

const LogEntry = ({ log }: LogEntryProps) => {
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "tool":
        return "text-[#D4AF37]"; // Imperial Gold
      case "response":
        return "text-slate-400";
      case "rag":
        return "text-[#00FFA3]"; // Cognitive Teal
      case "rag-filter":
        return "text-cyan-400 font-bold";
      case "rag-blocked":
        return "text-[#C0392B] bg-[#C0392B]/10 border-l-2 border-[#C0392B] pl-2";
      case "rag-success":
        return "text-[#00FFA3]";
      case "thought":
        return "text-slate-500 italic";
      default:
        return "text-slate-300";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "tool":
        return <Terminal size={14} className="mt-1 flex-shrink-0" />;
      case "rag":
        return <Search size={14} className="mt-1 flex-shrink-0" />;
      case "rag-filter":
        return <Filter size={14} className="mt-1 flex-shrink-0" />;
      case "rag-blocked":
        return <Lock size={14} className="mt-1 flex-shrink-0" />;
      case "rag-success":
        return <Database size={14} className="mt-1 flex-shrink-0" />;
      case "thought":
        return <Cpu size={14} className="mt-1 flex-shrink-0" />;
      default:
        return <ChevronRight size={14} className="mt-1 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={`font-mono text-sm py-1.5 px-2 flex gap-3 hover:bg-slate-800/50 rounded transition-colors ${getTypeStyles(log.type)}`}
    >
      <span className="text-slate-600 text-xs w-16 flex-shrink-0 select-none">
        {log.timestamp}
      </span>
      <div className="flex gap-2 w-full">
        {getIcon(log.type)}
        <span className="break-all">{log.content}</span>
      </div>
    </div>
  );
};

const TemporalChart = () => (
  <div className="h-40 flex items-end gap-1 mt-4 px-2 border-b border-l border-slate-700 relative">
    {/* Y Axis Grid */}
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-px bg-slate-800/50" />
      ))}
    </div>

    {/* Bars */}
    {[1400, 1410, 1420, 1430, 1440, 1450].map((year) => {
      const height = Math.random() * 60 + 20;
      return (
        <div key={year} className="flex-1 flex flex-col items-center group">
          <div
            className="w-full bg-[#00FFA3]/40 hover:bg-[#00FFA3] transition-all rounded-t-sm relative"
            style={{ height: `${height}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-[#00FFA3] text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#00FFA3]/30">
              {Math.floor(height * 2)} docs
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">{year}</span>
        </div>
      );
    })}
    {/* Future/Blocked Bar */}
    <div className="flex-1 flex flex-col items-center group">
      <div className="w-full bg-[#C0392B]/40 hover:bg-[#C0392B] transition-all rounded-t-sm h-[30%] relative pattern-diagonal-lines">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-[#C0392B] text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-[#C0392B]/30">
          BLOCKED
        </div>
      </div>
      <span className="text-[10px] text-[#C0392B] mt-1 font-bold">1460+</span>
    </div>
  </div>
);

const ChainOfThoughtStep = ({ step, isLast }: ChainOfThoughtStepProps) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center z-10
        ${
          step.status === "done"
            ? "bg-[#00FFA3] text-slate-900"
            : step.status === "active"
              ? "bg-[#00FFA3]/20 border border-[#00FFA3] text-[#00FFA3] animate-pulse"
              : "bg-slate-800 border border-slate-700 text-slate-500"
        }`}
      >
        {step.status === "done" ? (
          <CheckCircle size={14} />
        ) : step.status === "active" ? (
          <Activity size={14} />
        ) : (
          <span className="text-xs">{step.id}</span>
        )}
      </div>
      {!isLast && (
        <div
          className={`w-0.5 flex-1 my-1 ${step.status === "done" ? "bg-[#00FFA3]/50" : "bg-slate-800"}`}
        />
      )}
    </div>
    <div className="pb-6">
      <h4
        className={`text-sm font-mono font-bold ${step.status === "active" ? "text-[#00FFA3]" : "text-slate-300"}`}
      >
        {step.title}
      </h4>
      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
    </div>
  </div>
);

// --- MAIN APP ---

const RiskyRagDebugMonitor = () => {
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(2);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Logic to simulate streaming logs
  useEffect(() => {
    if (!isPlaying) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    QUEUED_LOGS.forEach((logItem) => {
      const t = setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLogs((prev) => [
          ...prev,
          { ...logItem, id: Date.now(), timestamp, agent: "ottoman" },
        ]);

        // Update CoT progress based on logs
        if (logItem.type === "tool") setActiveStep(3);
        if (logItem.type === "info") setActiveStep(4);
      }, logItem.delay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isPlaying]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const cotSteps: ChainOfThoughtStepProps["step"][] = [
    {
      id: 1,
      title: "GameState Analysis",
      description: "Evaluated troop counts and adjacency matrix.",
      status: "done" as const,
    },
    {
      id: 2,
      title: "Historical Context Retrieval",
      description:
        "Querying RAG for weaknesses in Constantinople defenses (Pre-1453).",
      status: activeStep > 2 ? "done" : activeStep === 2 ? "active" : "pending",
    },
    {
      id: 3,
      title: "Action Formulation",
      description: "Generating tool calls based on context and strategy.",
      status: activeStep > 3 ? "done" : activeStep === 3 ? "active" : "pending",
    },
    {
      id: 4,
      title: "Execution",
      description: "Validating move legality and resolving battle mechanics.",
      status: activeStep > 4 ? "done" : activeStep === 4 ? "active" : "pending",
    },
  ];

  return (
    <div className="w-full h-screen bg-[#0F172A] text-slate-300 overflow-hidden flex flex-col font-sans selection:bg-[#00FFA3]/20">
      {/* --- HEADER --- */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Terminal className="text-[#00FFA3]" size={20} />
          <h1 className="font-mono font-bold tracking-wider text-[#00FFA3]">
            RISKYRAG <span className="text-slate-500">///</span> DEBUG_MONITOR
          </h1>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFA3]"></span>
            </span>
            <span className="text-xs font-mono font-bold text-[#00FFA3] tracking-widest">
              LIVE_CONNECTION
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800"></div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Clock size={14} />
            <span>SESSION: 00:42:15</span>
          </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: AGENT STATUS */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Cpu size={14} /> Active Agents
            </h2>
            <div className="space-y-4">
              <AgentCard agent={AGENTS[0]} active={true} />
              <AgentCard agent={AGENTS[1]} active={false} />
            </div>
          </div>

          <div className="mt-auto p-4 rounded bg-slate-800/30 border border-slate-700">
            <h3 className="text-xs font-mono text-slate-400 mb-2">
              SYSTEM LOAD
            </h3>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mb-1">
              <div className="bg-[#00FFA3] h-1.5 rounded-full w-[45%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>RAG: 45%</span>
              <span>Tokens/s: 240</span>
            </div>
          </div>
        </aside>

        {/* CENTER: LOGS */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0F172A] relative">
          {/* Toolbar */}
          <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-colors ${isPlaying ? "text-[#00FFA3]" : ""}`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1"></div>
              <button className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800">
                <Filter size={12} /> Filter
              </button>
              <button className="text-xs font-mono text-[#00FFA3] bg-[#00FFA3]/10 border border-[#00FFA3]/20 px-2 py-0.5 rounded ml-2">
                Show: ALL
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-600">
              Buffer: 4.2KB
            </span>
          </div>

          {/* Terminal */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {logs.map((log) => (
              <LogEntry key={log.id} log={log} />
            ))}

            {/* Blinking Cursor at end */}
            <div className="h-4 w-2 bg-[#00FFA3] animate-pulse mt-2 inline-block"></div>
          </div>

          {/* Bottom Overlay for Controls? (Optional) */}
        </main>

        {/* RIGHT: METRICS & COT */}
        <aside className="w-96 border-l border-slate-800 bg-slate-900/50 flex flex-col">
          {/* Top: RAG Stats */}
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database size={14} /> RAG Performance
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                <div className="text-2xl font-mono font-bold text-slate-200">
                  234
                </div>
                <div className="text-[10px] text-slate-500 uppercase mt-1">
                  Queries Processed
                </div>
              </div>
              <div className="bg-[#C0392B]/10 p-3 rounded border border-[#C0392B]/30">
                <div className="text-2xl font-mono font-bold text-[#C0392B]">
                  47
                </div>
                <div className="text-[10px] text-[#C0392B]/70 uppercase mt-1 flex items-center gap-1">
                  <ShieldAlert size={10} /> Future Events Blocked
                </div>
              </div>
            </div>

            <div className="mb-2 flex justify-between items-end">
              <span className="text-[10px] text-slate-500 font-mono">
                Retrieved Doc Distribution (Year)
              </span>
              <span className="text-[10px] text-[#C0392B] font-mono font-bold">
                Limit: 1453
              </span>
            </div>
            <TemporalChart />
          </div>

          {/* Bottom: Chain of Thought */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={14} /> Reasoning Trace
            </h2>
            <div className="space-y-0">
              {cotSteps.map((step, idx) => (
                <ChainOfThoughtStep
                  key={step.id}
                  step={step}
                  isLast={idx === cotSteps.length - 1}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RiskyRagDebugMonitor;
