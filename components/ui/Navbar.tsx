import Link from "next/link";
import ScrambleText from "@/components/ScrambleText";
import { useMemo } from "react";
import { jpcharlist } from "@/public/data/charlists";

export type HeaderProps = {
  title: string;
  jp: string;
  category: string;
};

export default function Navbar({ title, jp, category }: HeaderProps) {
  const jpchars = useMemo(() => jpcharlist, []);

  return (
    <div className="text-white pt-8 pl-11 absolute">
      <div className="text-xs text-white/40 tracking-widest uppercase flex items-center gap-1">
        {title !== "home" && (
          <Link
            href="/"
            className="hover:text-white transition-colors cursor-pointer"
          >
            / home / {category}
          </Link>
        )}
        <span>/</span>
      </div>
      <ScrambleText text={title} className="text-3xl tracking-tight" />
      <ScrambleText
        text={jp}
        chars={jpchars}
        timeOffset={100}
        autoPlay={true}
        className="text-xl ml-3 text-white/35 transition-colors"
      />
    </div>
  );
}
