import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { StudentChatSupport } from "@/components/StudentChatSupport";
import { CommandPalette } from "@/components/CommandPalette";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
      <StudentChatSupport />
      <CommandPalette />
    </ThemeProvider>
  );
}
