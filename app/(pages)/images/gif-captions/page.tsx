"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";
import GIF from "gif.js";
import { parseGIF, decompressFrames } from "gifuct-js";

type CaptionMode = "classic_top" | "classic_bottom" | "overlay_drag";

export default function CaptionGenerator() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceDimensions, setSourceDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "gif">("image");

  const [captionText, setCaptionText] = useState("");
  const [mode, setMode] = useState<CaptionMode>("classic_top");
  const [fontSize, setFontSize] = useState(32);
  const [copyLabel, setCopyLabel] = useState("generate_gif");

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const jpchars = useMemo(() => jpcharlist, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceFile(file);

    const type = file.type.startsWith("video")
      ? "video"
      : file.type === "image/gif"
        ? "gif"
        : "image";
    setFileType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSourcePreview(dataUrl);

      const media =
        type === "video" ? document.createElement("video") : new Image();
      const loadEvent = type === "video" ? "onloadedmetadata" : "onload";

      (media as any)[loadEvent] = () => {
        setSourceDimensions({
          w:
            type === "video"
              ? (media as HTMLVideoElement).videoWidth
              : (media as HTMLImageElement).naturalWidth,
          h:
            type === "video"
              ? (media as HTMLVideoElement).videoHeight
              : (media as HTMLImageElement).naturalHeight,
        });
      };
      media.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const applyOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    extraHeight: number,
  ) => {
    const allCapsCaption = captionText.toUpperCase();
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(1, fontSize / 12);
    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";

    const drawText = (x: number, y: number) => {
      ctx.strokeText(allCapsCaption, x, y);
      ctx.fillStyle = "white";
      ctx.fillText(allCapsCaption, x, y);
    };

    if (mode === "classic_top") {
      drawText(width / 2, extraHeight / 2);
    } else if (mode === "classic_bottom") {
      drawText(width / 2, height + extraHeight - extraHeight / 2);
    } else if (mode === "overlay_drag") {
      ctx.save();
      const mappedScale = width / (containerRef.current?.clientWidth || width);
      ctx.translate(
        ((containerRef.current?.clientWidth || 0) / 2 + position.x) *
          mappedScale,
        ((containerRef.current?.clientHeight || 0) / 2 + position.y) *
          mappedScale,
      );
      drawText(0, 0);
      ctx.restore();
    }
  };

  const handleDownload = async () => {
    if (!sourcePreview || !canvasRef.current || !sourceDimensions) return;
    setCopyLabel("processing...");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const extraHeight =
      mode === "classic_top" || mode === "classic_bottom" ? fontSize * 1.5 : 0;

    canvas.width = sourceDimensions.w;
    canvas.height = sourceDimensions.h + extraHeight;

    const gifEncoder = new GIF({
      workers: 4,
      quality: 2,
      workerScript: "/workers/gif.worker.js",
      width: canvas.width,
      height: canvas.height,
    });

    if (fileType === "gif" && sourceFile) {
      const arrayBuffer = await sourceFile.arrayBuffer();
      const frames = decompressFrames(parseGIF(arrayBuffer), true);
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = sourceDimensions.w;
      tempCanvas.height = sourceDimensions.h;
      const tempCtx = tempCanvas.getContext("2d")!;

      for (const frame of frames) {
        if (frame.disposalType === 2)
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        const frameData = tempCtx.createImageData(
          frame.dims.width,
          frame.dims.height,
        );
        frameData.data.set(frame.patch);
        const patchCanvas = document.createElement("canvas");
        patchCanvas.width = frame.dims.width;
        patchCanvas.height = frame.dims.height;
        patchCanvas.getContext("2d")!.putImageData(frameData, 0, 0);
        tempCtx.drawImage(patchCanvas, frame.dims.left, frame.dims.top);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, mode === "classic_top" ? extraHeight : 0);
        applyOverlay(ctx, sourceDimensions.w, sourceDimensions.h, extraHeight);
        gifEncoder.addFrame(ctx, { copy: true, delay: frame.delay });
      }
    } else if (fileType === "video" && videoRef.current) {
      const video = videoRef.current;
      const fps = 15;
      const totalFrames = Math.min(video.duration * fps, 100);

      for (let i = 0; i < totalFrames; i++) {
        video.currentTime = i / fps;
        await new Promise((r) => (video.onseeked = r));
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          video,
          0,
          mode === "classic_top" ? extraHeight : 0,
          sourceDimensions.w,
          sourceDimensions.h,
        );
        applyOverlay(ctx, sourceDimensions.w, sourceDimensions.h, extraHeight);
        gifEncoder.addFrame(ctx, { copy: true, delay: 1000 / fps });
      }
    } else if (imageRef.current) {
      // STATIC IMAGE PATH
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        imageRef.current,
        0,
        mode === "classic_top" ? extraHeight : 0,
        sourceDimensions.w,
        sourceDimensions.h,
      );
      applyOverlay(ctx, sourceDimensions.w, sourceDimensions.h, extraHeight);
      gifEncoder.addFrame(ctx, { copy: true, delay: 200 });
    }

    gifEncoder.on("finished", (blob: Blob) => {
      const link = document.createElement("a");
      link.download = `captioned_${Date.now()}.gif`;
      link.href = URL.createObjectURL(blob);
      link.click();
      setCopyLabel("done");
      setTimeout(() => setCopyLabel("generate_gif"), 2000);
    });

    gifEncoder.render();
  };

  const memeFontStyle: React.CSSProperties = {
    fontFamily: "'Impact', sans-serif",
    color: "white",
    fontWeight: "bold",
    textShadow:
      "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
    textTransform: "uppercase",
  };

  return (
    <div className="min-h-dvh w-full bg-[#050505] overflow-hidden selection:bg-white selection:text-black">
      <Navbar title="caption-gen" jp="キャプション" category="media" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12 max-h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 overflow-hidden">
          <aside className="lg:col-span-4 space-y-10 overflow-y-auto pr-4 custom-scrollbar">
            <section>
              <div className="text-[14px] text-white/70 uppercase mb-4 tracking-[0.2em]">
                01. source
              </div>
              <label className="group block w-full border border-white/10 p-4 text-center cursor-pointer hover:bg-white/5 transition-all">
                <span className="text-[10px] uppercase tracking-[0.2em]">
                  {sourceFile ? sourceFile.name : "upload_media"}
                </span>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </label>
            </section>

            <section className="space-y-6">
              <div className="text-[14px] text-white/70 uppercase tracking-[0.2em]">
                02. config
              </div>
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="ENTER TEXT..."
                className="w-full bg-white/5 border border-white/10 p-3 text-xs uppercase tracking-widest font-mono focus:outline-none focus:border-white/40"
              />
              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    "classic_top",
                    "classic_bottom",
                    "overlay_drag",
                  ] as CaptionMode[]
                ).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`text-[10px] py-3 px-4 border uppercase flex items-center gap-4 transition-all ${mode === m ? "bg-white text-black" : "border-white/10 text-white/30 hover:border-white/40"}`}
                  >
                    <div
                      className={`w-2 h-2 ${mode === m ? "bg-black" : "bg-white/20"}`}
                    />{" "}
                    {m.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-widest">
                  <span>Font_Size</span>
                  <span>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="120"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-white bg-white/10 h-px appearance-none cursor-pointer"
                />
              </div>
            </section>

            <button
              onClick={handleDownload}
              disabled={!sourcePreview || copyLabel.includes("processing")}
              className="w-full border border-white/20 py-4 uppercase text-[10px] font-bold hover:bg-white hover:text-black transition-all disabled:opacity-20"
            >
              {copyLabel}
            </button>
          </aside>

          <main className="lg:col-span-8 flex flex-col border border-white/10 min-h-[60vh] relative bg-[#080808]">
            <canvas ref={canvasRef} className="hidden" />
            <AnimatePresence mode="wait">
              {sourcePreview ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div
                    ref={containerRef}
                    className="relative bg-white shadow-2xl overflow-hidden"
                    style={{
                      maxHeight: "60vh",
                      aspectRatio: sourceDimensions
                        ? `${sourceDimensions.w}/${sourceDimensions.h + (mode.startsWith("classic") ? fontSize * 1.5 : 0)}`
                        : "1",
                    }}
                  >
                    {mode === "classic_top" && (
                      <div
                        className="flex items-center justify-center bg-white text-black text-center"
                        style={{
                          height: `${fontSize * 1.5}px`,
                          fontSize: `${fontSize}px`,
                          ...memeFontStyle,
                        }}
                      >
                        {captionText}
                      </div>
                    )}
                    {fileType === "video" ? (
                      <video
                        ref={videoRef}
                        src={sourcePreview}
                        autoPlay
                        loop
                        muted
                        className="block w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        ref={imageRef}
                        src={sourcePreview}
                        alt="Preview"
                        className="block w-full h-full object-contain"
                      />
                    )}
                    {mode === "classic_bottom" && (
                      <div
                        className="flex items-center justify-center bg-white text-black text-center"
                        style={{
                          height: `${fontSize * 1.5}px`,
                          fontSize: `${fontSize}px`,
                          ...memeFontStyle,
                        }}
                      >
                        {captionText}
                      </div>
                    )}
                    {mode === "overlay_drag" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                          drag
                          dragMomentum={false}
                          onDrag={(_, info) =>
                            setPosition({
                              x: position.x + info.delta.x,
                              y: position.y + info.delta.y,
                            })
                          }
                          className="pointer-events-auto cursor-grab active:cursor-grabbing text-center"
                          style={{
                            x: position.x,
                            y: position.y,
                            fontSize: `${fontSize}px`,
                            ...memeFontStyle,
                          }}
                        >
                          {captionText || "TEXT_OVERLAY"}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <ScrambleText
                    text="awaiting_media"
                    className="text-white/10 uppercase tracking-[0.5em] font-mono"
                  />
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
