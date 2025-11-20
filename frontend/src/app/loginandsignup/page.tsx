/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        // Save token & role for future requests (like creating supervisor)
        localStorage.setItem("token", data.token);
        console.log(data.token)
        localStorage.setItem("role", data.user.role); // ADMIN
        localStorage.setItem("departmentId", ""); // admin doesn't need departmentId
        window.location.href = "/Dashboard"; // redirect admin to full dashboard
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
        // Save token & role for future requests
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.supervisor.role); // SUPERVISOR
        localStorage.setItem("departmentId", String(data.supervisor.departmentId));
        window.location.href = "/SupervisorDashboard"; // redirect supervisor to their department page
        return;
      }

      throw new Error("Invalid email or password");

    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Login to Your Dashboard
            </h1>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                  Forgot Password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition font-semibold"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t">
          <p className="text-center text-sm text-gray-500">
            © 2025 Production Flow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
