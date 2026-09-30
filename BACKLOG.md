# Backlog

Mejoras pendientes y deuda conocida, para ir puliendo la web antes de la Fase 2 (Vercel).

## Pulido pre-Vercel (diseño)

- [x] Toasts semánticos: verde (`success`) al votar y rojo (`danger`) al retirar voto o fallar.
- [x] Overflow del detalle en escritorio: contadores con `flex-wrap`/`min-w-0` y `SocialShare` con `flex-1`/`shrink-0`.
- [x] Botón de voto simplificado: `Votar` sin número si no has votado, `♥ número` si ya votaste y `Tu platino` para el autor.
- [x] Sistema visual "The Midnight Showcase" (descartado en el rediseño de 2026-09; ver siguiente).
- [x] Mundo "The Console Browse Screen" (rama `feat/new-redesign-and-i18n`): paneles esmerilados, selección en reposo estilo XMB, Mulish única, intro GSAP + reveals; finish-review: ship; `DESIGN.md` + `.impeccable/design.json` reescritos desde el mundo construido (detector: 0 drifts).
- [x] Iteración post-validación del dueño: fondo dot-grid estático por fase (adiós canvas de olas), fila de home sin spoilers (ranks reales) con marquesina continua que se rinde al control del usuario, boot GSAP más dramático con contador de votos, y scroll infinito en Explore (botón como fallback).
- [x] Iteración 2 post-validación: campo de papel cuadriculado (grid 1px/30px con mask-fade estilo eventarium) + duotono PlayStation solo en color (magenta □ = selección, verde △ = cifras vivas, negro = chrome; nunca glifos), adiós a las fases de cielo (`data-phase` eliminado), home como mazo sticky de 4 tarjetas (explainer, podio real top-3, últimos, CTA) sin reveals JS; `DESIGN.md` + sidecar reescritos (detector: 0 drifts). Pendiente de validación en navegador (apilado y marquesina no son capturables headless).
- [x] Iteración 3 post-validación: marquesina sin scrollbars + fade de bordes (mask alfa, `sm:px-24`), header auto-hide (tuck al bajar, `:focus-within` revela, reduced-motion off), footer negro PS1 (`footer-shell`, ambos temas), **Night Console** con next-themes (ciclo claro/oscuro/sistema, tokens `.dark`, CTAs invertidos, verde vivo más luminoso, pills sobre foto blancos físicos `.photo-chip`, velo spoiler oscuro), detail page a ancho completo 1400px con reparto 60/40 (imagen 3/5, panel 2/5). Docs actualizados (detector: 0 drifts; capturas claro+oscuro nw6-*).
- [x] Iteración 4 post-validación: **marca de agua incrustada** en la imagen al subir (sharp compone la píldora antes del AVIF; Free siempre la lleva, columna `Platinum.watermarked`), checkbox bloqueado en el upload con hint a Pricing, rediseño de **/about** (stats reales, How It Works sin Giphy, rules of the board, CTA), **FAQ** de 5 a 16 respuestas en 4 grupos, y página **/pricing** honesta (Free real + Supporter one-time/monthly "Coming soon", sin cobros, "no paid votes").
- [x] Fix móvil del mazo sticky: el track del grid crecía a 427px (por `min-width: auto` de `.stack-card`) y las tarjetas se comían el gutter derecho hasta el borde de pantalla; `grid-template-columns: minmax(0, 1fr)` + `min-width: 0`. Verificado 390–768px (cards == deck, gutters simétricos 32px, apilado sticky intacto, claro+oscuro), typecheck/lint/build limpios.
- [x] Fix móvil de las filas del podio (card 2): el `<ol className="grid">` sin `grid-cols-*` usaba pista implícita `auto` y su `min-content` (378px) desbordaba la card (326px), cruzando "NN votes" el borde derecho; `grid-cols-1` + `min-w-0` en el `<li>` y fila responsive (`gap-3 sm:gap-4`, rank `w-6 sm:w-10`, miniatura `w-16 sm:w-24`, votos `text-xs sm:text-sm`). Verificado 390/440/500 (fila == contenido de la card, nombre y usuario legibles, claro+oscuro); único grid desbordante de las 10 rutas auditadas.
- [x] Carrusel simplificado: fuera el panel caption (`bloom-caption`) de las plates —en móvil quedaba fijo bajo la selección en reposo y competía con las capturas—; nombre/hunter/votos pasan al `aria-label` del enlace, `pb-16`→`pb-6 sm:pb-8` en la fila, y el hint de teclado se oculta en táctil (`hidden sm:block`). CSS muerto eliminado; `DESIGN.md` + sidecar actualizados (patrón Browse Plate sin caption, fuera `caption-rise`).
- [x] CI + tests: **Vitest** (30 tests de la lógica pura: `period` con zona horaria Madrid, `race`, `rate-limit` con fake timers, `image-signature`, `buildWatermark` con escapado/escala/anclaje) y **GitHub Actions** (`.github/workflows/ci.yml`: Postgres 16 de servicio, `prisma migrate deploy`, typecheck, lint, test, build). Pipeline simulado en local con Docker contra BD vacía: verde.
- [x] Lote A + B6: home y Hall of Fame usan `getUsersByIds` (adiós a cargar la tabla de usuarios entera por visita); purga de utilidades muertas `.platinum-text`/`.platinum-edge`/`.platinum-plate`/`.stage-light` + tokens huérfanos `--platinum*`/`--spot*` (vivos siguen `section-divider` y `shadow-champion`, documentados); el blur del campo `data-bloom='deep'` solo con `@media (hover:hover) and (min-width:640px)` (móvil ya no paga GPU por un efecto que no se ve); `aria-label` en el botón Upload (icon-only en móvil) y en el menú de cuenta; y **tests de integración Postgres** (`data.integration.test.ts`, 15 casos: ranking por periodo, hasVoted, paginación/búsquedas/orden, stats, `getUsersByIds`) gateados por `TEST_DATABASE_URL` — en CI corren contra el servicio; 45/45 verdes, typecheck/lint/build limpios.
- [x] **Fase 0 pricing (entitlements sin cobros)**: enum `Plan` (FREE/PRO/PLATINUM) en `User` + `Platinum.createdAt` (2 migraciones aplicadas a Neon); `src/lib/plans.ts` como única fuente de verdad (FREE 3 subidas/mes con marca, PRO 10 sin marca, PLATINUM ilimitado sin marca + flair cosmético futuro); cuota mensual aplicada en `uploadPlatinum` (`countUploadsInCurrentPeriod`, periodo Europa/Madrid) **antes** de procesar la imagen; watermark y columna `watermarked` ya dependen del plan (`encodePlate`); /pricing reescrita a Free/PRO(7€)/PLATINUM "Coming soon" + tip jar, FAQ y hint del upload alineados; desempate `platinumDate desc` en los sorts de `getPlatinumsPage` (paginación determinista); tests: 7 unit de plans + integración de cuota (16/16 con `TEST_DATABASE_URL`). Nota: ejecutar tests de integración contra Neon real falla por datos de producción — van contra BD aislada (CI/Docker en red interna; el port-forward de Docker Desktop quedaba en P1017).
- [x] **Pack UI/UX (P1 + upload + Explore + a11y)**: `/upload` ya no expulsa al dueño logueado en carga dura (guarda `isLoading` + estado de carga); el bloom de hover/focus del carrusel funciona de verdad (el selector apuntaba a un div que no era `a/[tabindex]`) con la regla refinada "un solo bloom" (la placa en reposo cede el paso al hover/teclado); cuota mensual visible en el formulario (`getUploadQuota`: chip de plan + "N of M" en verde live, submit bloqueado al agotarla) y fila de watermark leída de `planConfig` (ya no dice "Free" a todo el mundo); Explore sin remontaje por tecla (lista atenuada mientras navega), "cargar más" con try/catch + toast, 4 skeletons fantasma, `aria-live`, buscador `type=search` con limpiar, labels asociados, y "Clear filters" en el empty state; voto **optimista** con rollback; a11y: foco real en Hall of Fame (bloom en el `<Link>`), lightbox del detalle abierto con teclado (`<button>` sin anidamiento inválido), skip-to-content, `--live` oscurecido a AA (24%) manteniendo `--ps-green` de acento, touch targets ≥44px en voto/borrado/ojo de contraseña, reduced-motion cubre selección en reposo/fades/pulse, y `themeColor` light/dark. Docs: DESIGN.md (regla One Selection ampliada, token `live`, spots Upload/Explore) y BACKLOG.
- [ ] Fase 1 cobros (Stripe): checkout para PRO/PLATINUM, webhook que escriba `User.plan`, precio definitivo de PLATINUM, y decidir si borrar/subir de nuevo consume cuota.
- [ ] Validación visual en local (`pnpm dev`, :9002) por el dueño antes del merge a main — especialmente: intro GSAP del boot, olas casi imperceptibles, y el formulario de upload logueado (no capturable en headless).
- [x] Barrido opcional de utilidades legacy aún definidas en `globals.css` (`.platinum-*`, `.stage-light`, `.section-divider`, `shadow-champion`) — documentadas como legacy en `DESIGN.md`. (Hecho en el lote A: borradas las 4 sin consumidor + tokens; `section-divider`/`shadow-champion` siguen en hall-of-fame.)

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
- [x] Endurecido el acceso por email/contraseña: normalización de email al entrar, validación de username en servidor (max 20, charset) y P2002 traducido a mensaje.
- [x] Login con throttle anti brute-force (8 intentos/5 min por email y 20 por IP, `src/lib/rate-limit.ts`).
- [ ] Verificación de email al registrarse (hoy no se comprueba) y recuperación de contraseña real.
- [ ] Sin edición de un platino propio ya subido.
- [ ] Sin snapshots históricos del Salón de la Fama: el ranking es solo del mes en curso; retirar un voto no puede reescribir el pasado porque no se archiva.
- [x] Rate limiting específico en `toggleVoteForPlatinum` (20/min por usuario, `src/lib/rate-limit.ts`) además del de upload.

