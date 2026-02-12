"use client";

import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary-500">
          Tikiti
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/events"
            className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
          >
            Events
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href={user.role === "organizer" ? "/organize" : "/my-tickets"}
                    className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {user.role === "organizer" ? "Dashboard" : "My Tickets"}
                  </Link>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user.displayName}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
