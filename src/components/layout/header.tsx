
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

const navLinks = [
  { href: '/', label: 'Home', icon: Trophy },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/hall-of-fame', label: 'Hall of Fame', icon: Crown },
];

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} passHref>
      <Button variant={active ? 'secondary' : 'ghost'} className="justify-start w-full">
        {children}
      </Button>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-6 mr-auto">
          <Logo />
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link href={link.href} passHref key={link.href}>
                  <Button variant={pathname === link.href ? 'secondary' : 'ghost'}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                  </Button>
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
                <Button asChild className="hidden sm:flex">
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
    </header>
  );
}