## Moderación / seguridad

- [x] Comentario del platino: visible **solo para el dueño** en su perfil (provisional, para revisar diseño). Ver `src/app/u/[username]/page.tsx` y `src/components/shared/platinum-card.tsx`.
- [ ] Flujo de moderación: reportar platino/comentario.
- [ ] Revisar los comentarios antes de hacerlos públicos (hoy no se muestran a terceros).
- [x] Rate limiting en la Server Action de subida (`uploadPlatinum`: 10/hora por usuario). Limitador en memoria por instancia; en Vercel multi-instancia habrá que migrar a un store compartido (Upstash).
- [x] Validar la imagen por **magic bytes**, no solo `file.type` (`src/lib/image-signature.ts`: JPEG/PNG/WEBP).
- [ ] `next.config.ts`: quitar `remotePatterns` (unsplash/picsum/placehold — giphy ya no se usa tras el rediseño de /about) cuando todo venga de B2 y revisar la CSP (`connect-src 'self'`).

## UX / diseño

- [x] UI 100% en inglés: traducidos todos los strings (acciones, toasts, header, auth, explore, perfiles, upload) y `toLocaleString` a `en-US`. Decisión de producto: idioma único para alcance internacional.
- [x] Mostrar/ocultar contraseña en login y registro (`PasswordInput` con Eye/EyeOff).
- [x] Rediseño del login/registro: split-screen con panel de marca y sin header/footer (inmersivo) vía `AuthShell` + `SiteChrome`.
- [ ] OAuth de Google (el botón ya existe pero está `disabled` "Próximamente" en `src/app/login/page.tsx`).
- [ ] "¿Olvidaste tu contraseña?" sin flujo real (hoy es texto opaco).
- [x] Progreso de subida (barra/estado) en el upload: progreso real de compresión + fase de subida. Drag & drop ahora funciona de verdad.

## SEO / share

- [x] `generateMetadata` con `openGraph.images` + twitter `summary_large_image` (guard de spoilers: una placa spoiler no emite imagen de preview).
- [x] `sitemap.ts` (estáticas + todas las placas, revalidate 1h) y `robots.ts` (bloquea /api, /login, /register, /upload).

## Calidad

- [ ] Tests (Vitest) + CI (GitHub Actions: `typecheck`/`lint`/`build`).

## Fase 2 — Despliegue en Vercel (al final)

- [ ] Configurar variables de entorno en Vercel (Neon, B2, `AUTH_*`).
- [ ] `vercel-build` con `prisma migrate deploy`.
- [ ] Smoke test en producción (subida real + visualización).
