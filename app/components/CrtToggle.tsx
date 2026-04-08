"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "aaenz:crt";

type CrtPref = "on" | "off";

function applyCrtClass(enabled: boolean) {
  document.documentElement.classList.toggle("crt-on", enabled);
}

export default function CrtToggle() {
  const [enabled, setEnabled] = useState(true);

  const label = useMemo(() => (enabled ? "CRT: ON" : "CRT: OFF"), [enabled]);

  useEffect(() => {
    const stored =
      (localStorage.getItem(STORAGE_KEY) as CrtPref | null) ?? null;
    const initialEnabled = stored ? stored === "on" : true;
    setEnabled(initialEnabled);
    applyCrtClass(initialEnabled);
  }, []);

  useEffect(() => {
    applyCrtClass(enabled);
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }, [enabled]);

  return <div className="fixed right-4 top-4 z-10000"></div>;
}
