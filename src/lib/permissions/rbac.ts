import { UserRole, Permission } from '../../types/user'
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from './roles'

export class UnauthorizedError extends Error {
  constructor(message = 'Insufficient permissions to perform this operation') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Checks whether a given role possesses a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Throws UnauthorizedError if the role does not have the required permission.
 */
export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new UnauthorizedError(`Role '${role}' lacks required permission '${permission}'`)
  }
}

/**
 * Checks if the user's role meets or exceeds the minimum required role hierarchy.
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const userRank = ROLE_HIERARCHY[userRole] ?? 0
  const minRank = ROLE_HIERARCHY[minimumRole] ?? 0
  return userRank >= minRank
}

/**
 * Determines whether an actor role can manage (create, edit, demote) another role.
 * e.g., Admins can manage all; Managers cannot promote anyone to Admin.
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'ADMIN') return true
  const actorRank = ROLE_HIERARCHY[actorRole] ?? 0
  const targetRank = ROLE_HIERARCHY[targetRole] ?? 0
  return actorRank > targetRank
}

/**
 * Helper to check permissions on an auth user object.
 */
export function checkUserPermission(
  user: { role: UserRole } | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false
  return hasPermission(user.role, permission)
}
