"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Progress bar animation
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    // Auto close
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-white",
      borderColor: "border-l-4 border-l-green-500",
      iconColor: "text-green-500",
      progressColor: "bg-green-500",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-white",
      borderColor: "border-l-4 border-l-red-500",
      iconColor: "text-red-500",
      progressColor: "bg-red-500",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-white",
      borderColor: "border-l-4 border-l-amber-500",
      iconColor: "text-amber-500",
      progressColor: "bg-amber-500",
    },
    info: {
      icon: Info,
      bgColor: "bg-white",
      borderColor: "border-l-4 border-l-[#2272B4]",
      iconColor: "text-[#2272B4]",
      progressColor: "bg-[#2272B4]",
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, progressColor } = config[type];

  return (
    <div
      className={`
        ${bgColor} ${borderColor}
        min-w-[320px] max-w-[420px] rounded-lg shadow-lg
        transform transition-all duration-300 ease-out overflow-hidden
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="text-sm text-gray-700 flex-1 leading-relaxed">{message}</p>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className={`h-full ${progressColor} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;
