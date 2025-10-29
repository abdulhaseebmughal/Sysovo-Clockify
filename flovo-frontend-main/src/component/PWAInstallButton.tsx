import { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowButton(false);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show button for iOS users
    if (iOS) {
      setShowButton(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      alert(
        'To install this app on iOS:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm'
      );
      return;
    }

    if (!deferredPrompt) return;

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("PWA installed");
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowButton(false);
  };

  const handleClose = () => {
    setShowButton(false);
    // Remember user dismissed for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (dismissed === "true") {
      setShowButton(false);
    }
  }, []);

  if (!showButton) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-end",
      }}
    >
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        style={{
          background: "linear-gradient(135deg, #CCFF00 0%, #a8d600 100%)",
          color: "#000",
          border: "none",
          borderRadius: "50px",
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(204, 255, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "all 0.3s ease",
          animation: "pulse 2s ease-in-out infinite",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 25px rgba(204, 255, 0, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(204, 255, 0, 0.4)";
        }}
      >
        <i className="fas fa-download" style={{ fontSize: "16px" }}></i>
        <span>Install App</span>
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 0, 0, 0.7)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
          e.currentTarget.style.transform = "scale(1)";
        }}
        title="Close"
      >
        <i className="fas fa-times"></i>
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(204, 255, 0, 0.4);
          }
          50% {
            box-shadow: 0 4px 30px rgba(204, 255, 0, 0.7);
          }
        }
      `}</style>
    </div>
  );
}
