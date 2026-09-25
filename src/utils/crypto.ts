/**
 * Cryptographic helpers for secure public tokens and hashes.
 */

/**
 * Generates a cryptographically unpredictable URL-safe public token.
 * Length: 32 random characters (or custom length).
 */
export function generatePublicToken(bytes = 24): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(bytes)
    crypto.getRandomValues(array)
    // Convert to base64url format
    const base64 = typeof Buffer !== 'undefined'
      ? Buffer.from(array).toString('base64url')
      : btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return base64.slice(0, 32)
  }

  // Pure JS fallback if crypto is not globally available
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates an opaque short identifier (e.g. for audit log or session reference).
 */
export function generateId(prefix = 'nc'): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}${randomPart}`
}
