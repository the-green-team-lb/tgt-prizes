"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/live", label: "Live", live: true },
    { href: "/draws", label: "Past Draws" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="border-b border-brand-gold bg-brand-card/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Desktop links - no logo, just nav */}

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-brand-dark bg-gradient-to-r from-brand-gold to-amber-500 font-semibold"
                    : "text-brand-muted hover:text-brand-gold"
                }`}
              >
                {link.live && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden text-brand-gold text-2xl p-2"
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-brand-gold bg-brand-card/95 backdrop-blur-sm">
          <div className="px-4 py-2 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block text-sm px-4 py-3 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-brand-dark bg-gradient-to-r from-brand-gold to-amber-500 font-semibold"
                    : "text-brand-muted hover:text-brand-gold"
                }`}
              >
                {link.live && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                )}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
