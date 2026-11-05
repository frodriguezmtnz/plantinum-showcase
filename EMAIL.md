# Email transaccional: local, Brevo y producción

Guía operativa del correo del proyecto (reset de contraseña, verificación y
aviso de cambio de contraseña). El código ya es agnóstico del proveedor: solo
cambian las variables de entorno.

## Transportes

`EMAIL_TRANSPORT` acepta:

| Valor      | Uso                                                |
| ---------- | -------------------------------------------------- |
| `console`  | Local sin cuenta: imprime asunto y enlace en consola |
| `ethereal` | Local con email real y URL de preview (sin cuenta) |
| `smtp`     | Brevo u otro relay SMTP (producción)               |
| `memory`   | Tests (CI); no sale nada de la máquina             |

Si `EMAIL_TRANSPORT` está vacío, se usa `smtp` cuando existen
`EMAIL_SMTP_HOST/USER/PASS`; si no, `console`. **Reinicia el dev server** tras
cambiar el `.env` (Next no relee variables en caliente).

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

## Brevo (producción)

Brevo es el proveedor elegido. Plan gratuito suficiente para el volumen actual.

### 1. Cuenta y remitente

1. Crear cuenta en brevo.com (no requiere comprar nada).
2. **Para probar en local** basta con verificar un *sender* (tu propia
   dirección) en *Senders, Domains & Dedicated IPs → Senders*. Sin dominio,
   envía solo a direcciones que controles (por ejemplo, a ti mismo).
3. **Para producción** hay que autenticar un dominio de envío (ver abajo).

### 2. ¿Hace falta comprar un dominio?

- **No** para pruebas locales: con verificar tu email como sender puedes
  enviarte correos a ti mismo.
- **Sí** para producción: los destinatarios arbitrarios necesitan un dominio
  autenticado. **Un `*.vercel.app` no sirve como dominio de envío** porque no
  controlas su DNS. Usa un dominio propio (o un subdominio, p. ej.
  `mail.tudominio.com`). Puedes mantener la web en Vercel y el email en el
  mismo dominio si gestionas el DNS.
- Mientras no quieras publicar nada, no compres nada todavía: sigue con
  `ethereal`/`console` en local y deja Brevo para la fase de deploy.

### 3. Dominio, DNS y clave SMTP

En Brevo → *Senders, Domains & Dedicated IPs → Domains*:

1. Añadir el dominio (o subdominio) de envío.
2. Publicar en el DNS los registros que muestre el panel:
   - **SPF**: un `TXT` con el `include` que indique Brevo (no lo copies de
     otra guía: cambia con el tiempo).
   - **DKIM**: los registros (CNAME/TXT) que genere el panel.
   - **DMARC**: empezar suave, `v=DMARC1; p=none; rua=mailto:dmarc@tudominio`.
3. Verificar el dominio en Brevo (puede tardar en propagar).
4. Crear un **SMTP key** en *SMTP & API → SMTP keys*. El usuario SMTP es el
   email de la cuenta; el password es la clave SMTP (no la API key).

### 4. Variables

Local (`.env`, nunca se commitea):

```bash
EMAIL_TRANSPORT="smtp"
EMAIL_SMTP_HOST="smtp-relay.brevo.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="tu-cuenta@ejemplo.com"
EMAIL_SMTP_PASS="<SMTP key>"
EMAIL_FROM="Platinum Showcase <no-reply@tudominio.com>"
EMAIL_REPLY_TO="soporte@tudominio.com"
```

Vercel (Project → Settings → Environment Variables):

- **Production**: `EMAIL_TRANSPORT=smtp` + credenciales reales.
- **Preview** y **Development**: `EMAIL_TRANSPORT=console` para no enviar
  correos reales desde ramas de prueba.
- `EMAIL_FROM` debe usar el dominio verificado; `EMAIL_REPLY_TO` un buzón real.

### 5. Verificación

```bash
pnpm email:test tu@email.com
```

Revisa:

- Llega a la bandeja (y a spam la primera vez).
- Cabeceras `Authentication-Results`: `spf=pass`, `dkim=pass`, `dmarc=pass`.
- En la app: reset, verificación y aviso de cambio de contraseña.

Subir DMARC a `quarantine` solo cuando SPF/DKIM lleven días en `pass`.

### 6. Operación

- Rotar la SMTP key si se filtra; usar claves distintas por entorno.
- No logear tokens ni claves (el código solo logea `kind`/`to`).
- Revisar bounces/complaints en Brevo. La supresión automática por webhook
  queda como fase 2 (ver `BACKLOG.md`).
- `EMAIL_DOMAIN_ALLOWLIST` sirve para falsos positivos del bloqueo de dominios
  desechables; no tiene relación con Brevo.

## Checklist de deploy (fase 2)

- [ ] Dominio de envío verificado en Brevo (SPF + DKIM + DMARC).
- [ ] `EMAIL_FROM`/`EMAIL_REPLY_TO` con el dominio real.
- [ ] SMTP key en Vercel **solo** en Production; Preview/Dev en `console`.
- [ ] Redeploy y `pnpm email:test` contra producción.
- [ ] Reset + verificación reales con una cuenta no privilegiada.
