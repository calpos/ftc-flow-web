import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/about", label: "About" },
  { href: "/early-access", label: "Early Access" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
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
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-dim">
              The calm coordination console for FIRST Tech Challenge teams.
              Built by an FTC competitor.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-fg-mid transition-colors duration-150 hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-edge pt-6 text-sm text-fg-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            Calvin Posillico ·{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="transition-colors duration-150 hover:text-fg"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>© 2026 FTC Flow</p>
        </div>
        <p className="mt-6 text-xs leading-relaxed text-fg-dim/80">
          FIRST® and FIRST Tech Challenge are trademarks of FIRST, which does
          not endorse FTC Flow.
        </p>
      </div>
    </footer>
  );
}
