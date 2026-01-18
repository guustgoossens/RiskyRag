/**
 * DiplomaticScroll - Theatrical popup for diplomatic messages
 * Full-screen overlay with parchment unfurl animation
 * Shows "A letter from..." with wax seal visual
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Check, XCircle, MessageCircle } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface DiplomaticScrollProps {
  negotiation: Doc<"negotiations"> & {
    senderNation: string;
    senderColor: string;
  };
  recipientNation: string;
  isOpen: boolean;
  onClose: () => void;
  onRespond: (
    status: "accepted" | "rejected" | "countered",
    message?: string
  ) => void;
  isHumanPlayer: boolean;
}

// Nation-specific seal colors and mottos
const NATION_SEALS: Record<string, { color: string; motto: string }> = {
  "Ottoman Empire": {
    color: "#22c55e",
    motto: "The Sublime Porte",
  },
  "Byzantine Empire": {
    color: "#a855f7",
    motto: "Basileia Rhōmaiōn",
  },
  Venice: {
    color: "#3b82f6",
    motto: "Serenissima Repubblica",
  },
  Genoa: {
    color: "#ef4444",
    motto: "Respublica Ianuensis",
  },
  Union: {
    color: "#3b82f6",
    motto: "E Pluribus Unum",
  },
  Confederacy: {
    color: "#6b7280",
    motto: "Deo Vindice",
  },
};

export function DiplomaticScroll({
  negotiation,
  recipientNation,
  isOpen,
  onClose,
  onRespond,
  isHumanPlayer,
}: DiplomaticScrollProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const seal = NATION_SEALS[negotiation.senderNation] ?? {
    color: "#64748b",
    motto: "Unknown",
  };

  // Trigger animation on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResponse = (status: "accepted" | "rejected" | "countered") => {
    if (status === "countered" && !responseMessage.trim()) {
      setShowResponse(true);
      return;
    }
    onRespond(status, status === "countered" ? responseMessage : undefined);
    setResponseMessage("");
    setShowResponse(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Scroll container with unfurl animation */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-4 transform transition-all duration-700",
          isAnimating
            ? "scale-90 opacity-0 translate-y-8"
            : "scale-100 opacity-100 translate-y-0"
        )}
      >
        {/* Parchment background */}
        <div
          className="relative bg-[#F5E6CC] rounded-lg shadow-2xl overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a76a' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-[#0F172A]/10 hover:bg-[#0F172A]/20 text-[#0F172A]/60 hover:text-[#0F172A] transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Wax seal */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: seal.color }}
            >
              <div className="text-white text-xs font-cinzel font-bold text-center leading-tight px-1">
                {negotiation.senderNation.split(" ")[0].slice(0, 3).toUpperCase()}
              </div>
            </div>
            {/* Wax drips */}
            <div
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-4 rounded-b-full"
              style={{ backgroundColor: seal.color }}
            />
          </div>

          {/* Content */}
          <div className="pt-14 px-8 pb-8">
            {/* Header */}
            <div className="text-center mb-6">
              <p className="text-[#0F172A]/50 text-sm italic mb-1">
                A letter from
              </p>
              <h2
                className="text-2xl font-cinzel font-bold"
                style={{ color: seal.color }}
              >
                {negotiation.senderNation}
              </h2>
              <p className="text-[#0F172A]/40 text-xs italic mt-1">
                {seal.motto}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#0F172A]/20" />
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: seal.color }}
              />
              <div className="flex-1 h-px bg-[#0F172A]/20" />
            </div>

            {/* Message */}
            <div className="min-h-[100px] mb-6">
              <p className="text-[#0F172A] font-serif text-lg leading-relaxed">
                To the honorable leader of {recipientNation},
              </p>
              <p className="text-[#0F172A] font-serif text-lg leading-relaxed mt-4">
                {negotiation.message}
              </p>
            </div>

            {/* Response area (for counter) */}
            {showResponse && (
              <div className="mb-6">
                <label className="block text-[#0F172A]/60 text-sm mb-2">
                  Your counter-proposal:
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Write your response..."
                  className="w-full p-3 bg-white/50 border border-[#0F172A]/20 rounded-lg text-[#0F172A] placeholder-[#0F172A]/40 font-serif resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#0F172A]/20" />
            </div>

            {/* Action buttons (only for human players) */}
            {isHumanPlayer ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleResponse("accepted")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-cinzel font-bold transition-colors"
                >
                  <Check className="w-5 h-5" />
                  Accept
                </button>
                <button
                  onClick={() => handleResponse("rejected")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg font-cinzel font-bold transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={() => handleResponse("countered")}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-lg font-cinzel font-bold transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Counter
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[#0F172A]/50 text-sm italic">
                  Awaiting response from AI...
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-[#0F172A]/10 hover:bg-[#0F172A]/20 text-[#0F172A] rounded-lg font-cinzel transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Parchment edge effects */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#d4a76a]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#d4a76a]/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}

export default DiplomaticScroll;
