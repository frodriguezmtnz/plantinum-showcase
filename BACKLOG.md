# Backlog

Mejoras pendientes y deuda conocida, para ir puliendo la web antes de la Fase 2 (Vercel).

## Pulido pre-Vercel (diseño)

- [ ] (Añadir aquí las mejoras de diseño/UX que vayamos detectando.)

## Moderación / seguridad

- [x] Comentario del platino: visible **solo para el dueño** en su perfil (provisional, para revisar diseño). Ver `src/app/u/[username]/page.tsx` y `src/components/shared/platinum-card.tsx`.
- [ ] Flujo de moderación: reportar platino/comentario.
- [ ] Revisar los comentarios antes de hacerlos públicos (hoy no se muestran a terceros).
- [ ] Rate limiting en la Server Action de subida (`uploadPlatinum` en `src/app/actions.ts`).

## Déficits funcionales detectados

- [ ] **Los votos no se persisten.** `handleVoteClick` (`src/components/shared/platinum-card.tsx`) solo hace estado local + toast; no hay Server Action ni `prisma` update. Al recargar, `votes` y `monthlyVotes` vuelven a su valor original.
- [ ] Rankings y Salón de la Fama dependen de `monthlyVotes`, que tampoco se recalcula.

## Fase 2 — Despliegue en Vercel (al final)

- [ ] Configurar variables de entorno en Vercel (Neon, B2, `AUTH_*`).
- [ ] `vercel-build` con `prisma migrate deploy`.
- [ ] Smoke test en producción (subida real + visualización).
