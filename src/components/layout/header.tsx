'use client';

import Link from 'next/link';
import {
  Menu,
  Trophy,
  Crown,
  Upload,
  User as UserIcon,
  LogOut,
  Compass,
} from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Trophy },
  { href: '/explore', label: 'Explorar', icon: Compass },
  { href: '/hall-of-fame', label: 'Salón de la Fama', icon: Crown },
];

export function Header() {
  const pathname = usePathname();
  
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} passHref>
      <Button variant={pathname === href ? 'secondary' : 'ghost'} className="justify-start">
        {children}
      </Button>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>
        
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="p-4">
                <Logo />
              </div>
              <nav className="flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <NavLink href={link.href}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </NavLink>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <NavLink href={link.href} key={link.href}>
                <link.icon className="mr-2 h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upload" passHref>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Subir
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="https://i.pravatar.cc/150?u=trophy-hunter-1" alt="User" />
                    <AvatarFallback>TH</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">trophy-hunter-1</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/u/trophy-hunter-1" passHref>
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
