import "@/styles/globals.css";
import "driver.js/dist/driver.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { useEffect } from "react";
import { performanceMonitor } from "@/services/performanceMonitor";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Track page views with performance monitoring
    const handleRouteChange = (url: string) => {
      performanceMonitor.trackPageView(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to monitoring service
    console.error("Global error caught:", error, errorInfo);
    
    // TODO: Send to error tracking service (Sentry, etc.)
  };

  return (
    <ErrorBoundary level="global" onError={handleError}>
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster />
        <FeedbackWidget />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
