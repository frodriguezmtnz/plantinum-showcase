# Backlog

Mejoras pendientes y deuda conocida, para ir puliendo la web antes de la Fase 2 (Vercel).

## Pulido pre-Vercel (diseño)

- [x] Toasts semánticos: verde (`success`) al votar y rojo (`danger`) al retirar voto o fallar.
- [x] Overflow del detalle en escritorio: contadores con `flex-wrap`/`min-w-0` y `SocialShare` con `flex-1`/`shrink-0`.
- [x] Botón de voto simplificado: `Votar` sin número si no has votado, `♥ número` si ya votaste y `Tu platino` para el autor.
- [ ] (Añadir aquí las mejoras de diseño/UX que vayamos detectando.)

## Hecho

- [x] #2 Filtro de plataforma en Explorar: añadido PS3.
- [x] #3 Paginación en Explorar: filtros en servidor + botón "Cargar más" (offset).
- [x] #4 Unicidad `@@unique([userId, hash])` con mensaje de duplicado en el upload.
- [x] #5 Borrado del platino propio (detalle + perfil), con ownership check y limpieza en B2 (best-effort).
- [x] #6 Votos persistidos: tabla `Vote` con `@@unique([userId, platinumId])`, Server Action `toggleVoteForPlatinum` (votar/retirar), bloqueo de voto propio y contador `monthlyVotes` por mes natural (`monthlyVotesMonth`).

## En curso / siguiente tanda

- [ ] (pendiente de priorizar)

## Funcional / bugs

- [x] `getUsers()` cargaba TODOS los usuarios en Explorar solo para mapear nombre (resuelto con #3).
- [ ] Sin edición de un platino propio ya subido.
- [ ] Sin snapshots históricos del Salón de la Fama: el ranking es solo del mes en curso; retirar un voto no puede reescribir el pasado porque no se archiva.
- [ ] Rate limiting específico en `toggleVoteForPlatinum` (además del de upload).

## Moderación / seguridad

- [x] Comentario del platino: visible **solo para el dueño** en su perfil (provisional, para revisar diseño). Ver `src/app/u/[username]/page.tsx` y `src/components/shared/platinum-card.tsx`.
- [ ] Flujo de moderación: reportar platino/comentario.
- [ ] Revisar los comentarios antes de hacerlos públicos (hoy no se muestran a terceros).
- [ ] Rate limiting en la Server Action de subida (`uploadPlatinum` en `src/app/actions.ts`).
- [ ] Validar la imagen por **magic bytes**, no solo `file.type` (es spoofeable) en `src/app/actions.ts`.
- [ ] `next.config.ts`: quitar `remotePatterns` (unsplash/picsum/giphy/placehold) cuando todo venga de B2 y revisar la CSP (`connect-src 'self'`).

## UX / diseño

- [x] Mostrar/ocultar contraseña en login y registro (`PasswordInput` con Eye/EyeOff).
- [x] Rediseño del login/registro: split-screen con panel de marca y sin header/footer (inmersivo) vía `AuthShell` + `SiteChrome`.
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
