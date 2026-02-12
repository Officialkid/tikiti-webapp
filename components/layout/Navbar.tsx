'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  HeartIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  TicketIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';
import { eventService } from '@/lib/services/eventService';
import { TikitiEvent } from '@/types/event';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, setTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TikitiEvent[]>([]);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await eventService.searchEvents(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-black bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              TIKITI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/events"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              Browse Events
            </Link>
            <Link
              href="/about"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
            >
              About
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-3">

            {/* Search Bar */}
            <div ref={searchRef} className="relative hidden md:block">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 280 }}
                    exit={{ opacity: 0, width: 0 }}
                    className="absolute right-0 top-0"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                    />

                    {/* Search Results Dropdown */}
                    {(searching || searchResults.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {searching ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Searching...
                          </div>
                        ) : (
                          searchResults.map((event) => (
                            <Link
                              key={event.eventId}
                              href={`/events/${event.eventId}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                                setSearchResults([]);
                              }}
                              className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-10 h-10 rounded-md object-cover mr-3"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {event.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {event.location.city} •{' '}
                                  {event.dateTime.toLocaleDateString()}
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Favorites */}
            <Link
              href="/favorites"
              className="relative p-2 text-gray-500 hover:text-secondary-500 transition-colors"
            >
              <HeartIcon className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Auth Section */}
            {user ? (
              /* User Menu */
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {user.profilePicUrl ? (
                    <img
                      src={user.profilePicUrl}
                      alt={user.displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>

                      {/* Menu Items */}
                      <Link
                        href="/my-tickets"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <TicketIcon className="h-4 w-4 mr-3" />
                        My Tickets
                      </Link>

                      {user.role === 'organizer' && (
                        <Link
                          href="/organize"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ChartBarIcon className="h-4 w-4 mr-3" />
                          Organizer Dashboard
                        </Link>
                      )}

                      <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                          Log Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Auth Buttons */
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-gradient-to-r from-primary-600 to-secondary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-9 border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-3"
          >
            {/* Mobile Search */}
            <input
              type="text"
              placeholder="Search events..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />

            <Link href="/events" className="block py-2 text-gray-700 dark:text-gray-300 font-medium">
              Browse Events
            </Link>
            <Link href="/favorites" className="block py-2 text-gray-700 dark:text-gray-300 font-medium">
              Favorites
            </Link>
            {user ? (
              <>
                <Link href="/my-tickets" className="block py-2 text-gray-700 dark:text-gray-300 font-medium">
                  My Tickets
                </Link>
                {user.role === 'organizer' && (
                  <Link href="/organize" className="block py-2 text-gray-700 dark:text-gray-300 font-medium">
                    Organizer Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="block py-2 text-red-600 font-medium">
                  Log Out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-3 pt-2">
                <Link href="/login" className="w-full text-center py-2.5 border border-primary-600 text-primary-600 rounded-lg font-medium">
                  Log In
                </Link>
                <Link href="/register" className="w-full text-center py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg font-medium">
                  Sign Up Free
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
