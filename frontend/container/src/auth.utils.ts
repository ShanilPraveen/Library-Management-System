// import jwtDecode from "jwt-decode";

// interface JWTPayload {
//   userId: string;
//   cognitoId: string;
//   username: string;
//   role: "MEMBER" | "LIBRARIAN" | "ADMIN";
//   exp: number;
//   iat: number;
// }

// // get token from localStorage
// export const getToken = (): string | null => {
//   return localStorage.getItem("lms-token");
// };

// // set token in localStorage
// export const setToken = (token: string): void => {
//   localStorage.setItem("lms-token", token);
// };

// // clear token from localStorage
// export const clearToken = (): void => {
//   localStorage.removeItem("lms-token");
// };

// // decode JWT token using jwt-decode
// export const decodeToken = (token: string): JWTPayload | null => {
//   try {
//     const decoded = jwtDecode<JWTPayload>(token);
//     return decoded;
//   } catch (error) {
//     console.error("Failed to decode token:", error);
//     return null;
//   }
// };

// // check if token is expired by comparing exp with current time
// export const isTokenExpired = (token: string): boolean => {
//   const decoded = decodeToken(token);
//   if (!decoded) return true;

//   const currentTime = Date.now() / 1000;
//   return decoded.exp < currentTime;
// };

// // check if user is authenticated
// export const isAuthenticated = (): boolean => {
//   const token = getToken();
//   if (!token) {
//     return false;
//   }

//   const expired = isTokenExpired(token);

//   if (!expired) {
//     const decoded = decodeToken(token);
//   }

//   return !expired;
// };

// // get user role from decoded token
// export const getUserRole = (): "MEMBER" | "LIBRARIAN" | "ADMIN" | null => {
//   const token = getToken();
//   if (!token) return null;

//   const decoded = decodeToken(token);
//   if (!decoded) return null;

//   return decoded["custom:role"];
// };

// // get user ID from decoded token
// export const getUserId = (): string | null => {
//   const token = getToken();
//   if (!token) return null;

//   const decoded = decodeToken(token);
//   if (!decoded) return null;

//   return decoded["custom:userId"];
// };

// // get username from decoded token
// export function getUsername(): string {
//   const token = getToken();

//   if (!token) return "Guest";

//   const decoded = decodeToken(token);
//   if (!decoded) return "Guest";

//   return decoded["custom:username"] || "User";
// }

// // check if user has one of the required roles
// export const hasRole = (requiredRoles: string[]): boolean => {
//   const userRole = getUserRole();
//   if (!userRole) return false;

//   return requiredRoles.includes(userRole);
// };

// export function logout(): void {
//   localStorage.removeItem("lms-token");
//   window.location.href = "/";
// }
