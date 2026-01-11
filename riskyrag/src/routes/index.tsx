import { createFileRoute, Link } from "@tanstack/react-router";
import { Swords, Brain, Clock, Users, BookOpen, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const features = [
    {
      icon: <Clock className="w-10 h-10 text-[#00FFA3]" />,
      title: "Temporal RAG",
      description:
        "AI agents only know history up to the game's current year. No future knowledge leakage.",
    },
    {
      icon: <Brain className="w-10 h-10 text-[#00FFA3]" />,
      title: "LLM Agents",
      description:
        "Play against GPT-4, Claude, or Llama. Each brings unique strategic reasoning.",
    },
    {
      icon: <Users className="w-10 h-10 text-[#D4AF37]" />,
      title: "Multiplayer",
      description:
        "Real-time gameplay powered by Convex. Human vs AI or AI vs AI tournaments.",
    },
    {
      icon: <BookOpen className="w-10 h-10 text-[#D4AF37]" />,
      title: "Educational",
      description:
        "Learn history by playing. Ask AI advisors about events, tactics, and cultures.",
    },
    {
      icon: <Swords className="w-10 h-10 text-[#C0392B]" />,
      title: "Grand Strategy",
      description:
        "Classic Risk-style gameplay with diplomacy, alliances, and betrayal.",
    },
    {
      icon: <Trophy className="w-10 h-10 text-[#D4AF37]" />,
      title: "Benchmarking",
      description:
        "Compare LLM strategic reasoning. Track win rates, tool usage, and historical accuracy.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero Section */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-transparent" />

        {/* Parchment texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Swords className="w-16 h-16 text-[#D4AF37]" />
          </div>

          {/* Title */}
          <h1 className="font-cinzel text-6xl md:text-7xl font-bold text-[#F5E6CC] uppercase tracking-wider mb-4">
            RiskyRag
          </h1>

          <p className="text-xl text-[#D4AF37] font-cinzel uppercase tracking-widest mb-6">
            Where History Meets AI
          </p>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-inter">
            A grand strategy game where LLMs play historically accurate Risk.
            Choose a year. The AI only knows history up to that point.
          </p>

          {/* Demo Box */}
          <div className="max-w-lg mx-auto mb-10 p-4 bg-[#0F172A]/80 border border-[#00FFA3]/30 rounded-lg backdrop-blur-sm">
            <div className="font-mono text-sm text-left">
              <div className="text-slate-500 mb-2">{"// Game: 1453"}</div>
              <div className="text-[#F5E6CC]">
                <span className="text-[#D4AF37]">You:</span> "Will Constantinople
                fall?"
              </div>
              <div className="text-[#F5E6CC] mt-2">
                <span className="text-[#00FFA3]">Ottoman AI:</span> "The siege
                continues. The outcome remains uncertain..."
              </div>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#00FFA3]/10 border border-[#00FFA3]/30 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                <span className="text-[#00FFA3] text-xs uppercase tracking-wider">
                  Knowledge cutoff: May 1453
                </span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/lobby"
              className="px-8 py-4 bg-[#D4AF37] text-[#0F172A] font-cinzel uppercase tracking-wider rounded-lg hover:bg-[#F5E6CC] transition-colors shadow-lg shadow-[#D4AF37]/25"
            >
              Start Campaign
            </Link>
            <Link
              to="/dev/monitor"
              className="px-8 py-4 bg-transparent border border-[#00FFA3]/50 text-[#00FFA3] font-mono uppercase tracking-wider rounded-lg hover:bg-[#00FFA3]/10 transition-colors"
            >
              View AI Monitor
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="font-cinzel text-3xl text-[#F5E6CC] uppercase tracking-wider text-center mb-12">
          The Innovation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-[#0F172A]/50 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-[#D4AF37]/50 transition-all duration-300"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-cinzel text-xl text-[#F5E6CC] uppercase tracking-wide mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 font-inter leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Historical Scenarios Preview */}
      <section className="py-20 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-cinzel text-3xl text-[#F5E6CC] uppercase tracking-wider text-center mb-12">
            Historical Scenarios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                year: 1453,
                title: "Fall of Constantinople",
                nations: ["Ottomans", "Byzantines", "Venice"],
              },
              {
                year: 1776,
                title: "American Revolution",
                nations: ["Britain", "France", "Colonies"],
              },
              {
                year: 1914,
                title: "The Great War",
                nations: ["Germany", "France", "Britain"],
              },
            ].map((scenario) => (
              <div
                key={scenario.year}
                className="relative p-6 bg-gradient-to-b from-slate-800/50 to-transparent border border-slate-700 rounded-xl overflow-hidden group hover:border-[#D4AF37]/50 transition-colors"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl" />

                <span className="font-mono text-[#D4AF37] text-sm">
                  {scenario.year}
                </span>
                <h3 className="font-cinzel text-2xl text-[#F5E6CC] uppercase mt-2 mb-4">
                  {scenario.title}
                </h3>

                <div className="flex flex-wrap gap-2">
                  {scenario.nations.map((nation) => (
                    <span
                      key={nation}
                      className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded"
                    >
                      {nation}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center">
        <p className="text-slate-500 font-inter text-sm">
          Built for{" "}
          <span className="text-[#D4AF37]">NexHacks 2026</span>
        </p>
        <p className="text-slate-600 text-xs mt-2 font-mono">
          Temporal RAG • LLM Agents • Real-time Multiplayer
        </p>
      </footer>
    </div>
  );
}
