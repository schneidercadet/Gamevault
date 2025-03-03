'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Silkscreen } from 'next/font/google';
import { Input } from "./ui/input";

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
});

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/assets/LOGO.png"
                alt="GameVault Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span
                className={`${silkscreen.className} text-lg font-bold text-foreground`}
              >
                GameVault
              </span>
            </Link>
            <p className="text-sm text-foreground-muted">
              Your ultimate destination for discovering and exploring the world
              of gaming. Find detailed information about your favorite games and
              new releases.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  className="text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  Search
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/schneidercadet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  <i className="fab fa-github text-lg" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  <i className="fab fa-linkedin text-lg" />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-foreground-muted transition-colors hover:text-primary-dark"
                >
                  <i className="fab fa-twitter text-lg" />
                  <span>Twitter</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Stay Updated
            </h3>
            <form className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary-dark px-4 py-2 font-semibold text-foreground transition-all hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-background-lighter pt-8 text-center">
          <p className="text-sm text-foreground-muted">
            {currentYear} GameVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
