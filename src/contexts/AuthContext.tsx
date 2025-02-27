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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-t-4 border-green-500 border-solid rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading your account...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
