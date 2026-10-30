import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Github, Heart } from "lucide-react";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="footer-shell mt-12">
      <div className="container flex flex-col items-center gap-6 py-8 text-center md:py-12">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <p className="text-sm flex items-center gap-1.5">
            Built with <Heart className="footer-heart h-3.5 w-3.5" aria-hidden /> for PlayStation fans.
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          aria-label="Footer"
        >
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="footer-link text-sm">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="footer-divider w-full pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} Platinum Showcase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
