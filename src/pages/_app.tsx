import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { InstallPWA } from "@/components/InstallPWA";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA support
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("ServiceWorker registration successful");
          },
          function (err) {
            console.log("ServiceWorker registration failed: ", err);
          }
        );
      });
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <InstallPWA />
      <Toaster />
    </>
  );
}
