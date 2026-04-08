"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { removeBackground, Config } from "@imgly/background-removal";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

type ProcessStatus =
  | "idle"
  | "loading_model"
  | "processing"
  | "success"
  | "error";

export default function BackgroundRemovalGenerator() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);

  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("transparent");

  const jpchars = useMemo(() => jpcharlist, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSourceFile(file);
    setStatus("idle");
    setProcessedUrl(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSourcePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!sourceFile) return;

    setStatus("loading_model");
    setProgress(0);

    try {
      const config: Config = {
        progress: (key, current, total) => {
          // The engine downloads models first, then computes.
          if (key.includes("compute")) {
            setStatus("processing");
          }
          setProgress(Math.round((current / total) * 100));
        },
      };

      // Executing the WASM model
      const blob = await removeBackground(sourceFile, config);
      const url = URL.createObjectURL(blob);

      setProcessedUrl(url);
      setStatus("success");
    } catch (error) {
      console.error("Background removal failed:", error);
      setStatus("error");
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;

    if (bgColor === "transparent") {
      // Download raw transparent PNG
      const link = document.createElement("a");
      link.download = `isolated_${Date.now()}.png`;
      link.href = processedUrl;
      link.click();
    } else {
      // Draw onto canvas with background color to bake it in
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement("a");
        link.download = `bg_replaced_${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      };
      img.src = processedUrl;
    }
  };

  const bgOptions = [
    { label: "Transparent", value: "transparent" },
    { label: "Studio Black", value: "#000000" },
    { label: "Clean White", value: "#ffffff" },
    { label: "Chroma Green", value: "#00ff00" },
    { label: "Cyber Blue", value: "#0000ff" },
  ];

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="bg-remover" jp="背景削除" category="images" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <div className="text-[10px] tracking-[0.3em] text-white/50 uppercase border border-white/10 px-6 py-2 bg-white/5 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${status === "success" ? "bg-green-500" : status === "error" ? "bg-red-500" : status === "idle" ? "bg-white/30" : "bg-yellow-500 animate-pulse"}`}
            />
            {status.replace("_", " ")}
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. SOURCE */}
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. source{" "}
                <ScrambleText
                  text={"源泉"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all overflow-hidden">
                <span className="text-xs text-white/40 group-hover:text-white transition-colors uppercase tracking-widest ">
                  {sourceFile ? sourceFile.name : "upload_image"}
                </span>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </section>

            {/* 03. BACKDROP */}
            <section className="space-y-4">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. backdrop{" "}
                <ScrambleText
                  text={"背景"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {bgOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBgColor(opt.value)}
                    className={`text-[10px] py-3 px-4 border tracking-[0.2em] uppercase transition-all text-left flex items-center gap-4 ${
                      bgColor === opt.value
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    <div
                      className="w-4 h-4 border border-current"
                      style={
                        opt.value !== "transparent"
                          ? { backgroundColor: opt.value }
                          : {
                              backgroundImage:
                                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                              backgroundSize: "8px 8px",
                              backgroundPosition:
                                "0 0, 0 4px, 4px -4px, -4px 0px",
                            }
                      }
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 02. ENGINE */}
            <section className="space-y-6">
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-6">
                03. engine{" "}
                <ScrambleText
                  text={"処理"}
                  chars={jpchars}
                  timeOffset={100}
                  autoPlay
                  className="text-sm text-white/35"
                />
              </div>

              <div className="space-y-4">
                <button
                  onClick={processImage}
                  disabled={
                    !sourceFile ||
                    status === "loading_model" ||
                    status === "processing"
                  }
                  className="w-full border border-white/20 py-4 uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white disabled:cursor-not-allowed"
                >
                  {status === "loading_model" || status === "processing"
                    ? `PROCESSING [${progress}%]`
                    : "EXECUTE_ISOLATION"}
                </button>

                {(status === "loading_model" || status === "processing") && (
                  <div className="w-full h-1 bg-white/10">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    />
                  </div>
                )}
              </div>
            </section>
          </motion.aside>

          {/* MAIN PREVIEW */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/5 border border-white/10 min-h-[70vh] relative overflow-hidden"
          >
            <canvas ref={canvasRef} className="hidden" />

            {sourcePreview ? (
              <>
                <div
                  className="flex-1 overflow-hidden p-8 flex items-center justify-center relative transition-colors duration-500"
                  style={
                    bgColor !== "transparent"
                      ? { backgroundColor: bgColor }
                      : {
                          backgroundImage:
                            "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                          backgroundSize: "20px 20px",
                          backgroundPosition:
                            "0 0, 0 10px, 10px -10px, -10px 0px",
                        }
                  }
                >
                  <img
                    src={processedUrl || sourcePreview}
                    alt="Preview"
                    className={`max-w-full max-h-[72vh] object-contain transition-opacity duration-1000 ${status === "processing" ? "opacity-50 blur-sm grayscale" : "opacity-100"}`}
                  />

                  {/* Scanning line animation during processing */}
                  {status === "processing" && (
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                  )}
                </div>

                <div className="border-t border-white/10 p-6 flex justify-between items-center bg-zinc-950 z-10 relative">
                  <div className="flex gap-8 items-center">
                    <span className="text-[11px] text-white/40 font-mono uppercase tracking-widest">
                      {processedUrl
                        ? "ISOLATION_COMPLETE"
                        : "AWAITING_EXECUTION"}
                    </span>
                  </div>
                  {processedUrl && (
                    <button
                      onClick={handleDownload}
                      className="text-[11px] uppercase tracking-widest border-b border-white/20 text-white/50 hover:text-white transition-all pb-1"
                    >
                      download_png
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <ScrambleText
                  text="system_idle_waiting_for_source"
                  className="text-white/10 text-xs tracking-[0.5em] uppercase font-mono"
                />
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
