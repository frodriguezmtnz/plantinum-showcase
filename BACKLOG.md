# Backlog

Mejoras pendientes y deuda conocida, para ir puliendo la web antes de la Fase 2 (Vercel).

## Pulido pre-Vercel (diseño)

- [ ] (Añadir aquí las mejoras de diseño/UX que vayamos detectando.)

## En curso / siguiente tanda

- [ ] #2 Filtro de plataforma en Explorar no incluye PS3.
- [ ] #3 Paginación en Explorar (hoy carga todo en cliente; no escala).
- [ ] #4 Unicidad de `hash` para evitar subidas duplicadas (`@@unique([userId, hash])`).
- [ ] #5 Borrar tu propio platino (detalle + perfil).

## Funcional / bugs

- [ ] **Los votos no se persisten.** `handleVoteClick` (`src/components/shared/platinum-card.tsx`) solo hace estado local + toast; no hay Server Action ni `prisma` update. Al recargar, `votes` y `monthlyVotes` vuelven a su valor original. Falta tabla `Vote`, voto único por usuario y recalcular `monthlyVotes`.
- [ ] Rankings y Salón de la Fama dependen de `monthlyVotes`, que tampoco se recalcula.
- [ ] `getUsers()` carga TODOS los usuarios en Explorar solo para mapear nombre (se resuelve con #3).
- [ ] Sin edición de un platino propio ya subido.

## Moderación / seguridad

- [x] Comentario del platino: visible **solo para el dueño** en su perfil (provisional, para revisar diseño). Ver `src/app/u/[username]/page.tsx` y `src/components/shared/platinum-card.tsx`.
- [ ] Flujo de moderación: reportar platino/comentario.
- [ ] Revisar los comentarios antes de hacerlos públicos (hoy no se muestran a terceros).
- [ ] Rate limiting en la Server Action de subida (`uploadPlatinum` en `src/app/actions.ts`).
- [ ] Validar la imagen por **magic bytes**, no solo `file.type` (es spoofeable) en `src/app/actions.ts`.
- [ ] `next.config.ts`: quitar `remotePatterns` (unsplash/picsum/giphy/placehold) cuando todo venga de B2 y revisar la CSP (`connect-src 'self'`).

## UX / diseño

- [ ] OAuth de Google (el botón ya existe pero está `disabled` "Próximamente" en `src/app/login/page.tsx`).
- [ ] "¿Olvidaste tu contraseña?" sin flujo real (hoy es texto opaco).
- [ ] Progreso de subida (barra/estado) en el upload.

## SEO / share

- [ ] `generateMetadata` sin `openGraph.images` con la captura (`src/app/platinum/[id]/page.tsx`); al compartir no sale imagen.
- [ ] `sitemap.ts` / `robots.ts`.

## Calidad

- [ ] Tests (Vitest) + CI (GitHub Actions: `typecheck`/`lint`/`build`).

## Fase 2 — Despliegue en Vercel (al final)

- [ ] Configurar variables de entorno en Vercel (Neon, B2, `AUTH_*`).
- [ ] `vercel-build` con `prisma migrate deploy`.
- [ ] Smoke test en producción (subida real + visualización).
