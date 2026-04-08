import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export type ColorPickerProps = {
  color: string;
  onChange: (newColor: string) => void;
};

const CustomColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Position calculation logic
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, []);

  // Update position on open and window resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition);
    }
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        pickerRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const updateHSV = useCallback(
    (s: number, v: number, h: number) => {
      const h_idx = h / 60;
      const c = v * s;
      const x = c * (1 - Math.abs((h_idx % 2) - 1));
      const m = v - c;
      let r = 0,
        g = 0,
        b = 0;

      if (h_idx >= 0 && h_idx < 1) {
        [r, g] = [c, x];
      } else if (h_idx >= 1 && h_idx < 2) {
        [r, g] = [x, c];
      } else if (h_idx >= 2 && h_idx < 3) {
        [g, b] = [c, x];
      } else if (h_idx >= 3 && h_idx < 4) {
        [g, b] = [x, c];
      } else if (h_idx >= 4 && h_idx < 5) {
        [r, b] = [x, c];
      } else {
        [r, b] = [c, x];
      }

      const toHex = (n: number) =>
        Math.round((n + m) * 255)
          .toString(16)
          .padStart(2, "0");

      onChange(`#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase());
    },
    [onChange],
  );

  const handleMove = useCallback(
    (e: MouseEvent) => {
      if (!squareRef.current) return;
      const rect = squareRef.current.getBoundingClientRect();
      const s = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      const v = Math.min(
        Math.max(1 - (e.clientY - rect.top) / rect.height, 0),
        1,
      );
      updateHSV(s, v, hue);
    },
    [hue, updateHSV],
  );

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.nativeEvent);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseUp = () => {
    isDragging.current = false;
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full aspect-square border border-white/20 shadow-lg transition-transform active:scale-95"
        style={{ backgroundColor: color }}
      />

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: coords.top,
                  left: coords.left,
                  zIndex: 9999,
                }}
                className="w-56 p-3 bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Saturation/Value Square */}
                  <div
                    ref={squareRef}
                    onMouseDown={onMouseDown}
                    className="relative w-full aspect-square cursor-crosshair overflow-hidden"
                    style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-white to-transparent" />
                    <div className="absolute inset-0 bg-linear-to-t from-black to-transparent" />
                  </div>

                  {/* Hue Slider */}
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hue}
                    onChange={(e) => {
                      const newHue = parseInt(e.target.value);
                      setHue(newHue);
                      updateHSV(1, 1, newHue);
                    }}
                    className="hue-slider w-full h-3 appearance-none cursor-pointer "
                  />

                  {/* Hex Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <div
                      className="w-8 h-8 border border-white/10 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-xs">
                        #
                      </span>
                      <input
                        type="text"
                        value={color.replace("#", "").toUpperCase()}
                        onChange={(e) => {
                          const val = e.target.value.replace(
                            /[^0-9A-Fa-f]/g,
                            "",
                          );
                          onChange(`#${val}`);
                        }}
                        className="bg-white/5 text-[11px] font-mono text-white w-full pl-5 pr-2 py-1.5 outline-none border border-white/5 focus:border-blue-500/50"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                <style jsx>{`
                  .hue-slider {
                    background: linear-gradient(
                      to right,
                      #f00,
                      #ff0,
                      #0f0,
                      #0ff,
                      #00f,
                      #f0f,
                      #f00
                    );
                  }
                  .hue-slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 0 2px black;
                    cursor: pointer;
                  }
                `}</style>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default CustomColorPicker;
