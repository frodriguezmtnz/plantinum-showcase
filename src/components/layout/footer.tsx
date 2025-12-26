import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t mt-12">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          Built with 💙 for PlayStation fans. &copy; {new Date().getFullYear()} Platinum Showcase.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">About</Link>
            <Link href="#" className="hover:text-primary">FAQ</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
            <Link href="#" className="hover:text-primary">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
