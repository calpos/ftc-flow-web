/**
 * Field checks shared by the auth forms (instant feedback) and the server
 * actions (the real gate). Each returns error copy, or undefined when valid.
 * Emails are trimmed; passwords never are.
 */

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Enter your email.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return undefined;
}

export function validatePassword(
  value: string,
  { requireLength }: { requireLength: boolean },
): string | undefined {
  if (!value) return "Enter your password.";
  if (requireLength && value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateConfirm(password: string, confirm: string): string | undefined {
  return password === confirm ? undefined : "Passwords don't match.";
}
