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
      <div className="container py-8 md:py-12">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-8">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-sm flex items-center gap-1.5">
              Built with <Heart className="footer-heart h-3.5 w-3.5" aria-hidden /> for PlayStation fans.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="field-mark">Links</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:gap-2">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="field-mark">Community</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2 md:flex-col md:gap-2">
              <a
                href="https://github.com/frodriguezmtnz/plantinum-showcase"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-2"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="footer-divider mt-8 pt-6 border-t text-center text-sm">
          &copy; {new Date().getFullYear()} Platinum Showcase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
