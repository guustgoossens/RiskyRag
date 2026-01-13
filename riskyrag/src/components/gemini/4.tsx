import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Scroll,
  Sword,
  Shield,
  Handshake,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Globe,
} from "lucide-react";

/**
 * RISKYRAG DESIGN SYSTEM CONSTANTS
 * Directly implementing the specific hex codes requested.
 */
const COLORS = {
  voidNavy: "#0F172A",
  parchment: "#F5E6CC",
  imperialGold: "#D4AF37",
  cognitiveTeal: "#00FFA3",
  warCrimson: "#C0392B",
  safeEmerald: "#27AE60",
  ottomanRed: "#B91C1C",
  slate800: "#1E293B",
};

/**
 * Mock Data for Simulation
 */
const NATIONS = [
  {
    id: "ottoman",
    name: "Ottoman Empire",
    leader: "Sultan Mehmed II",
    yearLimit: 1453,
    color: COLORS.ottomanRed,
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Gentile_Bellini_003.jpg/440px-Gentile_Bellini_003.jpg", // Public domain placeholder
    greeting:
      "The Red Apple beckons. Speak quickly, for my janissaries grow impatient.",
  },
  {
    id: "venice",
    name: "Republic of Venice",
    leader: "Doge Francesco Foscari",
    yearLimit: 1457,
    color: "#0369A1",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Lazzaro_Bastiani_003.jpg/440px-Lazzaro_Bastiani_003.jpg",
    greeting:
      "Coin or cannon? The Serenissima is prepared for either, provided the terms are... profitable.",
  },
];

const INITIAL_MESSAGES: Record<string, Array<{ id: number; type: string; text: string; timestamp: string }>> = {
  ottoman: [
    {
      id: 1,
      type: "ai",
      text: "The walls of Constantinople are formidable, but stone cannot stop destiny. What brings a foreign envoy to my tent?",
      timestamp: "1453 AD",
    },
  ],
  venice: [
    {
      id: 1,
      type: "ai",
      text: "Greetings. Our spies reported your arrival days ago. I assume you wish to discuss trade rights in the Aegean?",
      timestamp: "1453 AD",
    },
  ],
};

const RAG_LOGS = [
  {
    id: 1,
    source: "Wikipedia: Fall of Constantinople",
    date: "1453",
    snippet: "Mehmed II employed a massive cannon designed by Orban...",
  },
  {
    id: 2,
    source: "Diplomatic Archives: Venetian-Ottoman Treaty",
    date: "1446",
    snippet: "Trade agreements maintained despite rising tensions...",
  },
];

interface DiplomacyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNationId: string;
  onSwitchNation: (nationId: string) => void;
}

