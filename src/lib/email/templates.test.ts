import { describe, expect, it } from 'vitest';
import {
  accountDeleteConfirmEmail,
  accountDeletedEmail,
  emailChangeActiveEmail,
  emailChangeConfirmEmail,
  emailChangeRequestedEmail,
  emailChangedEmail,
  passwordChangedEmail,
  passwordResetEmail,
  verifyEmailEmail,
} from './templates';

describe('email templates', () => {
  it('renders the reset link in HTML and text', () => {
    const email = passwordResetEmail({
      username: 'hunter',
      url: 'https://example.com/reset-password?token=a&b=1',
      expiresMinutes: 60,
    });

    expect(email.subject).toBe('Reset your Platinum Showcase password');
    expect(email.text).toContain('hunter');
    expect(email.text).toContain('https://example.com/reset-password?token=a&b=1');
    expect(email.html).toContain('href="https://example.com/reset-password?token=a&amp;b=1"');
    expect(email.html).toContain('60 minutes');
  });

  it('escapes user-controlled values', () => {
    const email = passwordResetEmail({
      username: '<script>alert(1)</script>',
      url: 'https://example.com/reset',
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });

  it('asks for verification with the 24h copy', () => {
    const email = verifyEmailEmail({
      username: 'hunter',
      url: 'https://example.com/verify-email?token=t',
      expiresHours: 24,
    });

    expect(email.subject).toBe('Verify your email for Platinum Showcase');
    expect(email.html).toContain('Verify my email');
    expect(email.html).toContain('24 hours');
  });

  it('includes the timestamp and a recovery link in the security notice', () => {
    const email = passwordChangedEmail({
      username: null,
      changedAt: new Date('2026-03-04T10:15:00.000Z'),
    });

    expect(email.subject).toBe('Your Platinum Showcase password changed');
    expect(email.text).toContain('trophy hunter');
    expect(email.text).toContain('UTC');
    expect(email.text).toContain('/forgot-password');
  });

  it('asks the new address to confirm with the 30-minute copy', () => {
    const email = emailChangeConfirmEmail({
      username: 'hunter',
      url: 'https://example.com/confirm-email-change?token=t',
      expiresMinutes: 30,
    });

    expect(email.subject).toBe('Confirm your new Platinum Showcase email');
    expect(email.html).toContain('Confirm new email');
    expect(email.html).toContain('30 minutes');
    expect(email.text).not.toContain('old@example.com');
  });

  it('warns the old address about a requested change', () => {
    const email = emailChangeRequestedEmail({
      username: 'hunter',
      newEmail: 'new@example.com',
      requestedAt: new Date('2026-03-04T10:15:00.000Z'),
    });

    expect(email.subject).toBe('Email change requested for Platinum Showcase');
    expect(email.text).toContain('new@example.com');
    expect(email.text).toContain('Secure my account');
    expect(email.text).toContain('/forgot-password');
  });

  it('tells the old address when the change completed', () => {
    const email = emailChangedEmail({
      username: 'hunter',
      newEmail: 'new@example.com',
      changedAt: new Date('2026-03-04T10:15:00.000Z'),
    });

    expect(email.subject).toBe('Your Platinum Showcase email changed');
    expect(email.text).toContain('new@example.com');
    expect(email.text).toContain('UTC');
  });

  it('welcomes the new address without leaking the old one', () => {
    const email = emailChangeActiveEmail({
      username: 'hunter',
      changedAt: new Date('2026-03-04T10:15:00.000Z'),
    });

    expect(email.subject).toBe('Your new Platinum Showcase email is active');
    expect(email.text).toContain('hunter');
    expect(email.text).not.toContain('@example.com');
  });

  it('asks passwordless accounts to confirm the deletion with a 30-minute link', () => {
    const email = accountDeleteConfirmEmail({
      username: 'hunter',
      url: 'https://example.com/confirm-account-delete?token=t',
      expiresMinutes: 30,
    });

    expect(email.subject).toBe(
      'Confirm the deletion of your Platinum Showcase account',
    );
    expect(email.html).toContain('Review and delete my account');
    expect(email.html).toContain('30 minutes');
    expect(email.text).toContain('can only be used once');
  });

  it('records the deletion without offering a way back', () => {
    const email = accountDeletedEmail({
      username: null,
      deletedAt: new Date('2026-03-04T10:15:00.000Z'),
    });

    expect(email.subject).toBe('Your Platinum Showcase account was deleted');
    expect(email.text).toContain('trophy hunter');
    expect(email.text).toContain('UTC');
    expect(email.text).toContain('cannot be restored');
  });
});
