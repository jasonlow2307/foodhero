import { useEffect } from "react";
import { SnackbarProvider } from "notistack";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import WhatToEat from "./sections/WhatToEat/WhatToEat";
import { ScreenSizeProvider } from "./utils/responsiveUtils";
import HomePage from "./sections/HomePage/HomePage";
import Footer from "./sections/Footer/Footer";
import AuthPage from "./sections/AuthPage/AuthPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected Route component to handle auth redirects
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Separate component for content that needs auth
const AppContent = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect based on auth status
  useEffect(() => {
    if (!currentUser) {
      navigate("/auth", { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <ScreenSizeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        style={{
          marginTop: "20px",
        }}
      >
        {/* Only show header if user is logged in */}
        {currentUser && <Header />}

        <main>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/list"
              element={
                <ProtectedRoute>
                  <LocationList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add"
              element={
                <ProtectedRoute>
                  <LocationForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/what-to-eat"
              element={
                <ProtectedRoute>
                  <WhatToEat />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </SnackbarProvider>
    </ScreenSizeProvider>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
