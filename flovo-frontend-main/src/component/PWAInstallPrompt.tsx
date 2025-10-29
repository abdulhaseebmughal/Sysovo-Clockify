import { useState, useEffect } from "react";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faXmark } from "@fortawesome/free-solid-svg-icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return; // Already installed
    }

    // Check if dismissed within last 24 hours
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (dismissedTime > oneDayAgo) {
        return; // Still within 24 hour cooldown
      }
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt after 5 seconds even if no event (for testing/iOS)
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        setShowPrompt(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show instructions for iOS/other browsers
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert(
          'To install Sysovo on iOS:\n\n' +
          '1. Tap the Share button (square with arrow)\n' +
          '2. Scroll down and tap "Add to Home Screen"\n' +
          '3. Tap "Add" to confirm\n\n' +
          'You\'ll then be able to open Sysovo like a native app!'
        );
      } else {
        alert(
          'To install Sysovo:\n\n' +
          '1. Click the menu (⋮) in your browser\n' +
          '2. Select "Install Sysovo" or "Add to Home screen"\n' +
          '3. Follow the prompts to install\n\n' +
          'Once installed, you can access it like a native app!'
        );
      }
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if prompt not enabled
  if (!showPrompt) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: { xs: "calc(100% - 40px)", sm: 350 },
        maxWidth: 350,
        p: 2.5,
        zIndex: 1000,
        bgcolor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "var(--text-primary)",
            fontSize: "16px",
          }}
        >
          Install Sysovo
        </Typography>
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{
            color: "var(--text-secondary)",
            "&:hover": {
              bgcolor: "var(--bg-hover)",
            },
          }}
        >
          <FontAwesomeIcon icon={faXmark} />
        </IconButton>
      </Box>

      <Typography
        variant="body2"
        sx={{
          color: "var(--text-secondary)",
          mb: 2,
          fontSize: "14px",
        }}
      >
        Install this app on your device for quick access and offline support.
      </Typography>

      <Button
        variant="contained"
        fullWidth
        onClick={handleInstall}
        startIcon={<FontAwesomeIcon icon={faDownload} />}
        sx={{
          borderRadius: "8px",
          py: 1.2,
          bgcolor: "var(--primary)",
          color: "#000",
          fontWeight: 700,
          textTransform: "none",
          fontSize: "14px",
          boxShadow: "none",
          "&:hover": {
            bgcolor: "var(--primary-hover)",
            boxShadow: "0 4px 16px rgba(204, 255, 0, 0.3)",
          },
        }}
      >
        Install App
      </Button>
    </Paper>
  );
}
