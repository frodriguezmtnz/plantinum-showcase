# Email transaccional: local, Resend/Brevo y producción

Guía operativa del correo del proyecto (reset de contraseña, verificación y
aviso de cambio de contraseña). El código ya es agnóstico del proveedor: para
producción solo cambian las variables de entorno. **Resend es la opción
recomendada**; Brevo queda documentado como alternativa.

## Transportes

`EMAIL_TRANSPORT` acepta:

| Valor      | Uso                                                    |
| ---------- | ------------------------------------------------------ |
| `console`  | Local sin cuenta: imprime asunto y enlace en consola   |
| `ethereal` | Local con email real y URL de preview (sin cuenta)     |
| `smtp`     | Resend, Brevo u otro relay SMTP (producción)           |
| `memory`   | Tests (CI); no sale nada de la máquina                 |

Si `EMAIL_TRANSPORT` está vacío, se usa `smtp` cuando existen
`EMAIL_SMTP_HOST`, `EMAIL_SMTP_USER` y `EMAIL_SMTP_PASS`; si no, `console`.
**Reinicia el dev server** tras cambiar el `.env` (Next no relee variables en
caliente).

## Local rápido con Ethereal

No hace falta cuenta ni dominio:

```bash
# .env
EMAIL_TRANSPORT="ethereal"
```

Al pedir un reset o verificar una cuenta, la consola imprime una línea
`[email] preview: https://ethereal.email/message/...` con el correo renderizado.
También puedes probar el transporte sin pasar por la app:

```bash
pnpm email:test tu@email.com
```

## Producción: dominio y proveedor

Para enviar a destinatarios arbitrarios necesitas un dominio propio con
autenticación de correo. **Un `*.vercel.app` no sirve como dominio de envío**
porque no controlas su DNS. Puedes usar un subdominio de envío (por ejemplo,
`notifications.tudominio.com`) y mantener la web en Vercel.

Mientras no quieras publicar nada, no compres dominio todavía: sigue con
`ethereal`/`console` en local y deja el proveedor para la fase de deploy.

Las plantillas de este proyecto **no incluyen una dirección física**. Si un
proveedor la pide durante el alta, es para su verificación/compliance de
cuenta; no se inserta en los emails salvo que la añadas tú al template. Si no
quieres darla, usa Resend (u otro relay SMTP que no la inyecte) en vez de
Brevo.

## Resend (recomendado)

### 1. Cuenta, dominio y clave

1. Crear una cuenta en [resend.com](https://resend.com) (no hace falta comprar
   nada en Resend).
2. Añadir el dominio o subdominio de envío en *Domains* y publicar en el DNS
   los registros que indique el panel:
   - **SPF/DKIM**: los registros `TXT`/`CNAME` que genere Resend.
   - **DMARC**: empezar suave, `v=DMARC1; p=none; rua=mailto:dmarc@tudominio`.
3. Verificar el dominio (suele tardar minutos; puede tardar en propagar).
4. Crear una **API key** con permiso de envío. En SMTP, el usuario es
   `resend` y el password es esa API key.

### 2. Variables

```bash
EMAIL_TRANSPORT="smtp"
EMAIL_SMTP_HOST="smtp.resend.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="resend"
EMAIL_SMTP_PASS="<API key>"
EMAIL_FROM="Platinum Showcase <no-reply@tudominio.com>"
EMAIL_REPLY_TO="soporte@tudominio.com"
```

El plan gratuito actual de Resend incluye 3.000 emails/mes y 100/día; consulta
la web por si cambian los límites.

### 3. Verificación

```bash
pnpm email:test tu@email.com
```

Revisa que llega a la bandeja (y a spam la primera vez) y que las cabeceras
`Authentication-Results` muestran `spf=pass`, `dkim=pass` y `dmarc=pass`.

## Brevo (alternativa)

Brevo funciona igual a través de SMTP, pero no es el proveedor por defecto del
proyecto.

### 1. Cuenta, dominio y clave

1. Crear cuenta en [brevo.com](https://www.brevo.com) (no requiere comprar
   nada).
2. **Para probar en local** basta con verificar un *sender* (tu propia
   dirección) en *Senders, Domains & Dedicated IPs → Senders*.
3. **Para producción** autentica el dominio de envío en el mismo panel y
   publica los registros SPF/DKIM/DMARC que muestre Brevo.
4. Crear una **SMTP key** en *SMTP & API → SMTP keys*. El usuario SMTP es el
   email de la cuenta; el password es la clave SMTP (no la API key).

### 2. Variables

```bash
EMAIL_TRANSPORT="smtp"
EMAIL_SMTP_HOST="smtp-relay.brevo.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="tu-cuenta@ejemplo.com"
EMAIL_SMTP_PASS="<SMTP key>"
EMAIL_FROM="Platinum Showcase <no-reply@tudominio.com>"
EMAIL_REPLY_TO="soporte@tudominio.com"
```

Si Brevo te pide una dirección física en el onboarding, es un requisito de su
cuenta/compliance: las plantillas del proyecto no la muestran.

## Vercel

Project → Settings → Environment Variables:

- **Production**: `EMAIL_TRANSPORT=smtp` + las credenciales del proveedor.
- **Preview** y **Development**: `EMAIL_TRANSPORT=console` para no enviar
  correos reales desde ramas de prueba.
- `EMAIL_FROM` debe usar el dominio verificado; `EMAIL_REPLY_TO` un buzón real.
- No subas `.env` ni claves al repositorio.

## Operación

- Rotar la API key/SMTP key si se filtra; usar claves distintas por entorno.
- No logear tokens ni claves (el código solo logea `kind`/`to`).
- Revisar bounces/complaints en el panel del proveedor elegido. La supresión
  automática por webhook queda como fase 2 (ver `BACKLOG.md`).
- `EMAIL_DOMAIN_ALLOWLIST` sirve para falsos positivos del bloqueo de dominios
  desechables; no tiene relación con el proveedor de email.

## Checklist de deploy (fase 2)

- [ ] Dominio de envío verificado en Resend (o Brevo) con SPF + DKIM + DMARC.
- [ ] `EMAIL_FROM`/`EMAIL_REPLY_TO` con el dominio real.
- [ ] API/SMTP key en Vercel **solo** en Production; Preview/Dev en `console`.
- [ ] Redeploy y `pnpm email:test` contra producción.
- [ ] Reset + verificación reales con una cuenta no privilegiada.
