import { useAuthStore } from "@lms/auth-client";

export function getToken(): string | null {
  return useAuthStore.getState().token || null;
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

export function getUserRole(): string | null {
  const user = useAuthStore.getState().user;
  return user ? user.role : null;
}

export function getUsername(): string {
  const user = useAuthStore.getState().user;
  return user ? user.username : "Guest";
}

export function getUserId(): string | null {
  const user = useAuthStore.getState().user;
  return user ? user.userId : null;
}

export function logout(): void {
  useAuthStore.getState().logout();
}
