import React, { useEffect, useState } from "react";
import { mountRootParcel, navigateToUrl } from "single-spa";
import routesConfig from "./routes.json";
import {useAuthStore} from '@lms/auth-client';

interface Route {
  path: string;
  app: string;
  protected: boolean;
  exact?: boolean;
  roles?: string[];
}

const RootComponent: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore.getState();
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find the route that matches the current pathname from the routes.json
  const findMatchingRoute = (pathname: string): Route | null => {
    const exactMatch = routesConfig.routes.find(
      (route) => route.exact && route.path === pathname
    );
    if (exactMatch) return exactMatch;

    const match = routesConfig.routes.find(
      (route) => !route.exact && pathname.startsWith(route.path)
    );
    return match || null;
  };

  // Check if user can access the route based on authentication and roles
  const canAccessRoute = (route: Route): boolean => {
    if (!route.protected) return true;

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to /login");
      navigateToUrl("/login");
      return false;
    }

    if (route.roles && route.roles.length > 0) {
      if (!(route.roles.includes(user.role))) {
        const userRole = user.role;

        // Redirect based on user role
        if (userRole === "MEMBER") {
          navigateToUrl("/dashboard");
        } else if (userRole === "LIBRARIAN" || userRole === "ADMIN") {
          navigateToUrl("/staff");
        } else {
          navigateToUrl("/login");
        }
        return false;
      }
    }

    return true;
  };

  // Find the matching route,checks access, and set current route
  const handleRouteChange = () => {
    const pathname = window.location.pathname;
    const route = findMatchingRoute(pathname);

    if (!route) {
      navigateToUrl("/login");
      setIsLoading(false);
      return;
    }

    if (!canAccessRoute(route)) {
      setIsLoading(false);
      return;
    }

    setCurrentRoute(route);
    setIsLoading(false);
  };

  // Listen to route changes
  useEffect(() => {
    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("single-spa:routing-event", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("single-spa:routing-event", handleRouteChange);
    };
  }, []);

  useEffect(() => {
    if (currentRoute) {
      console.log(`Loading app: ${currentRoute.app}`);
    }
  }, [currentRoute]);

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentRoute) {
    return null;
  }

  return (
    <div id="lms-container" style={styles.container}>
      {/* Mount the correct microfrontend application */}
      <div id={`single-spa-application:${currentRoute.app}`}></div>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
  },
  loading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #3f51b5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

export default RootComponent;
