export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  // Allows plus-addressing and most real-world emails without being overly strict
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
