"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const Mail = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const Lock = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const User = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const Car = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <path d="M7 17h10" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

export default function App() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const url = `${API_BASE_URL}${endpoint}`;

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    if (!isLogin && !formData.username) {
      setError("Username is required for sign up.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      localStorage.setItem("user", JSON.stringify(data));
      setSuccessMessage(
        isLogin
          ? "Login successful! Welcome back."
          : "Account created successfully! Please log in."
      );
      router.push("/");

      if (!isLogin) {
        setIsLogin(true);
        setFormData({ username: "", email: "", password: "" });
      }
    } catch (err) {
      setError(err.message);
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFormMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccessMessage("");
    setFormData({ username: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8 transition-all duration-500">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-500 dark:bg-blue-600 p-3 rounded-full mb-4">
              <Car className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              {isLogin ? "Welcome Back!" : "Create an Account"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {isLogin
                ? "Sign in to access your parking tickets."
                : "Get started with our ticketing platform."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {error && (
              <div
                className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-md text-sm"
                role="alert"
              >
                <p>{error}</p>
              </div>
            )}
            {successMessage && (
              <div
                className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded-md text-sm"
                role="alert"
              >
                <p>{successMessage}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : isLogin ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleFormMode}
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400 ml-2 focus:outline-none"
              >
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} Parking Lot Platform. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}
