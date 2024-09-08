import ThemeToggle from "@/components/ThemeToggle";
import { Monofett } from "next/font/google";

const monofett = Monofett({
  subsets: ["latin"],
  weight: ["400"],
});

export function Header() {
  return (
    <header className="border-b px-4">
      <div className="container mx-auto flex justify-between items-center py-1">
        <div>
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.7] tracking-tight ${monofett.className}`}
          >
            Website🧿Viewer
          </h1>
          <h1
            className={`-mt-2 md:-mt-4 text-2xl md:text-3xl lg:text-4xl font-bold text-blue-700 ${monofett.className}`}
          >
            {" "}
            Layout Lab
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
