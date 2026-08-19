"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, PlusSquare } from "lucide-react";

export function PwaPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneQuery = window.matchMedia("(display-mode: standalone)").matches;
    // @ts-ignore
    const isIOSStandalone = window.navigator.standalone === true;
    if (isStandaloneQuery || isIOSStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    setIsIOS(isIOSDevice);

    // Listen for Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem("pwaPromptDismissed")) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If it's iOS and not standalone, we can optionally show the prompt
    let timeout: NodeJS.Timeout;
    if (isIOSDevice && !localStorage.getItem("pwaPromptDismissed")) {
      timeout = setTimeout(() => setShowPrompt(true), 1500); // reduced timeout
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // For iOS, the prompt is informational, they have to click the button.
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] sm:p-6"
      >
        <div className="max-w-md mx-auto bg-card/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 overflow-hidden">
             <img src="/logo.png" alt="App Icon" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-sm">Install Bingo Arena</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isIOS ? (
                <>
                  Install this app on your device for the best experience. Tap <Share className="inline w-3 h-3 mx-1" /> then "Add to Home Screen" <PlusSquare className="inline w-3 h-3 mx-1" />
                </>
              ) : (
                "Install our app on your device for a faster, full-screen experience."
              )}
            </p>
            
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App
              </button>
            )}
          </div>
          
          <button 
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
