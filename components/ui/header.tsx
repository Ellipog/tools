import Link from "next/link";
import ScrambleText from "@/app/components/ScrambleText";

export type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  return (
    <div className="text-white pt-8 pl-11 absolute">
      <div className="text-xs text-white/40 tracking-widest uppercase italic flex items-center gap-1">
        {title !== "home" && (
          <Link
            href="/"
            className="hover:text-white transition-colors cursor-pointer"
          >
            @home
          </Link>
        )}
        <span>/</span>
      </div>
      <ScrambleText text={title} className="text-3xl tracking-tight" />
    </div>
  );
}
