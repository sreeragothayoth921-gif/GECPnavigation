import { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isUser(user: AuthUser | null): boolean {
  return user?.role === "USER";
}

export function canEdit(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function canDelete(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function canManageUsers(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}
