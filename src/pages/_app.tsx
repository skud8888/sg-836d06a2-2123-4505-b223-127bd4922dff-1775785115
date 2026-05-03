import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/CommandPalette";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Component {...pageProps} />
          <Toaster />
          <CommandPalette />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
