import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { loginUser, completeNewPassword } from "./authService";

interface User {
  userId: string;
  username: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  pendingUser: any | null; // For Cognito "New Password" flow
  login: (username: string, password: string, callbacks?: any) => void;
  setNewPassword: (newPassword: string, callbacks?: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      pendingUser: null,

      login: (username, password, callbacks) => {
        loginUser(username, password, {
          onSuccess: (tokens: any) => {
            const decoded: any = jwtDecode(tokens.idToken);
            const userData: User = {
              userId: decoded["custom:userId"],
              username: decoded["cognito:username"],
              role: decoded["custom:role"],
            };

            // Zustand updates state AND LocalStorage automatically
            set({
              token: tokens.idToken,
              user: userData,
              isAuthenticated: true,
              pendingUser: null,
            });

            //Clear session storage on successful login
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("temporaryPassword");

            callbacks?.onSuccess?.();
          },
          onNewPasswordRequired: (cognitoUser: any) => {
            // Store credentials in session storage for use after password change
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("temporaryPassword", password);
            // Store pending user in memory only
            set({ pendingUser: cognitoUser });
            callbacks?.onNewPasswordRequired?.();
          },
          onFailure: callbacks?.onFailure,
        });
      },

      setNewPassword: (newPassword, callbacks) => {
        const { pendingUser } = get();

        // If pendingUser is lost (e.g., page refresh), we cannot proceed.Need to recreate it.
        if (!pendingUser) {
          const username = sessionStorage.getItem("username");
          const temporaryPassword = sessionStorage.getItem("temporaryPassword");

          if (!username || !temporaryPassword) {
            callbacks?.onFailure?.(
              new Error("Session expired. Please login again.")
            );
            return;
          }

          // Re-login to recreate the CognitoUser object
          loginUser(username, temporaryPassword, {
            onNewPasswordRequired: (cognitoUser: any) => {
              completeNewPassword(cognitoUser, newPassword, {
                onSuccess: (tokens: any) => {
                  const decoded: any = jwtDecode(tokens.idToken);
                  const userData: User = {
                    userId: decoded["custom:userId"],
                    username: decoded["cognito:username"],
                    role: decoded["custom:role"],
                  };
                  set({
                    token: tokens.idToken,
                    user: userData,
                    isAuthenticated: true,
                    pendingUser: null,
                  });

                  //Clear session storage after successful password change
                  sessionStorage.removeItem("username");
                  sessionStorage.removeItem("temporaryPassword");
                  callbacks?.onSuccess?.();
                },
                onFailure: callbacks?.onFailure,
              });
            },
            onFailure: callbacks?.onFailure,
          });
          return;
        }

        completeNewPassword(pendingUser, newPassword, {
          onSuccess: (tokens: any) => {
            const decoded: any = jwtDecode(tokens.idToken);
            const userData: User = {
              userId: decoded["custom:userId"],
              username: decoded["cognito:username"],
              role: decoded["custom:role"],
            };

            set({
              token: tokens.idToken,
              user: userData,
              isAuthenticated: true,
              pendingUser: null,
            });

            //Clear session storage after successful password change
            sessionStorage.removeItem("username");
            sessionStorage.removeItem("temporaryPassword");
            callbacks?.onSuccess?.();
          },
          onFailure: callbacks?.onFailure,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          pendingUser: null,
        });
        localStorage.removeItem("lms-auth-storage");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("temporaryPassword");
        window.location.href = "/login";
      },
    }),
    {
      name: "lms-auth-storage", 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
