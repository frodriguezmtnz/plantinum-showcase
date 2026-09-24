'use client';

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <AuthShell
      title="Iniciar Sesión"
      description="Únete a la comunidad para votar y mostrar tus platinos."
      error={state.error}
      footer={
        <>
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
            <span className="ml-auto inline-block text-sm underline opacity-40">¿Olvidaste tu contraseña?</span>
          </div>
          <PasswordInput id="password" name="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Iniciando..." : "Iniciar Sesión"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
          <span className="bg-background px-2">o</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" type="button" disabled title="Próximamente">
        Iniciar sesión con Google
      </Button>
    </AuthShell>
  );
}
