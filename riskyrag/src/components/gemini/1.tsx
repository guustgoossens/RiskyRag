import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Hourglass,
  BrainCircuit,
  ScrollText,
  Play,
  Swords,
  ChevronRight,
  Github,
  Terminal,
  Shield,
  Map as MapIcon,
} from "lucide-react";

const RiskyRagLanding = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-[#D4AF37] selection:text-[#0F172A] overflow-x-hidden">
      {/* Font Imports */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }

        .text-imperial-gold { color: #D4AF37; }
        .bg-imperial-gold { background-color: #D4AF37; }
        .border-imperial-gold { border-color: #D4AF37; }

        .text-cognitive-teal { color: #00FFA3; }
        .bg-cognitive-teal { background-color: #00FFA3; }
        .border-cognitive-teal { border-color: #00FFA3; }

        .bg-parchment { background-color: #F5E6CC; }
        .text-parchment { color: #F5E6CC; }

        .glass-panel {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 163, 0.2);
        }

        .parchment-texture {
          background-color: #F5E6CC;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
        }
      `,
        }}
      />

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#0F172A]/90 backdrop-blur-md border-b border-[#D4AF37]/30 py-3" : "bg-transparent py-6"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Swords className="w-8 h-8 text-imperial-gold" />
            <span className="font-cinzel text-2xl font-bold text-parchment tracking-widest">
              RISKYRAG
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="font-cinzel text-sm text-slate-300 hover:text-imperial-gold transition-colors tracking-wide"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="font-cinzel text-sm text-slate-300 hover:text-imperial-gold transition-colors tracking-wide"
            >
              Gameplay
            </a>
            <Link
              to="/lobby"
              className="px-6 py-2 border border-imperial-gold text-imperial-gold font-cinzel text-sm hover:bg-imperial-gold hover:text-[#0F172A] transition-all duration-300 rounded-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-[#1e293b] to-[#0F172A] opacity-90 z-0"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-imperial-gold/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cognitive-teal/5 rounded-full blur-[100px]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cognitive-teal/30 bg-cognitive-teal/5 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-cognitive-teal animate-pulse shadow-[0_0_10px_#00FFA3]"></span>
            <span className="font-mono text-xs text-cognitive-teal tracking-wider uppercase">
              NexHacks 2026 Prototype
            </span>
          </div>

          <h1 className="font-cinzel text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F5E6CC] to-[#D4AF37] mb-6 drop-shadow-lg tracking-tight">
            THE PAST HAS <br />
            <span className="italic text-parchment/80">EYES</span>
          </h1>

          <p className="font-inter text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A grand strategy game where AI Agents command historical empires.
            <br className="hidden md:block" />
            Innovative{" "}
            <span className="text-cognitive-teal font-medium">
              Temporal RAG
            </span>{" "}
            ensures they only know history... until they rewrite it.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              to="/lobby"
              className="group relative px-8 py-4 bg-imperial-gold text-[#0F172A] font-cinzel font-bold text-lg tracking-wider rounded-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Play Now{" "}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-[#F5E6CC] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
            </Link>

            <Link
              to="/lobby"
              className="flex items-center gap-2 px-8 py-4 border border-cognitive-teal/50 text-cognitive-teal font-mono text-sm tracking-wider hover:bg-cognitive-teal/10 transition-all rounded-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              WATCH DEMO
            </Link>
          </div>
        </div>

        {/* Decorative Grid Bottom */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#0F172A] to-transparent z-10"></div>
        <div
          className="absolute bottom-0 w-full h-[50vh] opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#00FFA3 1px, transparent 1px), linear-gradient(90deg, #00FFA3 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            perspective: "1000px",
            transform: "rotateX(60deg) translateY(100px)",
          }}
        ></div>
      </section>

      {/* The Two Worlds Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-cinzel text-4xl text-parchment mb-4">
              Where History Meets Code
            </h2>
            <div className="w-24 h-1 bg-imperial-gold mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-0 border-4 border-[#0F172A] rounded-xl overflow-hidden shadow-2xl">
            {/* Left: History/Parchment World */}
            <div className="relative h-[400px] parchment-texture p-8 md:p-12 flex flex-col justify-between group">
              <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-multiply"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-[#B91C1C]" />
                  <span className="font-cinzel text-[#B91C1C] font-bold text-xl">
                    The Ottoman Empire
                  </span>
                </div>
                <h3 className="font-cinzel text-3xl text-[#0F172A] font-bold mb-2">
                  1453 A.D.
                </h3>
                <p className="font-inter text-[#0F172A]/80 italic border-l-2 border-[#B91C1C] pl-4">
                  "The walls of Constantinople are formidable, yet stone cannot
                  withstand the destiny of gunpowder."
                </p>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="w-full h-32 border-2 border-[#B91C1C]/30 rounded p-2 bg-white/30 backdrop-blur-sm">
                  {/* Abstract Map Representation */}
                  <div className="w-full h-full relative opacity-60">
                    <MapIcon
                      className="w-full h-full text-[#B91C1C]"
                      strokeWidth={0.5}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#B91C1C] rounded-full animate-ping"></div>
                  </div>
                </div>
                <p className="text-xs font-cinzel text-[#0F172A] mt-2 text-center uppercase tracking-widest">
                  Target Acquired
                </p>
              </div>
            </div>

            {/* Right: AI/Cyber World */}
            <div className="relative h-[400px] bg-[#0F172A] p-8 md:p-12 flex flex-col justify-between border-l border-cognitive-teal/20">
              {/* Background Grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(#00FFA3 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              ></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-cognitive-teal">
                    <Terminal className="w-5 h-5" />
                    <span className="font-mono text-sm">agent_v4.py</span>
                  </div>
                  <span className="px-2 py-1 bg-cognitive-teal/10 text-cognitive-teal text-xs font-mono border border-cognitive-teal/30 rounded">
                    RAG: ACTIVE
                  </span>
                </div>

                <div className="bg-[#0F172A]/70 rounded-lg p-4 font-mono text-xs md:text-sm text-slate-300 border-l-2 border-cognitive-teal">
                  <p className="text-slate-500 mb-1">
                    # Analyzing historical context...
                  </p>
                  <p>
                    <span className="text-purple-400">def</span>{" "}
                    <span className="text-blue-400">query_strategy</span>
                    (target):
                  </p>
                  <p className="pl-4">
                    context = <span className="text-yellow-300">await</span>{" "}
                    history.get(
                  </p>
                  <p className="pl-8 text-green-400">
                    "Constantinople Defenses",
                  </p>
                  <p className="pl-8 text-orange-400">max_date=1453</p>
                  <p className="pl-4">)</p>
                  <p className="pl-4">
                    <span className="text-purple-400">return</span>{" "}
                    generate_tactic(context)
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-auto">
                <div className="flex items-center gap-3 bg-cognitive-teal/5 p-3 rounded border border-cognitive-teal/20">
                  <div className="w-2 h-2 bg-cognitive-teal rounded-full animate-pulse"></div>
                  <p className="font-mono text-cognitive-teal text-xs">
                    {`> Output: Suggest deploying heavy artillery.`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connector Graphic */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0F172A] rounded-full border-4 border-imperial-gold flex items-center justify-center shadow-xl z-20 hidden md:flex">
            <div className="w-8 h-8 text-imperial-gold animate-spin-slow">
              <Hourglass />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-imperial-gold/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-imperial-gold/5 rounded-bl-full transition-transform group-hover:scale-150"></div>
              <Hourglass className="w-12 h-12 text-imperial-gold mb-6" />
              <h3 className="font-cinzel text-xl text-parchment mb-3">
                Temporal RAG
              </h3>
              <p className="font-inter text-slate-400 text-sm leading-relaxed">
                Our AI agents are strictly bound by the timeline. An agent
                playing in 1453 doesn't know about airplanes or the outcome of
                the war. They learn from the past, just like you.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-cognitive-teal/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cognitive-teal/5 rounded-bl-full transition-transform group-hover:scale-150"></div>
              <BrainCircuit className="w-12 h-12 text-cognitive-teal mb-6" />
              <h3 className="font-cinzel text-xl text-[#F5E6CC] mb-3">
                LLM Personas
              </h3>
              <p className="font-inter text-slate-400 text-sm leading-relaxed">
                Face off against diverse models like GPT-4, Claude, and Llama.
                Each model adopts a specific historical persona, from the
                aggressive conqueror to the diplomatic merchant.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-imperial-gold/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-imperial-gold/5 rounded-bl-full transition-transform group-hover:scale-150"></div>
              <ScrollText className="w-12 h-12 text-imperial-gold mb-6" />
              <h3 className="font-cinzel text-xl text-parchment mb-3">
                Living History
              </h3>
              <p className="font-inter text-slate-400 text-sm leading-relaxed">
                Diplomacy isn't just a menu. Chat with your opponents. Ask them
                why they invaded. Their answers are generated in real-time based
                on historical context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Swords className="w-6 h-6 text-slate-500" />
            <span className="font-cinzel text-slate-500 font-bold tracking-widest">
              RISKYRAG
            </span>
          </Link>

          <div className="text-slate-600 text-sm font-inter">
            Built for <span className="text-imperial-gold">NexHacks 2026</span>{" "}
            • 48 Hour Challenge
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-500 hover:text-[#F5E6CC] transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="font-mono text-xs">View Source</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default RiskyRagLanding;
