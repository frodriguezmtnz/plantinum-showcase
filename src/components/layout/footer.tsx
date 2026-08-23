import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t mt-12">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-sm text-muted-foreground">
              Built with 💙 for PlayStation fans.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-sm">Links</h4>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="font-semibold text-sm">Community</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Twitter className="h-4 w-4" /> Twitter / X
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Github className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Platinum Showcase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}