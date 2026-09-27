import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Github, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer-shell mt-12">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-sm flex items-center gap-1.5">
              Built with <Heart className="footer-heart h-3.5 w-3.5" aria-hidden /> for PlayStation fans.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="field-mark">Links</h4>
            <Link href="/about" className="text-sm">About</Link>
            <Link href="/faq" className="text-sm">FAQ</Link>
            <Link href="/terms" className="text-sm">Terms</Link>
            <Link href="/privacy" className="text-sm">Privacy</Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="field-mark">Community</h4>
            <a href="https://github.com/frodriguezmtnz/plantinum-showcase" target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>

        <div className="footer-divider mt-8 pt-6 border-t text-center text-sm">
          &copy; {new Date().getFullYear()} Platinum Showcase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
