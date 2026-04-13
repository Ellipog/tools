"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import { jpcharlist } from "@/public/data/charlists";

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureModal({ isOpen, onClose }: FeatureModalProps) {
  const [name, setName] = useState("");
  const [feature, setFeature] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, feature }),
      });

      if (response.ok) {
        setStatus("success");
        setName("");
        setFeature("");
        setTimeout(() => {
          setStatus("idle");
          onClose();
        }, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 right-9 w-80 z-[100] bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* TOP ACCENT BAR */}
          <div className="h-1 w-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: status === "loading" ? "100%" : "0%" }}
              className="h-full bg-white"
            />
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <header className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex flex-col">
                <span className="text-[12px] tracking-[0.3em] uppercase text-white/40 font-bold">
                  Request_Feature
                </span>
                <ScrambleText
                  text="機能リクエスト"
                  chars={jpcharlist}
                  className="text-[12px] text-white/20"
                  autoPlay
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/20 hover:text-white transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </header>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-white/30">
                  Identifier
                </label>
                <input
                  type="text"
                  placeholder="Your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-white/40 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-white/30">
                  Description
                </label>
                <textarea
                  placeholder="Detail the requested node/feature..."
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  required
                  rows={3}
                  className="bg-white/5 border border-white/10 p-2 text-xs text-white focus:outline-none focus:border-white/40 transition-all resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="w-full bg-white text-black py-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-200 disabled:opacity-30 transition-all cursor-pointer"
            >
              {status === "loading"
                ? "Transmitting..."
                : status === "success"
                  ? "Received"
                  : "Send_Request"}
            </button>

            <AnimatePresence>
              {status === "error" && (
                <motion.p
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] uppercase text-red-500 tracking-tighter text-center"
                >
                  Error: Protocol failure. Try again.
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          {/* BR DECOR */}
          <div className="absolute bottom-0 right-0 p-1 opacity-10 pointer-events-none">
            <div className="text-[8px] font-mono">v1.0.4_FR</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