const DiplomacyDrawer = ({
  isOpen,
  onClose,
  activeNationId,
  onSwitchNation,
}: DiplomacyDrawerProps) => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showRagPanel, setShowRagPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeNation =
    NATIONS.find((n) => n.id === activeNationId) || NATIONS[0];
  const currentMessages = messages[activeNationId] || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, isThinking]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add Human Message
    const newUserMsg = {
      id: Date.now(),
      type: "human",
      text: inputValue,
      timestamp: "1453 AD",
    };
    setMessages((prev) => ({
      ...prev,
      [activeNationId]: [...(prev[activeNationId] || []), newUserMsg],
    }));
    setInputValue("");
    setIsThinking(true);

    // Simulate AI Response
    setTimeout(() => {
      const newAiMsg = {
        id: Date.now() + 1,
        type: "ai",
        text: `The archives of ${activeNation.yearLimit} offer me guidance. I shall consider your proposal, provided it respects our sovereignty.`,
        timestamp: "1453 AD",
      };
      setMessages((prev) => ({
        ...prev,
        [activeNationId]: [...(prev[activeNationId] || []), newAiMsg],
      }));
      setIsThinking(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`fixed top-[64px] right-0 h-[calc(100vh-64px)] w-[480px] z-40 transform transition-transform duration-300 ease-out shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col border-l-4 border-[#D4AF37] ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      style={{ backgroundColor: COLORS.parchment }} // Fallback
    >
      {/* Background Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50 mix-blend-multiply"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/aged-paper.png")`,
          backgroundColor: "#F5E6CC",
        }}
      />

      {/* --- HEADER --- */}
      <header className="relative bg-[#0F172A] p-4 flex items-center justify-between border-b-2 border-[#D4AF37] z-10">
        <div className="flex items-center gap-3">
          <Scroll className="text-[#D4AF37] w-6 h-6" />
          <div>
            <h2 className="text-[#F5E6CC] font-cinzel tracking-widest text-lg font-bold">
              DIPLOMACY
            </h2>
            <div className="flex items-center gap-2">
              {/* Nation Tabs */}
              {NATIONS.map((nation) => (
                <button
                  key={nation.id}
                  onClick={() => onSwitchNation(nation.id)}
                  className={`w-6 h-6 rounded-full border border-[#D4AF37] transition-all overflow-hidden ${activeNationId === nation.id ? "ring-2 ring-[#00FFA3] scale-110" : "opacity-50 hover:opacity-100"}`}
                >
                  <img
                    src={nation.avatarUrl}
                    alt={nation.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#D4AF37] hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* --- SCROLLABLE CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 custom-scrollbar">
        {/* Leader Profile Header */}
        <div className="text-center mb-8 border-b border-[#D4AF37]/30 pb-4">
          <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#D4AF37] shadow-lg overflow-hidden mb-3 relative group">
            <img
              src={activeNation.avatarUrl}
              alt="Leader"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#00FFA3]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="font-cinzel text-2xl text-[#0F172A] font-bold">
            {activeNation.leader}
          </h3>
          <p className="font-sans text-sm text-[#0F172A]/70 uppercase tracking-wide">
            {activeNation.name}
          </p>

          {/* Temporal Badge */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F172A] border border-[#00FFA3]">
            <BrainCircuit className="w-3 h-3 text-[#00FFA3]" />
            <span className="text-[#00FFA3] text-xs font-mono">
              KNOWLEDGE ≤ {activeNation.yearLimit}
            </span>
          </div>
        </div>

        {/* Messages */}
        {currentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.type === "human" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 shadow-md relative ${
                msg.type === "human"
                  ? "bg-[#1E293B] text-white rounded-br-none border border-slate-600"
                  : "bg-[#F5E6CC] text-[#0F172A] rounded-bl-none border border-[#D4AF37]/40 font-cinzel"
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <span
                className={`text-[10px] block mt-2 opacity-50 ${msg.type === "human" ? "text-right" : "text-left"}`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* AI Thinking State */}
        {isThinking && (
          <div className="flex justify-start w-full">
            <div className="bg-[#0F172A]/90 backdrop-blur-sm p-3 rounded-lg border border-[#00FFA3] flex items-center gap-3 animate-pulse">
              <BrainCircuit className="w-4 h-4 text-[#00FFA3] animate-spin" />
              <span className="text-[#00FFA3] font-mono text-xs">
                Consulting court historians...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- RAG CONTEXT PANEL (Collapsible) --- */}
      <div
        className={`relative z-20 border-t border-[#00FFA3]/30 bg-[#0F172A]/95 backdrop-blur transition-all duration-300 ${showRagPanel ? "h-48" : "h-10"}`}
      >
        <button
          onClick={() => setShowRagPanel(!showRagPanel)}
          className="w-full h-10 flex items-center justify-between px-4 bg-[#0F172A] border-b border-[#00FFA3]/20 hover:bg-[#1E293B] transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00FFA3] font-mono text-xs tracking-wider">
              AI TEMPORAL LOGS
            </span>
          </div>
          {showRagPanel ? (
            <ChevronDown className="w-4 h-4 text-[#00FFA3]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[#00FFA3]" />
          )}
        </button>

        {showRagPanel && (
          <div className="p-4 overflow-y-auto h-36 space-y-3 font-mono text-xs">
            {RAG_LOGS.map((log) => (
              <div
                key={log.id}
                className="text-slate-400 border-l-2 border-[#00FFA3]/30 pl-2"
              >
                <div className="flex justify-between text-[#00FFA3]/70 mb-1">
                  <span>src: {log.source}</span>
                  <span>[{log.date}]</span>
                </div>
                <p className="text-slate-300">"{log.snippet}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ACTION BAR & INPUT --- */}
      <div className="relative z-20 p-4 bg-[#F5E6CC] border-t border-[#D4AF37]">
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button className="flex flex-col items-center justify-center p-2 rounded bg-[#0F172A]/5 hover:bg-[#0F172A]/10 border border-[#D4AF37]/30 transition-colors group">
            <Handshake className="w-5 h-5 text-[#0F172A] group-hover:text-[#D4AF37] mb-1" />
            <span className="text-[10px] font-cinzel uppercase font-bold text-[#0F172A]">
              Alliance
            </span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 rounded bg-[#0F172A]/5 hover:bg-[#0F172A]/10 border border-[#D4AF37]/30 transition-colors group">
            <Shield className="w-5 h-5 text-[#0F172A] group-hover:text-[#27AE60] mb-1" />
            <span className="text-[10px] font-cinzel uppercase font-bold text-[#0F172A]">
              Truce
            </span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 rounded bg-[#C0392B]/10 hover:bg-[#C0392B]/20 border border-[#C0392B]/30 transition-colors group">
            <Sword className="w-5 h-5 text-[#C0392B] mb-1" />
            <span className="text-[10px] font-cinzel uppercase font-bold text-[#C0392B]">
              Declare War
            </span>
          </button>
        </div>

        {/* Input Field */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeNation.leader}...`}
              className="w-full bg-white/50 border border-[#D4AF37] rounded px-4 py-2 text-[#0F172A] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-cinzel text-sm"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className={`p-2 rounded bg-[#0F172A] text-[#D4AF37] border border-[#D4AF37] transition-all ${inputValue.trim() ? "opacity-100 hover:bg-[#1E293B]" : "opacity-50 cursor-not-allowed"}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component to Demonstrate the Drawer
export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeNationId, setActiveNationId] = useState("ottoman");

  return (
    <div className="w-full h-screen bg-[#0F172A] relative overflow-hidden flex flex-col font-sans">
      {/* Styles for Fonts (Simulated for this file) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');
        .font-serif { font-family: 'Cinzel', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #D4AF37; border-radius: 3px; }
      `}</style>

      {/* --- HUD / TOP BAR --- */}
      <header className="h-16 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B] flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="text-[#F5E6CC] font-cinzel text-xl tracking-widest">
            RISKYRAG
          </h1>
        </div>
        <div className="text-[#D4AF37] font-cinzel text-3xl font-bold">
          1453 AD
        </div>
        <div className="w-24 text-right text-slate-400 text-sm">Turn 12</div>
      </header>

      {/* --- MOCK GAME BOARD (BACKGROUND) --- */}
      <main className="flex-1 relative bg-[#1E293B] overflow-hidden">
        {/* Abstract Map Nodes */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #D4AF37 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Mock Territory - Constantinople */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
          <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37] bg-[#B91C1C]/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_#B91C1C]">
            <span className="text-[#F5E6CC] font-cinzel font-bold text-center">
              CONSTANTINOPLE
              <br />
              <span className="text-sm">Under Siege</span>
            </span>
          </div>
        </div>

        {/* Floating Action Button to Toggle Drawer */}
        {!isDrawerOpen && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="absolute right-6 top-6 bg-[#D4AF37] hover:bg-[#F5E6CC] text-[#0F172A] px-6 py-3 rounded shadow-lg font-cinzel font-bold tracking-wide transition-all z-10 flex items-center gap-2"
          >
            <Scroll className="w-5 h-5" />
            OPEN DIPLOMACY
          </button>
        )}
      </main>

      {/* --- DIPLOMACY DRAWER --- */}
      <DiplomacyDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeNationId={activeNationId}
        onSwitchNation={setActiveNationId}
      />
    </div>
  );
}
