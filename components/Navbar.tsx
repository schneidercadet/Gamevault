"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Silkscreen } from "next/font/google";
import UserMenu from "./UserMenu";
import { Input } from "./ui/input";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, pathname, searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoading(true);
      await router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/assets/LOGO.png"
              alt="GameVault Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span
              className={`${silkscreen.className} hidden text-xl font-bold text-white dark:text-white sm:inline bg-gradient-to-r from-primary-dark to-secondary-dark bg-clip-text text-transparent dark:bg-none`}
            >
              GameVault
            </span>
          </Link>

          {/* Navigation and Search */}
          <div className="flex flex-1 items-center justify-end gap-4 md:gap-8">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                aria-label="Search games"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </form>

            {/* User Menu */}
            <div className="ml-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
