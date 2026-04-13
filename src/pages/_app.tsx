import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { InstallPWA } from "@/components/InstallPWA";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GlobalSearch />
        <InstallPWA />
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
