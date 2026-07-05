import { UserRole } from "@prisma/client";

export function isReviewerRole(role: UserRole): boolean {
  return role === UserRole.REVIEWER || role === UserRole.MASTER_ADMIN;
}

export function isMasterAdminRole(role: UserRole): boolean {
  return role === UserRole.MASTER_ADMIN;
}

export function resolveBootstrapRole(email: string): UserRole {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && email === adminEmail) {
    return UserRole.MASTER_ADMIN;
  }
  return UserRole.PARENT;
}
