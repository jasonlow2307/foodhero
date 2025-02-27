import React, { useEffect, useState } from "react";
import { Leaf, LogIn, UserPlus, Mail, Lock, EyeOff, Eye } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { enqueueSnackbar } from "notistack";

interface AuthPageProps {
  setPage: (page: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setPage }) => {
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
      setPage("home");
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      if (isLogin) {
        // Login user
        const userCredentials = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        console.log(userCredentials.user);
        localStorage.setItem("currentPage", "home");

        enqueueSnackbar("Successfully logged in!", {
          variant: "success",
        });

        // The AuthContext will handle updating the user state
        setPage("home");
      } else {
        // Register user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const user = userCredential.user;
        if (user) {
          await updateProfile(user, {
            displayName: formData.name,
          });

          localStorage.setItem("currentPage", "home");

          enqueueSnackbar("Account created successfully!", {
            variant: "success",
          });

          // The AuthContext will handle updating the user state
          setPage("home");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        enqueueSnackbar(err.message, { variant: "error" });
      } else {
        setError("An unknown error occurred");
        enqueueSnackbar("An unknown error occurred", { variant: "error" });
      }
      console.error("Authentication error:", err);
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
              Food Waste Hero
            </h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            {isLogin
              ? "Welcome back, food waste warrior!"
              : "Join the food waste reduction movement!"}
          </p>
        </div>

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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
              />
              <UserPlus
                className="absolute right-3 top-3 text-gray-400"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
            />
            <Mail className="absolute right-3 top-3 text-gray-400" size={20} />
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-400 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-green-500 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium hover: cursor-pointer"
          >
            {isLogin ? (
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
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors hover: cursor-pointer"
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
              className="bg-white border border-gray-200 p-3 rounded-full hover:bg-gray-50 transition-colors hover: cursor-pointer"
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
            <button
              className="bg-white border border-gray-200 p-3 rounded-full hover:bg-gray-50 transition-colors hover: cursor-pointer"
              aria-label="Apple Login"
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 0C9.62 0 7.59 1.85 7.59 4.12c0 2.27 1.92 4.12 4.41 4.12 2.49 0 4.41-1.85 4.41-4.12C16.41 1.85 14.38 0 12 0zm0 18.22c-2.49 0-4.41-1.85-4.41-4.12v-2.06C4.06 14.52 0 18.75 0 23.88c0 .07.01.14.01.22h23.98c0-.08.01-.15.01-.22 0-5.13-4.06-9.36-7.59-11.84v2.06c0 2.27-1.92 4.12-4.41 4.12z" />
              </svg>
            </button>
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
