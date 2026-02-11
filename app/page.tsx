import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold text-primary-600">Tikiti</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Event ticketing made simple
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/events"
            className="rounded-lg bg-primary-500 px-6 py-3 font-medium text-white hover:bg-primary-600"
          >
            Browse Events
          </Link>
          <Link
            href="/organize"
            className="rounded-lg border border-primary-500 px-6 py-3 font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Create Event
          </Link>
        </div>
      </main>
    </div>
  );
}
