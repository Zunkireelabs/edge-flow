"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";

type ConfirmType = "danger" | "warning" | "info";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  onConfirm,
  onCancel,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    danger: {
      icon: AlertTriangle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBg: "bg-red-600 hover:bg-red-700",
      confirmText: "text-white",
    },
    warning: {
      icon: AlertCircle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmBg: "bg-amber-600 hover:bg-amber-700",
      confirmText: "text-white",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100",
      iconColor: "text-[#2272B4]",
      confirmBg: "bg-[#2272B4] hover:bg-[#0E538B]",
      confirmText: "text-white",
    },
  };

  const { icon: Icon, iconBg, iconColor, confirmBg, confirmText: confirmTextColor } = config[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ backdropFilter: "blur(4px)" }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4
          transform transition-all duration-300 ease-out
          ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
        `}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-lg ${confirmBg} ${confirmTextColor} font-medium transition-colors shadow-sm`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
