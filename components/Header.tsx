import ThemeToggle from "@/components/ThemeToggle";
import { Monofett } from "next/font/google";

const monofett = Monofett({
  subsets: ["latin"],
  weight: ["400"],
});

export function Header() {
  return (
    <header className="border-b px-4">
      <div className="container mx-auto flex justify-between items-center py-4">
        <h1 className={`text-5xl font-bold ${monofett.className}`}>
          Website Viewer
        </h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
