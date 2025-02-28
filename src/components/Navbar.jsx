"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Plus, User2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={user ? "/home" : "/"}
              className="text-2xl font-bold text-[#8163e9]"
            >
              Campus Rides
            </Link>
          </div>

          {/* Desktop Navigation */}
          {/* {!authLoading && user ? (
            <nav className="hidden md:flex items-end gap-8">
              <Link
                href="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                About
              </Link>
            </nav>
          ) : null} */}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!authLoading && user ? (
              <>
                <nav className="hidden md:flex items-end gap-8">
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    About
                  </Link>
                </nav>
                <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                  <Search className="h-5 w-5 text-black" />
                </button>
                <Link href="/publish-ride">
                  <button className="flex items-center gap-2 bg-[#8163e9] text-white px-4 py-2 rounded-md hover:bg-[#8163e9]/90 transition-colors">
                    <Plus className="h-4 w-4" />
                    Publish a ride
                  </button>
                </Link>
                <Link href="/my-profile">
                  <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                    <User2 className="h-5 w-5 text-black" />
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-black" />
              ) : (
                <Menu className="h-6 w-6 text-black" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {!authLoading && user ? (
                <>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    About
                  </Link>
                  <Link href="/publish-ride">
                    <button className="flex items-center gap-2 bg-[#8163e9] text-white px-4 py-2 rounded-md hover:bg-[#8163e9]/90 transition-colors w-full justify-center">
                      <Plus className="h-4 w-4" />
                      Publish a ride
                    </button>
                  </Link>
                  <Link href="/my-profile">
                    <button className="flex items-center gap-2 border text-black border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors w-full justify-center">
                      <User2 className="h-4 w-4 text-black" />
                      My Profile
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
