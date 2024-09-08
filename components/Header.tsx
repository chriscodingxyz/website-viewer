import ThemeToggle from "@/components/ThemeToggle";
import { Monofett } from "next/font/google";
import Link from "next/link";

const monofett = Monofett({
  subsets: ["latin"],
  weight: ["400"],
});

export function Header() {
  return (
    <header className="border-b px-4 top-0 sticky z-50 bg-background">
      <div className="container mx-auto flex justify-between items-center pt-2 md:pt-0 ">
        <a href="/">
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.7] tracking-tight drop-shadow-lg ${monofett.className}`}
          >
            Website🧿Viewer
          </h1>
          <h1
            className={`-mt-2 sm:-mt-3 md:-mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-blue-700 drop-shadow-lg ${monofett.className}`}
          >
            {" "}
            Layout Lab
          </h1>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
