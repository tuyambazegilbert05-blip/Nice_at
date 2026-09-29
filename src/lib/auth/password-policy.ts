export const PASSWORD_MIN_LENGTH = 6
export const PASSWORD_MAX_LENGTH = 200

export const PASSWORD_POLICY_MESSAGE = 'Use at least 6 characters with uppercase and lowercase letters, a number, and a symbol.'

export function getPasswordChecks(password: string) {
  return [
    { label: `At least ${PASSWORD_MIN_LENGTH} characters`, valid: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'One number', valid: /\d/.test(password) },
    { label: 'One symbol', valid: /[^A-Za-z0-9]/.test(password) },
    { label: `No more than ${PASSWORD_MAX_LENGTH} characters`, valid: password.length <= PASSWORD_MAX_LENGTH },
  ]
}

export function isStrongPassword(password: string) {
  return password.length <= PASSWORD_MAX_LENGTH && getPasswordChecks(password).every((check) => check.valid)
}
