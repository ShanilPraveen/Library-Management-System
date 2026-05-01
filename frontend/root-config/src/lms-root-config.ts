import { registerApplication, start, LifeCycles } from "single-spa";

// registerApplication({
//   name: "@single-spa/welcome",
//   app: () =>
//     import(
//       /* webpackIgnore: true */ // @ts-ignore-next
//       "https://unpkg.com/single-spa-welcome/dist/single-spa-welcome.js"
//     ),
//   activeWhen: ["/"],
// });

// Register container for authentication and routing logic
registerApplication({
  name:"@lms/container",
  app: () => System.import<any>("@lms/container"),
  activeWhen: ["/"],
})

// Register member portal app
registerApplication({
  name: "@lms/member-portal",
  app: () => System.import<any>("@lms/member-portal"),
  activeWhen: (location) => location.pathname.startsWith("/dashboard"),
})

// Register staff portal app
registerApplication({
  name: "@lms/staff-portal",
  app: () => System.import<any>("@lms/staff-portal"),
  activeWhen: (location) => location.pathname.startsWith("/staff"),
})

// Register auth app for login and password management
registerApplication({
  name: "@lms/auth-app",
  app: () => System.import<any>("@lms/auth-app"),
  activeWhen: (location) => 
    location.pathname === "/" || 
    location.pathname.startsWith("/login") || 
    location.pathname === "/set-new-password",
})

start({
  urlRerouteOnly: true,
});

console.log("LMS Root Config loaded");