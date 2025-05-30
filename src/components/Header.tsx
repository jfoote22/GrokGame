"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Image from "next/image";

export default function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-gray-800 py-3 px-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-3 relative flex items-center justify-center">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <div className="w-6 h-6 flex items-center">
                <div className="w-1.5 h-full bg-white rounded-sm"></div>
                <div className="w-3 h-0.5 bg-white rounded-sm"></div>
                <div className="w-1.5 h-full bg-white rounded-sm"></div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold text-white">App Suite</h1>
            
            {/* Navigation Links */}
            {user && (
              <nav className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/optin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/optin')
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  📍 Opt In
                </Link>
              </nav>
            )}
          </div>
        </div>

        {user && (
          <div className="relative group">
            <div className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1 cursor-pointer">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <span className="text-sm hidden md:block text-white">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button className="flex items-center text-gray-300 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {user && (
        <div className="md:hidden mt-3 border-t border-gray-700 pt-3">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              href="/optin"
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/optin')
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📍 Opt In
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
} 