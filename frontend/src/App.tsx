import React, { useState, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { createRouter } from "./AppRoutes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { clearUserData } from "./lib/localStorage";
import { verifyToken } from "./lib/auth";

function App() {
  const [extractionResults, setExtractionResults] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const verifyUser = async () => {
      const idToken = localStorage.getItem("token");
      const tokenType = localStorage.getItem("tokenType") || "";

      if (!idToken) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      try {
        const loginResponse = await verifyToken(idToken, tokenType);

        if (loginResponse?.isLogin) {
          setIsAuthenticated(true);
          setUser({
            email: loginResponse.user.email,
            name:
              loginResponse.tokenType === "social-login"
                ? loginResponse.user.email
                : loginResponse.user.email.split("@")[0][0].toUpperCase() +
                  loginResponse.user.email.split("@")[0].slice(1),
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    verifyUser();
  }, []);

  const handleLogin = (email: string, loginType: string) => {
    setIsAuthenticated(true);
    setUser({
      email,
      name:
        loginType === "social-login"
          ? email
          : email.charAt(0).toUpperCase() + email.slice(1).split("@")[0],
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    clearUserData();
  };

  const handleProcessComplete = (results: any[]) => {
    setExtractionResults(results);
  };

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ✅ Create router with props
  const router = createRouter({
    user,
    isAuthenticated,
    onLogin: handleLogin,
    onLogout: handleLogout,
    onProcessComplete: handleProcessComplete,
  });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  );
}

export default App;
