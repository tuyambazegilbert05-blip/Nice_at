import { hasPermission, assertPermission, hasMinimumRole, canManageRole, UnauthorizedError } from '../../src/lib/permissions/rbac'
import { hashPassword, verifyPassword } from '../../src/lib/auth/passwords'
import { createSessionToken, verifySessionToken } from '../../src/lib/auth/jwt'
import { AuthUser } from '../../src/types/user'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`)
  }
}

async function runTests() {
  console.log('--- Testing Permissions & RBAC ---')

  // 1. Role Capabilities
  assert(hasPermission('ADMIN', 'session:create') === true, 'ADMIN can create session')
  assert(hasPermission('ADMIN', 'session:delete') === true, 'ADMIN can delete session')
  assert(hasPermission('ADMIN', 'users:manage') === true, 'ADMIN can manage users')

  assert(hasPermission('MANAGER', 'session:create') === true, 'MANAGER can create session')
  assert(hasPermission('MANAGER', 'session:delete') === false, 'MANAGER cannot delete session')
  assert(hasPermission('MANAGER', 'users:manage') === false, 'MANAGER cannot manage users')

  assert(hasPermission('STAFF', 'session:create') === false, 'STAFF cannot create session')
  assert(hasPermission('STAFF', 'qr:generate') === true, 'STAFF can generate QR')
  assert(hasPermission('STAFF', 'attendance:record') === true, 'STAFF can record attendance')

  assert(hasPermission('VIEWER', 'session:view') === true, 'VIEWER can view sessions')
  assert(hasPermission('VIEWER', 'attendance:export') === false, 'VIEWER cannot export attendance')
  assert(hasPermission('VIEWER', 'session:create') === false, 'VIEWER cannot create session')

  // 2. Role Hierarchy
  assert(hasMinimumRole('ADMIN', 'STAFF') === true, 'ADMIN satisfies STAFF minimum')
  assert(hasMinimumRole('MANAGER', 'MANAGER') === true, 'MANAGER satisfies MANAGER minimum')
  assert(hasMinimumRole('VIEWER', 'STAFF') === false, 'VIEWER does not satisfy STAFF minimum')

  // 3. assertPermission exception
  let threw = false
  try {
    assertPermission('STAFF', 'users:manage')
  } catch (err) {
    if (err instanceof UnauthorizedError) threw = true
  }
  assert(threw, 'assertPermission throws UnauthorizedError for unauthorized role')

  // 4. canManageRole
  assert(canManageRole('ADMIN', 'MANAGER') === true, 'ADMIN can manage MANAGER')
  assert(canManageRole('MANAGER', 'STAFF') === true, 'MANAGER can manage STAFF')
  assert(canManageRole('MANAGER', 'ADMIN') === false, 'MANAGER cannot manage ADMIN')
  assert(canManageRole('STAFF', 'MANAGER') === false, 'STAFF cannot manage MANAGER')

  console.log('✓ RBAC & permissions assertions passed.')

  console.log('--- Testing Password Cryptography ---')
  const pwd = 'NiCE@Rwanda2026!'
  const hash = hashPassword(pwd)
  assert(verifyPassword(pwd, hash) === true, 'Valid password verifies correctly')
  assert(verifyPassword('WrongPassword', hash) === false, 'Invalid password is rejected')
  console.log('✓ PBKDF2 password hashing & timing-safe verification passed.')

  console.log('--- Testing Session Token Signatures ---')
  const sampleUser: AuthUser = {
    id: 'usr_admin_001',
    name: 'Gilbert Niyitegeka',
    email: 'admin@niceclub.rw',
    role: 'ADMIN',
    hasCompletedOnboarding: false,
  }
  const token = createSessionToken(sampleUser, 3600)
  const decoded = verifySessionToken(token)
  assert(decoded !== null, 'Token verified successfully')
  assert(decoded?.email === sampleUser.email, 'Decoded user email matches')
  assert(decoded?.role === 'ADMIN', 'Decoded user role matches')

  // Tampered token test
  const tamperedToken = token.slice(0, -4) + 'abcd'
  assert(verifySessionToken(tamperedToken) === null, 'Tampered token signature is rejected')
  console.log('✓ HMAC-SHA256 session token generation and signature verification passed.')

  console.log('ALL AUTH & RBAC UNIT TESTS PASSED SUCCESSFULLY!')
}

runTests().catch((e) => {
  console.error(e)
  process.exit(1)
})
