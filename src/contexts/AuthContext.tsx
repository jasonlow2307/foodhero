import React, { createContext, useState, useEffect, useContext } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import Loader from "../components/Loader";
import { useTheme } from "./ThemeContext";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

// Create a default context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up persistence when the provider mounts
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        // Set persistence to LOCAL (survives browser restarts)
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.error("Error setting persistence:", error);
      }
    };

    setupPersistence();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      // Force clear localStorage for extra security
      localStorage.removeItem("currentPage");
      return Promise.resolve();
    } catch (error) {
      console.error("Error signing out:", error);
      return Promise.reject(error);
    }
  };

  // This effect runs once when the component mounts
  useEffect(() => {
    // Check for existing user immediately
    const currentAuthUser = auth.currentUser;

    // Set up the observer for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);

      // Update localStorage based on auth state
      if (user) {
        localStorage.setItem("currentPage", "home");
      } else {
        localStorage.setItem("currentPage", "auth");
      }
    });

    // Cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        <div
          className={`min-h-screen flex flex-col items-center justify-center bg-white
          `}
        >
          <Loader />
          <p
            className={`mt-6 font-medium animate-pulse text-gray-600
            `}
          >
            Loading your food journey...
          </p>
        </div>
      )}
    </AuthContext.Provider>
  );
};
