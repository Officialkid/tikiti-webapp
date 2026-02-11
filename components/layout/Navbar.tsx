export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="/" className="text-xl font-bold text-primary-500">
          Tikiti
        </a>
        <div className="flex gap-4">Nav links</div>
      </div>
    </nav>
  );
}
