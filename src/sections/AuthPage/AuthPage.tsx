import React, { useEffect, useState } from "react";
import {
  Leaf,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  EyeOff,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
  Auth,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { enqueueSnackbar, closeSnackbar } from "notistack";
import { getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Helper function to get friendly error messages
const getAuthErrorMessage = (error: AuthError): string => {
  const errorCode = error.code;

  // Map Firebase error codes to user-friendly messages
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please log in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/user-not-found":
      return "No account found with this email. Please sign up instead.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid login credentials. Please check your email and password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled. Please try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email but different sign-in credentials.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not allowed. Please contact support.";
    case "auth/requires-recent-login":
      return "This action requires you to re-login. Please sign in again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-token-expired":
      return "Your session has expired. Please sign in again.";
    case "auth/web-storage-unsupported":
      return "Web storage is not supported by your browser. Please try a different browser.";
    default:
      return error.message || "An unknown error occurred. Please try again.";
  }
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const { currentUser } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear errors when user starts typing
    if (error) setError("");

    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple form validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login user
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        console.log("Login successful");
        enqueueSnackbar("Successfully logged in!", {
          variant: "success",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });

        // Check if user document exists, if not create it
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          // Create user document for returning users without a document
          await setDoc(doc(db, "users", user.uid), {
            name: user.displayName || formData.email.split("@")[0],
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            authProvider: "email",
            lastLogin: serverTimestamp(),
          });
        } else {
          // Update last login time
          await setDoc(
            doc(db, "users", user.uid),
            {
              lastLogin: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } else {
        // Registration validation
        if (!formData.name) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;
        if (user) {
          // Update the user profile with name
          await updateProfile(user, {
            displayName: formData.name,
          });

          // Create user document in Firestore
          await setDoc(doc(db, "users", user.uid), {
            name: formData.name,
            email: formData.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            authProvider: "email",
            lastLogin: serverTimestamp(),
          });

          console.log("Registration successful");
          enqueueSnackbar("Account created successfully!", {
            variant: "success",
            action: (snackbarId) => (
              <button
                onClick={() => {
                  closeSnackbar(snackbarId);
                }}
              >
                Dismiss
              </button>
            ),
          });
        }
      }

      // Navigate after successful auth
      navigate("/");
    } catch (err) {
      console.error("Authentication error:", err);

      if (err && typeof err === "object" && "code" in err) {
        // Handle Firebase Auth errors
        const message = getAuthErrorMessage(err as AuthError);
        setError(message);
        enqueueSnackbar(message, {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      } else if (err instanceof Error) {
        setError(err.message);
        enqueueSnackbar(err.message, {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      } else {
        setError("An unknown error occurred");
        enqueueSnackbar("An unknown error occurred", {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      // Sign in with popup
      const result = await signInWithPopup(auth, provider);

      console.log("Google sign-in successful");
      enqueueSnackbar("Successfully signed in with Google!", {
        variant: "success",
        action: (snackbarId) => (
          <button
            onClick={() => {
              closeSnackbar(snackbarId);
            }}
          >
            Dismiss
          </button>
        ),
      });

      // Get Google user info
      const user = result.user;

      // Store additional user data in Firestore if needed
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        // First-time Google sign-in, create user document
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          authProvider: "google",
          lastLogin: serverTimestamp(),
        });
      } else {
        // Update last login time
        await setDoc(
          doc(db, "users", user.uid),
          {
            lastLogin: serverTimestamp(),
          },
          { merge: true }
        );
      }

      navigate("/");
    } catch (err) {
      console.error("Google authentication error:", err);

      if (err && typeof err === "object" && "code" in err) {
        // Handle Firebase Auth errors
        const message = getAuthErrorMessage(err as AuthError);
        setError(message);
        enqueueSnackbar(message, {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      } else if (err instanceof Error) {
        setError(err.message);
        enqueueSnackbar(err.message, {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      } else {
        setError("Google sign-in failed. Please try again.");
        enqueueSnackbar("Google sign-in failed", {
          variant: "error",
          action: (snackbarId) => (
            <button
              onClick={() => {
                closeSnackbar(snackbarId);
              }}
            >
              Dismiss
            </button>
          ),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="text-green-500 mr-2" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Food Hero
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {isLogin
              ? "Welcome back, food waste warrior!"
              : "Join the food waste reduction movement!"}
          </p>
        </div>

        {/* Error Message Display
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mr-2" />
            <span className="flex-grow">{error}</span>
            <button
              onClick={() => setError("")}
              className="flex-shrink-0 ml-2 text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        )} */}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Name field for registration */}
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  error && !formData.name && !isLogin
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-green-400"
                } focus:outline-none transition-colors`}
                aria-invalid={
                  error && !formData.name && !isLogin ? "true" : "false"
                }
              />
              <UserPlus
                className={`absolute right-3 top-3 ${
                  error && !formData.name && !isLogin
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
                size={20}
              />
            </div>
          )}

          {/* Email Input */}
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                error && !formData.email
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-green-400"
              } focus:outline-none transition-colors`}
              aria-invalid={error && !formData.email ? "true" : "false"}
            />
            <Mail
              className={`absolute right-3 top-3 ${
                error && !formData.email ? "text-red-400" : "text-gray-400"
              }`}
              size={20}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                error && !formData.password
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-green-400"
              } focus:outline-none transition-colors`}
              aria-invalid={error && !formData.password ? "true" : "false"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-3 ${
                error && !formData.password ? "text-red-400" : "text-gray-400"
              } hover:text-green-500 transition-colors`}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isLogin ? (
              <>
                <LogIn size={20} /> Log In
              </>
            ) : (
              <>
                <UserPlus size={20} /> Sign Up
              </>
            )}
          </button>

          {/* Switch between Login and Register */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors cursor-pointer"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </form>

        {/* Optional Social Login */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-px bg-gray-300 w-full mr-4"></div>
            <span className="text-gray-500 text-sm">Or</span>
            <div className="h-px bg-gray-300 w-full ml-4"></div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="bg-white border border-gray-200 p-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label="Google Login"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.94-2.91l-3.86-3c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C2.745 21.1 7.255 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.995 11.995 0 000 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.78 0 3.37.61 4.62 1.81l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-5 0-9.51 2.91-11.48 7.16l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
            </button>
            {/* You might want to disable the Apple button if not implemented */}
            {/* <button
              disabled
              className="bg-white border border-gray-200 p-3 rounded-full opacity-50 cursor-not-allowed"
              aria-label="Apple Login (Coming Soon)"
              title="Coming Soon"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 0C9.62 0 7.59 1.85 7.59 4.12c0 2.27 1.92 4.12 4.41 4.12 2.49 0 4.41-1.85 4.41-4.12C16.41 1.85 14.38 0 12 0zm0 18.22c-2.49 0-4.41-1.85-4.41-4.12v-2.06C4.06 14.52 0 18.75 0 23.88c0 .07.01.14.01.22h23.98c0-.08.01-.15.01-.22 0-5.13-4.06-9.36-7.59-11.84v2.06c0 2.27-1.92 4.12-4.41 4.12z" />
              </svg>
            </button> */}
          </div>
        </div>
      </div>

      {/* Background Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .floating-background {
          position: fixed;
          z-index: -1;
          opacity: 0.3;
        }

        .floating-background:nth-child(1) {
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .floating-background:nth-child(2) {
          top: 60%;
          right: 15%;
          animation-delay: 1s;
        }

        .floating-background:nth-child(3) {
          bottom: 20%;
          left: 5%;
          animation-delay: 0.5s;
        }
      `}</style>

      {/* Floating Background Elements */}
      <div className="floating-background text-4xl sm:text-5xl animate-float">
        🥗
      </div>
      <div className="floating-background text-4xl sm:text-5xl animate-float">
        🍲
      </div>
      <div className="floating-background text-4xl sm:text-5xl animate-float">
        🥑
      </div>
    </div>
  );
};

export default AuthPage;
