import "dotenv/config";
import { sendEmail } from "../src/lib/email/send";
import { passwordResetEmail } from "../src/lib/email/templates";

/**
 * Smoke test for the configured transport. With `EMAIL_TRANSPORT=ethereal`
 * it prints a preview URL; with `smtp` it delivers for real.
 *
 *   pnpm email:test you@example.com
 */
async function main() {
  const to = process.argv.slice(2).find((arg) => arg.includes("@"));
  if (!to) {
    console.error("Usage: pnpm email:test you@example.com");
    process.exit(1);
  }

  const template = passwordResetEmail({
    username: "email-test",
    url: "http://localhost:9002/reset-password?token=email-test",
    expiresMinutes: 60,
  });

  const result = await sendEmail({
    kind: "password-reset",
    to,
    ...template,
  });

  if (!result.ok) {
    console.error(`[email:test] failed: ${result.error ?? "unknown error"}`);
    process.exit(1);
  }

  console.log(`[email:test] sent to ${to}`);
  if (result.id) console.log(`[email:test] provider id: ${result.id}`);
  if (result.previewUrl) console.log(`[email:test] preview: ${result.previewUrl}`);
}

main().catch((error) => {
  console.error("[email:test] crashed", error);
  process.exit(1);
});
