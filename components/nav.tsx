"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/features", label: "Features" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/about", label: "About" },
] as const;

const ctaClasses =
  "inline-flex h-10 items-center justify-center rounded-[10px] bg-signal px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-[#4d9dff]";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-ink/80 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="FTC Flow home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-[1.0625rem] font-medium tracking-tight">
            FTC Flow
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`text-sm transition-colors duration-150 ${
                pathname === link.href
                  ? "font-medium text-signal"
                  : "text-fg-mid hover:text-fg"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/early-access" className={ctaClasses}>
            Get Early Access
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex size-11 items-center justify-center rounded-[10px] text-fg-mid hover:text-fg md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            className="size-6"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-edge bg-surface px-5 pb-6 pt-3 md:hidden"
        >
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`block py-3 text-base ${
                    pathname === link.href
                      ? "font-medium text-signal"
                      : "text-fg-mid"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/early-access"
            onClick={() => setOpen(false)}
            className={`${ctaClasses} mt-3 w-full`}
          >
            Get Early Access
          </Link>
        </div>
      ) : null}
    </header>
  );
}
