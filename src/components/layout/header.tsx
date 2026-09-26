
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
  LogIn,
  UserPlus,
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
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Trophy },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/hall-of-fame', label: 'Hall of Fame', icon: Crown },
];

const navPill =
  'flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors duration-200';
const navActive = 'bg-white/85 text-primary shadow-lift ring-1 ring-white';
const navIdle = 'text-secondary-foreground/80 hover:bg-white/50';

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(navPill, 'justify-start w-full', active ? navActive : navIdle)}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="panel rounded-none border-x-0 border-t-0">
      <div className="container flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-2 md:gap-6 mr-auto min-w-0">
          <Logo />
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                className={cn(navPill, pathname === link.href ? navActive : navIdle)}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 ml-auto">
            <Link href="/upload" passHref>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
                      <AvatarFallback>{(user.name ?? '?').slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/u/${user.name}`}>
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <>
                <Button variant="outline" asChild className="hidden sm:flex">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in
                    </Link>
                </Button>
                <Button asChild variant="outline" className="hidden sm:flex">
                    <Link href="/register">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign up
                    </Link>
                </Button>
               </>
            )}
            
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                   <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                    <Logo />
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 p-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <NavLink href={link.href} active={pathname === link.href}>
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </NavLink>
                      </SheetClose>
                    ))}
                     {!user && (
                      <>
                        <SheetClose asChild>
                          <NavLink href="/login" active={pathname === '/login'}>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                          </NavLink>
                        </SheetClose>
                        <SheetClose asChild>
                          <NavLink href="/register" active={pathname === '/register'}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign up
                          </NavLink>
                        </SheetClose>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
      </div>
    </header>
  );
}
