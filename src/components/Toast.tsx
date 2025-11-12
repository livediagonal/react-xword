import React, { useEffect } from "react";
import "../styles/Toast.css";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type} ${isVisible ? "toast-visible" : ""}`}>
      <div className="toast-content">{message}</div>
    </div>
  );
};

export default Toast;
