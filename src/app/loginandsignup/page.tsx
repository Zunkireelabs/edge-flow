/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";

// Helper function to set cookies
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let data: any;

      // Try Admin login first
      let res = await fetch(
        `${process.env.NEXT_PUBLIC_API_LOGIN_URL_ADMIN}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (res.ok) {
        data = await res.json();
        // Set cookie for middleware authentication
        setCookie("token", data.token, 7);
        setCookie("role", data.user.role, 7);
        // Also keep localStorage for client-side access
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("departmentId", "");
        localStorage.setItem("userId", data.user.id?.toString() || "");
        localStorage.setItem("userName", data.user.name || "Admin");
        localStorage.setItem("userEmail", email);
        window.location.href = "/Dashboard";
        return;
      }

      // Try Supervisor login
      res = await fetch(
        `${process.env.NEXT_PUBLIC_API_LOGIN_URL_SUPERVISOR}/api/auth/supervisor-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (res.ok) {
        data = await res.json();
        // Set cookie for middleware authentication
        setCookie("token", data.token, 7);
        setCookie("role", data.supervisor.role, 7);
        // Also keep localStorage for client-side access
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.supervisor.role);
        localStorage.setItem("departmentId", String(data.supervisor.departmentId));
        localStorage.setItem("userId", data.supervisor.id?.toString() || "");
        localStorage.setItem("userName", data.supervisor.name || "Supervisor");
        localStorage.setItem("userEmail", email);
        window.location.href = "/SupervisorDashboard";
        return;
      }

      throw new Error("Invalid email or password");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Dark with features */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b3a4b] flex-col justify-center px-16 py-12">
        <div className="max-w-lg">
          {/* Main Heading */}
          <h1 className="text-[42px] font-semibold text-white leading-tight mb-4">
            Get started with BlueShark
          </h1>

          {/* Subtitle */}
          <p className="text-[20px] text-white/90 mb-10">
            Streamline production with all your data in one place
          </p>

          {/* Feature List */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" strokeWidth={3} />
              <span className="text-[17px] text-white/90">
                Track production progress across all departments
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" strokeWidth={3} />
              <span className="text-[17px] text-white/90">
                Manage workers and assign tasks efficiently
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" strokeWidth={3} />
              <span className="text-[17px] text-white/90">
                Monitor quality control and handle rejections
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Check className="w-6 h-6 text-emerald-400 flex-shrink-0" strokeWidth={3} />
              <span className="text-[17px] text-white/90">
                Calculate wages and generate reports instantly
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Light with form */}
      <div className="w-full lg:w-1/2 bg-[#f5f5f5] flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-[400px] px-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-semibold text-gray-800">BlueShark</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-[26px] font-semibold text-gray-900">Log in</h2>
              <p className="text-gray-500 mt-1 text-[15px]">
                Access your production dashboard
              </p>
            </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-[15px]"
                    placeholder="you@company.com"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-[15px]"
                    placeholder="Enter your password"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a73e8] text-white py-3 px-4 rounded-md hover:bg-[#1557b0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors font-medium text-[15px] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </form>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Contact admin for account access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
