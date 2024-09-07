import ThemeToggle from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="border-b px-4">
      <div className="container mx-auto flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Website Viewer</h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
