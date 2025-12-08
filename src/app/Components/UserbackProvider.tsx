"use client";

import { useEffect } from "react";
import Userback from "@userback/widget";

const USERBACK_TOKEN = process.env.NEXT_PUBLIC_USERBACK_TOKEN || "";

export default function UserbackProvider() {
  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined") return;

    // Get user data from localStorage
    const userId = localStorage.getItem("userId") || "unknown";
    const userName = localStorage.getItem("userName") || "User";
    const userEmail = localStorage.getItem("userEmail") || "";
    const userRole = localStorage.getItem("role") || "";
    const departmentId = localStorage.getItem("departmentId") || "";

    // Initialize Userback (works for all users, logged in or not)
    try {
      Userback(USERBACK_TOKEN, {
        user_data: {
          id: userId,
          info: {
            name: userName,
            email: userEmail,
          },
        },
        // Custom data to help identify feedback context
        custom_data: {
          role: userRole,
          department_id: departmentId,
        },
      });
      console.log("Userback initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Userback:", error);
    }
  }, []);

  return null; // This component doesn't render anything
}
