'use client';

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "./actions";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";

const initialState: { error?: string } = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  return (
    <AuthShell
      title="Crear Cuenta"
      description="Únete a la comunidad y muestra tus trofeos de platino."
      error={state.error}
      footer={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input id="username" name="username" placeholder="trophy-hunter" required minLength={3} maxLength={20} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <PasswordInput id="password" name="password" required minLength={6} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creando cuenta..." : "Crear Cuenta"}
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
        Registrarse con Google
      </Button>
    </AuthShell>
  );
}
